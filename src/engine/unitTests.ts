import { ScoringService } from './scoring';
import { TiebreakerService } from './tiebreaker';
import { PlayoffService } from './playoffs';
import { StandingsService } from './standings';
import { StandingsRow } from '../types';

export interface TestResultItem {
  id: string;
  name: string;
  category: 'SCORING' | 'TEAM' | 'DNF' | 'TIEBREAKER' | 'PLAYOFFS' | 'QUOTA';
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export class LeagueUnitTester {
  /**
   * Executes the full authoritative suite of league unit tests.
   */
  public static runAllTests(): {
    passed: boolean;
    total: number;
    passedCount: number;
    failedCount: number;
    results: TestResultItem[];
    durationMs: number;
  } {
    const startTime = performance.now();
    const results: TestResultItem[] = [];

    // 1. Scoring boundaries tests
    const boundaryCases = [
      { input: -20, expected: 45, label: '-20 to par' },
      { input: -19, expected: 45, label: '-19 to par (boundary)' },
      { input: -18, expected: 40, label: '-18 to par (boundary)' },
      { input: -13, expected: 40, label: '-13 to par (boundary)' },
      { input: -12, expected: 36, label: '-12 to par (boundary)' },
      { input: -7,  expected: 36, label: '-7 to par (boundary)' },
      { input: -6,  expected: 32, label: '-6 to par (boundary)' },
      { input: -1,  expected: 32, label: '-1 to par (boundary)' },
      { input: 0,   expected: 30, label: 'Even par (0)' },
      { input: 1,   expected: 24, label: '+1 to par (boundary)' },
      { input: 6,   expected: 24, label: '+6 to par (boundary)' },
      { input: 7,   expected: 18, label: '+7 to par (boundary)' },
      { input: 12,  expected: 18, label: '+12 to par (boundary)' },
      { input: 13,  expected: 12, label: '+13 to par (boundary)' },
      { input: 20,  expected: 12, label: '+20 to par' }
    ];

    boundaryCases.forEach((tc, idx) => {
      const actual = ScoringService.convertRelativeToParToLeaguePoints(tc.input, false);
      results.push({
        id: `scoring-${idx + 1}`,
        name: `Scoring Boundary: ${tc.label} → ${tc.expected} pts`,
        category: 'SCORING',
        expected: `${tc.expected} pts`,
        actual: `${actual} pts`,
        passed: actual === tc.expected
      });
    });

    // 2. Team Calculation Test: 36 + 32 - 60 = +8
    const teamRes = ScoringService.calculateTeamResult(
      65, // -7 on par 72 => 36 pts
      false,
      68, // -4 on par 72 => 32 pts
      false,
      72, // Par 72
      60  // Quota 60
    );
    results.push({
      id: 'team-calc-1',
      name: 'Team Calculation: Player A (36) + Player B (32) - Quota (60) = +8',
      category: 'TEAM',
      expected: 'Team Points: 68, Net Result: +8',
      actual: `Team Points: ${teamRes.teamPoints}, Net Result: ${teamRes.weeklyNetResult > 0 ? `+${teamRes.weeklyNetResult}` : teamRes.weeklyNetResult}`,
      passed: teamRes.teamPoints === 68 && teamRes.weeklyNetResult === 8
    });

    // 3. DNF Calculation Test: DNF (12) + 36 - 60 = -12
    const dnfRes = ScoringService.calculateTeamResult(
      null,
      true, // DNF
      65,   // -7 on par 72 => 36 pts
      false,
      72,
      60
    );
    results.push({
      id: 'dnf-calc-1',
      name: 'DNF Calculation: Player A (DNF=12) + Player B (36) - Quota (60) = -12',
      category: 'DNF',
      expected: 'Team Points: 48, Net Result: -12, Gross: null',
      actual: `Team Points: ${dnfRes.teamPoints}, Net Result: ${dnfRes.weeklyNetResult}`,
      passed: dnfRes.playerAPoints === 12 && dnfRes.teamPoints === 48 && dnfRes.weeklyNetResult === -12
    });

    // 4. Tiebreaker Engine Test: Tied Net Results (+8 vs +8), resolved by lower individual gross score
    // Team A: Low gross 66, Second gross 74 -> Net +8
    // Team B: Low gross 68, Second gross 72 -> Net +8
    // Team A should win because 66 < 68
    const tieRes1 = TiebreakerService.resolveFixtureMatch(
      8, 66, 74,
      8, 68, 72
    );
    results.push({
      id: 'tiebreaker-1',
      name: 'Tiebreaker: Tied Net Result (+8 vs +8) resolved by Lowest Gross (66 vs 68)',
      category: 'TIEBREAKER',
      expected: 'Winner: TEAM_A (Resolved by LOWEST_GROSS)',
      actual: `Winner: ${tieRes1.winner} (Resolved by ${tieRes1.resolvedBy})`,
      passed: tieRes1.winner === 'TEAM_A' && tieRes1.resolvedBy === 'LOWEST_GROSS'
    });

    // Tiebreaker 2: Tied Net Result (+8 vs +8) and tied lowest gross (67 vs 67), resolved by second gross (71 vs 73)
    const tieRes2 = TiebreakerService.resolveFixtureMatch(
      8, 67, 71,
      8, 67, 73
    );
    results.push({
      id: 'tiebreaker-2',
      name: 'Tiebreaker: Tied 1st Gross (67 vs 67) resolved by Second Gross (71 vs 73)',
      category: 'TIEBREAKER',
      expected: 'Winner: TEAM_A (Resolved by SECOND_GROSS)',
      actual: `Winner: ${tieRes2.winner} (Resolved by ${tieRes2.resolvedBy})`,
      passed: tieRes2.winner === 'TEAM_A' && tieRes2.resolvedBy === 'SECOND_GROSS'
    });

    // 5. Playoff Qualification & Bracket Generation: 1 vs 4, 2 vs 3
    const mockStandings: StandingsRow[] = [
      { position: 1, teamId: 101, teamName: 'Eagles', playerAName: 'A1', playerBName: 'A2', playerAId: 1, playerBId: 2, played: 15, wins: 12, draws: 1, losses: 2, seasonPoints: 25, totalTeamPoints: 1050, totalNetResult: 90, avgNetResult: 6.0, currentQuota: 64, quotaLocked: true, status: 'PLAYOFF' },
      { position: 2, teamId: 102, teamName: 'Birdies', playerAName: 'B1', playerBName: 'B2', playerAId: 3, playerBId: 4, played: 15, wins: 11, draws: 2, losses: 2, seasonPoints: 24, totalTeamPoints: 1040, totalNetResult: 80, avgNetResult: 5.33, currentQuota: 62, quotaLocked: true, status: 'PLAYOFF' },
      { position: 3, teamId: 103, teamName: 'Albatross', playerAName: 'C1', playerBName: 'C2', playerAId: 5, playerBId: 6, played: 15, wins: 10, draws: 1, losses: 4, seasonPoints: 21, totalTeamPoints: 1020, totalNetResult: 60, avgNetResult: 4.0, currentQuota: 60, quotaLocked: true, status: 'PLAYOFF' },
      { position: 4, teamId: 104, teamName: 'Condors', playerAName: 'D1', playerBName: 'D2', playerAId: 7, playerBId: 8, played: 15, wins: 9, draws: 2, losses: 4, seasonPoints: 20, totalTeamPoints: 1010, totalNetResult: 50, avgNetResult: 3.33, currentQuota: 58, quotaLocked: true, status: 'PLAYOFF' },
      { position: 5, teamId: 105, teamName: 'Pars', playerAName: 'E1', playerBName: 'E2', playerAId: 9, playerBId: 10, played: 15, wins: 8, draws: 1, losses: 6, seasonPoints: 17, totalTeamPoints: 980, totalNetResult: 20, avgNetResult: 1.33, currentQuota: 56, quotaLocked: true, status: 'CONSOLATION' },
      { position: 6, teamId: 106, teamName: 'Bogeys', playerAName: 'F1', playerBName: 'F2', playerAId: 11, playerBId: 12, played: 15, wins: 7, draws: 1, losses: 7, seasonPoints: 15, totalTeamPoints: 960, totalNetResult: 0, avgNetResult: 0.0, currentQuota: 54, quotaLocked: true, status: 'CONSOLATION' },
    ];

    const sfGen = PlayoffService.generateSemifinals(1, mockStandings, 1);
    const sf1 = sfGen.playoffMatches[0];
    const sf2 = sfGen.playoffMatches[1];

    results.push({
      id: 'playoff-bracket-1',
      name: 'Playoff Bracket Seed 1 vs Seed 4 (Eagles vs Condors)',
      category: 'PLAYOFFS',
      expected: 'SF1: Seed 1 (101) vs Seed 4 (104)',
      actual: `SF1: Seed ${sf1.seedA} (${sf1.teamAId}) vs Seed ${sf1.seedB} (${sf1.teamBId})`,
      passed: sf1.seedA === 1 && sf1.seedB === 4 && sf1.teamAId === 101 && sf1.teamBId === 104
    });

    results.push({
      id: 'playoff-bracket-2',
      name: 'Playoff Bracket Seed 2 vs Seed 3 (Birdies vs Albatross)',
      category: 'PLAYOFFS',
      expected: 'SF2: Seed 2 (102) vs Seed 3 (103)',
      actual: `SF2: Seed ${sf2.seedA} (${sf2.teamAId}) vs Seed ${sf2.seedB} (${sf2.teamBId})`,
      passed: sf2.seedA === 2 && sf2.seedB === 3 && sf2.teamAId === 102 && sf2.teamBId === 103
    });

    // 6. Championship Generation: SF Winners advance
    const champGen = PlayoffService.generateChampionshipMatch(1, 101, 102, 'Eagles', 'Birdies', 1);
    results.push({
      id: 'champ-gen-1',
      name: 'Championship Match Generation from Semifinal Winners',
      category: 'PLAYOFFS',
      expected: 'Championship: Team 101 vs Team 102 (Week 17)',
      actual: `Championship: Team ${champGen.fixture.teamAId} vs Team ${champGen.fixture.teamBId} (Week ${champGen.fixture.weekNumber})`,
      passed: champGen.fixture.teamAId === 101 && champGen.fixture.teamBId === 102 && champGen.fixture.weekNumber === 17
    });

    const endTime = performance.now();
    const passedCount = results.filter(r => r.passed).length;
    const failedCount = results.length - passedCount;

    return {
      passed: failedCount === 0,
      total: results.length,
      passedCount,
      failedCount,
      results,
      durationMs: Math.round(endTime - startTime)
    };
  }
}
