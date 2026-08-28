import { PlayoffMatch, StandingsRow, Team, Season, Fixture, FixtureStatus } from '../types';

export interface FinalisationResult {
  success: boolean;
  message: string;
  top4: StandingsRow[];
  consolationTeams: StandingsRow[];
  semifinal1?: PlayoffMatch;
  semifinal2?: PlayoffMatch;
  fixturesCreated?: Fixture[];
}

export class PlayoffService {
  /**
   * Generates playoff bracket matches based on final standings (Top 4).
   * Seed 1 vs Seed 4
   * Seed 2 vs Seed 3
   */
  public static generateSemifinals(
    seasonId: number,
    standings: StandingsRow[],
    courseId: number = 1
  ): { playoffMatches: PlayoffMatch[]; fixtures: Partial<Fixture>[] } {
    if (standings.length < 4) {
      throw new Error('Cannot generate semifinals: Less than 4 teams in standings.');
    }

    const seed1 = standings[0];
    const seed2 = standings[1];
    const seed3 = standings[2];
    const seed4 = standings[3];

    const sf1: PlayoffMatch = {
      id: Date.now(),
      seasonId,
      round: 'SEMIFINAL',
      seedA: 1,
      seedB: 4,
      teamAId: seed1.teamId,
      teamBId: seed4.teamId,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sf2: PlayoffMatch = {
      id: Date.now() + 1,
      seasonId,
      round: 'SEMIFINAL',
      seedA: 2,
      seedB: 3,
      teamAId: seed2.teamId,
      teamBId: seed3.teamId,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const now = new Date();
    const sfDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const fixture1: Partial<Fixture> = {
      seasonId,
      weekNumber: 16,
      phase: 'SEMIFINALS',
      fixtureDate: now.toISOString().split('T')[0],
      deadline: sfDeadline,
      courseId,
      teamAId: seed1.teamId,
      teamBId: seed4.teamId,
      status: 'OPEN',
      isPlayoff: true,
      playoffRound: 'SEMIFINAL',
      playoffMatchNumber: 1,
      notes: `Semifinal 1: #${seed1.position} ${seed1.teamName} vs #${seed4.position} ${seed4.teamName}`
    };

    const fixture2: Partial<Fixture> = {
      seasonId,
      weekNumber: 16,
      phase: 'SEMIFINALS',
      fixtureDate: now.toISOString().split('T')[0],
      deadline: sfDeadline,
      courseId,
      teamAId: seed2.teamId,
      teamBId: seed3.teamId,
      status: 'OPEN',
      isPlayoff: true,
      playoffRound: 'SEMIFINAL',
      playoffMatchNumber: 2,
      notes: `Semifinal 2: #${seed2.position} ${seed2.teamName} vs #${seed3.position} ${seed3.teamName}`
    };

    return {
      playoffMatches: [sf1, sf2],
      fixtures: [fixture1, fixture2]
    };
  }

  /**
   * Generates Consolation Bowl matches for positions 5 to 10 (3 fixtures in Week 16).
   */
  public static generateConsolationMatches(
    seasonId: number,
    standings: StandingsRow[],
    courseId: number = 1
  ): { playoffMatches: PlayoffMatch[]; fixtures: Partial<Fixture>[] } {
    const consolationStandings = standings.slice(4); // ranks 5-10
    const matches: PlayoffMatch[] = [];
    const fixtures: Partial<Fixture>[] = [];

    const now = new Date();
    const deadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Pairings: 5 vs 6, 7 vs 8, 9 vs 10 (or 5 vs 8, 6 vs 7, etc.)
    for (let i = 0; i < consolationStandings.length; i += 2) {
      if (i + 1 < consolationStandings.length) {
        const teamA = consolationStandings[i];
        const teamB = consolationStandings[i + 1];

        const match: PlayoffMatch = {
          id: Date.now() + i + 10,
          seasonId,
          round: 'CONSOLATION',
          seedA: teamA.position,
          seedB: teamB.position,
          teamAId: teamA.teamId,
          teamBId: teamB.teamId,
          status: 'OPEN',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const fixture: Partial<Fixture> = {
          seasonId,
          weekNumber: 16,
          phase: 'CONSOLATION',
          fixtureDate: now.toISOString().split('T')[0],
          deadline,
          courseId,
          teamAId: teamA.teamId,
          teamBId: teamB.teamId,
          status: 'OPEN',
          isPlayoff: true,
          playoffRound: 'CONSOLATION',
          playoffMatchNumber: (i / 2) + 1,
          notes: `Consolation Bowl: #${teamA.position} ${teamA.teamName} vs #${teamB.position} ${teamB.teamName}`
        };

        matches.push(match);
        fixtures.push(fixture);
      }
    }

    return { playoffMatches: matches, fixtures };
  }

  /**
   * Generates Championship Match for Week 17 once both Semifinals are completed.
   */
  public static generateChampionshipMatch(
    seasonId: number,
    winnerTeamAId: number,
    winnerTeamBId: number,
    winnerTeamAName: string,
    winnerTeamBName: string,
    courseId: number = 1
  ): { championshipMatch: PlayoffMatch; fixture: Partial<Fixture> } {
    const champMatch: PlayoffMatch = {
      id: Date.now() + 50,
      seasonId,
      round: 'CHAMPIONSHIP',
      seedA: 1, // Finalist A
      seedB: 2, // Finalist B
      teamAId: winnerTeamAId,
      teamBId: winnerTeamBId,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const now = new Date();
    const champDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const fixture: Partial<Fixture> = {
      seasonId,
      weekNumber: 17,
      phase: 'CHAMPIONSHIP',
      fixtureDate: now.toISOString().split('T')[0],
      deadline: champDeadline,
      courseId,
      teamAId: winnerTeamAId,
      teamBId: winnerTeamBId,
      status: 'OPEN',
      isPlayoff: true,
      playoffRound: 'CHAMPIONSHIP',
      playoffMatchNumber: 1,
      notes: `Week 17 Championship Match: ${winnerTeamAName} vs ${winnerTeamBName}`
    };

    return {
      championshipMatch: champMatch,
      fixture
    };
  }
}
