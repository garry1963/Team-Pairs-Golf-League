import {
  Season, Player, Team, Course, Fixture, PlayerScore, TeamResult,
  QuotaHistory, PlayoffMatch, AuditLog, AppSettings, DatabaseBackup, StandingsRow
} from '../types';
import { ScoringService } from '../engine/scoring';
import { TiebreakerService } from '../engine/tiebreaker';
import { PlayoffService } from '../engine/playoffs';
import { StandingsService } from '../engine/standings';
import { ScheduleGenerator } from '../engine/scheduleGenerator';

const STORAGE_KEY = 'PAIRS_GOLF_LEAGUE_DB_V1';
const BACKUP_STORAGE_KEY = 'PAIRS_GOLF_LEAGUE_BACKUPS_V1';

export interface DatabaseState {
  version: string;
  seasons: Season[];
  players: Player[];
  teams: Team[];
  courses: Course[];
  fixtures: Fixture[];
  playerScores: PlayerScore[];
  teamResults: TeamResult[];
  quotaHistory: QuotaHistory[];
  playoffs: PlayoffMatch[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  standings: StandingsRow[];
}

export class DatabaseEngine {
  private static state: DatabaseState | null = null;
  private static listeners: Array<() => void> = [];

  public static subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notify() {
    this.listeners.forEach(l => l());
  }

  /**
   * Initializes or loads the database from local persistent storage.
   */
  public static init(): DatabaseState {
    if (this.state) return this.state;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
        return this.state!;
      }
    } catch (e) {
      console.warn('Failed to parse database from local storage, generating initial database.', e);
    }

    const seeded = this.generateInitialDatabase();
    this.saveState(seeded);
    return seeded;
  }

  public static getState(): DatabaseState {
    if (!this.state) {
      this.init();
    }
    const state = this.state!;
    const activeSeason = state.seasons.find(s => s.status === 'ACTIVE') || state.seasons[0];
    const standings = StandingsService.calculateStandings(
      activeSeason?.id ?? 1,
      state.teams,
      state.players,
      state.fixtures,
      state.teamResults,
      state.settings
    );
    return {
      ...state,
      standings
    };
  }

  public static saveState(newState: DatabaseState) {
    this.state = newState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Database write error:', e);
    }
    this.notify();
  }

  public static logAudit(action: string, entityType: string, entityId?: number, oldValue?: string, newValue?: string, reason?: string) {
    const state = this.getState();
    const newLog: AuditLog = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      seasonId: state.seasons.find(s => s.status === 'ACTIVE')?.id ?? 1,
      userId: state.settings.currentUserName || 'Administrator',
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      reason,
      createdAt: new Date().toISOString()
    };
    state.auditLogs.unshift(newLog);
    // Keep max 500 audit logs
    if (state.auditLogs.length > 500) {
      state.auditLogs = state.auditLogs.slice(0, 500);
    }
    this.saveState(state);
  }

  // --- SCORE ENTRY & CORRECTION TRANSACTION ---
  public static saveFixtureScores(
    fixtureId: number,
    scoresInput: {
      playerA1Gross: number | null;
      playerA1Dnf: boolean;
      playerA2Gross: number | null;
      playerA2Dnf: boolean;
      playerB1Gross: number | null;
      playerB1Dnf: boolean;
      playerB2Gross: number | null;
      playerB2Dnf: boolean;
    },
    userReason?: string
  ): { success: boolean; message: string } {
    const state = this.getState();
    const fixture = state.fixtures.find(f => f.id === fixtureId);
    if (!fixture) return { success: false, message: 'Fixture not found' };

    const course = state.courses.find(c => c.id === fixture.courseId) || state.courses[0];
    const teamA = state.teams.find(t => t.id === fixture.teamAId);
    const teamB = state.teams.find(t => t.id === fixture.teamBId);

    if (!teamA || !teamB) return { success: false, message: 'Teams not found for fixture' };

    // Calculate Team A
    const resA = ScoringService.calculateTeamResult(
      scoresInput.playerA1Gross,
      scoresInput.playerA1Dnf,
      scoresInput.playerA2Gross,
      scoresInput.playerA2Dnf,
      course.par,
      teamA.quotaLocked && teamA.playoffQuota ? teamA.playoffQuota : teamA.currentQuota
    );

    // Calculate Team B
    const resB = ScoringService.calculateTeamResult(
      scoresInput.playerB1Gross,
      scoresInput.playerB1Dnf,
      scoresInput.playerB2Gross,
      scoresInput.playerB2Dnf,
      course.par,
      teamB.quotaLocked && teamB.playoffQuota ? teamB.playoffQuota : teamB.currentQuota
    );

    // Run official Tiebreaker Service
    const tiebreaker = TiebreakerService.resolveFixtureMatch(
      resA.weeklyNetResult,
      resA.lowestGrossScore,
      resA.secondGrossScore,
      resB.weeklyNetResult,
      resB.lowestGrossScore,
      resB.secondGrossScore
    );

    let winnerTeamId: number | null = null;
    let matchResultA: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
    let matchResultB: 'WIN' | 'LOSS' | 'DRAW' = 'DRAW';
    let fixtureMatchResult: 'TEAM_A_WIN' | 'TEAM_B_WIN' | 'DRAW' = 'DRAW';

    if (tiebreaker.winner === 'TEAM_A') {
      winnerTeamId = teamA.id;
      matchResultA = 'WIN';
      matchResultB = 'LOSS';
      fixtureMatchResult = 'TEAM_A_WIN';
    } else if (tiebreaker.winner === 'TEAM_B') {
      winnerTeamId = teamB.id;
      matchResultA = 'LOSS';
      matchResultB = 'WIN';
      fixtureMatchResult = 'TEAM_B_WIN';
    } else {
      winnerTeamId = null;
      matchResultA = 'DRAW';
      matchResultB = 'DRAW';
      fixtureMatchResult = 'DRAW';
    }

    const now = new Date().toISOString();

    // 1. Update/insert player scores for all 4 players
    const scoreItems = [
      { pId: teamA.playerAId, tId: teamA.id, gross: scoresInput.playerA1Gross, dnf: scoresInput.playerA1Dnf, pts: resA.playerAPoints },
      { pId: teamA.playerBId, tId: teamA.id, gross: scoresInput.playerA2Gross, dnf: scoresInput.playerA2Dnf, pts: resA.playerBPoints },
      { pId: teamB.playerAId, tId: teamB.id, gross: scoresInput.playerB1Gross, dnf: scoresInput.playerB1Dnf, pts: resB.playerAPoints },
      { pId: teamB.playerBId, tId: teamB.id, gross: scoresInput.playerB2Gross, dnf: scoresInput.playerB2Dnf, pts: resB.playerBPoints },
    ];

    // Remove old player scores for this fixture
    state.playerScores = state.playerScores.filter(ps => ps.fixtureId !== fixtureId);

    scoreItems.forEach(item => {
      const rel = ScoringService.calculateRelativeToPar(item.gross, course.par);
      state.playerScores.push({
        id: Date.now() + item.pId + Math.floor(Math.random() * 100),
        fixtureId,
        playerId: item.pId,
        teamId: item.tId,
        grossScore: item.dnf ? null : item.gross,
        coursePar: course.par,
        relativeToPar: item.dnf ? null : rel,
        leaguePoints: item.pts,
        scoreStatus: item.dnf ? 'DNF' : 'VALID',
        submittedAt: now,
        createdAt: now,
        updatedAt: now
      });
    });

    // 2. Update/insert Team Results
    state.teamResults = state.teamResults.filter(tr => tr.fixtureId !== fixtureId);
    state.teamResults.push({
      id: Date.now() + 1,
      fixtureId,
      teamId: teamA.id,
      playerAPoints: resA.playerAPoints,
      playerBPoints: resA.playerBPoints,
      teamPoints: resA.teamPoints,
      teamQuota: resA.teamQuota,
      weeklyNetResult: resA.weeklyNetResult,
      lowestGrossScore: resA.lowestGrossScore,
      secondGrossScore: resA.secondGrossScore,
      matchResult: matchResultA,
      createdAt: now,
      updatedAt: now
    });
    state.teamResults.push({
      id: Date.now() + 2,
      fixtureId,
      teamId: teamB.id,
      playerAPoints: resB.playerAPoints,
      playerBPoints: resB.playerBPoints,
      teamPoints: resB.teamPoints,
      teamQuota: resB.teamQuota,
      weeklyNetResult: resB.weeklyNetResult,
      lowestGrossScore: resB.lowestGrossScore,
      secondGrossScore: resB.secondGrossScore,
      matchResult: matchResultB,
      createdAt: now,
      updatedAt: now
    });

    // 3. Update Fixture Status
    fixture.status = 'COMPLETED';
    fixture.winnerTeamId = winnerTeamId;
    fixture.matchResult = fixtureMatchResult;
    fixture.updatedAt = now;

    // Check if this was a playoff match
    if (fixture.isPlayoff) {
      const playoffMatch = state.playoffs.find(p => p.fixtureId === fixtureId || (p.round === fixture.playoffRound && p.teamAId === teamA.id && p.teamBId === teamB.id));
      if (playoffMatch) {
        playoffMatch.status = 'COMPLETED';
        playoffMatch.winnerTeamId = winnerTeamId ?? teamA.id;
        playoffMatch.updatedAt = now;
      }
    }

    this.saveState(state);
    this.logAudit(
      'SCORE_ENTERED',
      'FIXTURE',
      fixtureId,
      undefined,
      `${teamA.teamName} (${resA.weeklyNetResult >= 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult}) vs ${teamB.teamName} (${resB.weeklyNetResult >= 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult})`,
      userReason || `Scores saved for Week ${fixture.weekNumber}. Result: ${tiebreaker.explanation}`
    );

    return {
      success: true,
      message: `Scores recorded successfully. ${teamA.teamName}: ${resA.weeklyNetResult >= 0 ? `+${resA.weeklyNetResult}` : resA.weeklyNetResult} Net, ${teamB.teamName}: ${resB.weeklyNetResult >= 0 ? `+${resB.weeklyNetResult}` : resB.weeklyNetResult} Net. ${tiebreaker.explanation}`
    };
  }

  // --- QUOTA MANAGEMENT & WEEK 15 PROTECTION ---
  public static updateTeamQuota(
    teamId: number,
    newQuota: number,
    reason: string,
    superAdminOverride: boolean = false
  ): { success: boolean; message: string } {
    const state = this.getState();
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return { success: false, message: 'Team not found.' };

    if (team.quotaLocked && !superAdminOverride) {
      return {
        success: false,
        message: 'Playoff quotas are locked after Week 15 and cannot be changed.'
      };
    }

    const oldQuota = team.currentQuota;
    team.currentQuota = newQuota;
    if (team.quotaLocked && superAdminOverride) {
      team.playoffQuota = newQuota;
    }
    team.updatedAt = new Date().toISOString();

    state.quotaHistory.unshift({
      id: Date.now(),
      teamId: team.id,
      seasonId: team.seasonId,
      quota: newQuota,
      effectiveFrom: new Date().toISOString(),
      locked: team.quotaLocked,
      reason: reason || (superAdminOverride ? 'SuperAdmin Quota Override' : 'Regular Quota Adjustment'),
      createdAt: new Date().toISOString()
    });

    this.saveState(state);
    this.logAudit(
      'QUOTA_CHANGED',
      'TEAM',
      team.id,
      `Quota: ${oldQuota}`,
      `Quota: ${newQuota}`,
      reason || (superAdminOverride ? 'SuperAdmin Override after Lock' : 'Regular season adjustment')
    );

    return {
      success: true,
      message: `Quota for ${team.teamName} updated from ${oldQuota} to ${newQuota}.`
    };
  }

  // --- WEEK FINALIZATION & WEEK 15 LOCK ENGINE ---
  public static finalizeWeek(seasonId: number, weekNumber: number): { success: boolean; message: string } {
    const state = this.getState();
    const season = state.seasons.find(s => s.id === seasonId);
    if (!season) return { success: false, message: 'Season not found.' };

    const weekFixtures = state.fixtures.filter(f => f.seasonId === seasonId && f.weekNumber === weekNumber);
    const uncompleted = weekFixtures.filter(f => f.status !== 'COMPLETED');

    if (uncompleted.length > 0) {
      return {
        success: false,
        message: `Cannot finalise Week ${weekNumber}: ${uncompleted.length} fixture(s) have uncompleted scores.`
      };
    }

    const now = new Date().toISOString();
    const regularSeasonWeeks = state.settings.seasonLength || 15;
    const semifinalWeek = regularSeasonWeeks + 1;
    const championshipWeek = regularSeasonWeeks + 2;

    // If Regular Season final week, perform Quota Lock and Playoff Generation
    if (weekNumber === regularSeasonWeeks) {
      const standings = StandingsService.calculateStandings(
        seasonId,
        state.teams,
        state.players,
        state.fixtures,
        state.teamResults,
        state.settings
      );

      // Lock Quotas for all season teams
      state.teams.filter(t => t.seasonId === seasonId).forEach(team => {
        team.finalRegularSeasonQuota = team.currentQuota;
        team.playoffQuota = team.currentQuota;
        team.quotaLocked = true;
        team.quotaLockedAt = now;
        team.updatedAt = now;

        state.quotaHistory.unshift({
          id: Date.now() + team.id,
          teamId: team.id,
          seasonId: team.seasonId,
          quota: team.currentQuota,
          effectiveFrom: now,
          locked: true,
          reason: `Locked permanently for Week ${semifinalWeek} Semifinals & Championship Playoffs.`,
          createdAt: now
        });
      });

      // Generate Semifinals (Seed 1 vs Seed 4, Seed 2 vs Seed 3) if at least 4 teams
      if (standings.length >= 4) {
        const sfGen = PlayoffService.generateSemifinals(seasonId, standings, state.courses[0]?.id ?? 1);
        sfGen.playoffMatches.forEach(pm => state.playoffs.push(pm));
        sfGen.fixtures.forEach((fix, idx) => {
          const newFix: Fixture = {
            id: Date.now() + idx + 100,
            seasonId,
            weekNumber: semifinalWeek,
            phase: 'SEMIFINALS',
            fixtureDate: fix.fixtureDate!,
            deadline: fix.deadline!,
            courseId: fix.courseId!,
            teamAId: fix.teamAId!,
            teamBId: fix.teamBId!,
            status: 'OPEN',
            isPlayoff: true,
            playoffRound: 'SEMIFINAL',
            playoffMatchNumber: fix.playoffMatchNumber,
            notes: fix.notes,
            createdAt: now,
            updatedAt: now
          };
          state.fixtures.push(newFix);
          sfGen.playoffMatches[idx].fixtureId = newFix.id;
        });

        // Generate Consolation matches for Seeds 5+
        if (standings.length > 4) {
          const consolationGen = PlayoffService.generateConsolationMatches(seasonId, standings, state.courses[0]?.id ?? 1);
          consolationGen.playoffMatches.forEach(pm => state.playoffs.push(pm));
          consolationGen.fixtures.forEach((fix, idx) => {
            const newFix: Fixture = {
              id: Date.now() + idx + 200,
              seasonId,
              weekNumber: semifinalWeek,
              phase: 'CONSOLATION',
              fixtureDate: fix.fixtureDate!,
              deadline: fix.deadline!,
              courseId: fix.courseId!,
              teamAId: fix.teamAId!,
              teamBId: fix.teamBId!,
              status: 'OPEN',
              isPlayoff: true,
              playoffRound: 'CONSOLATION',
              playoffMatchNumber: fix.playoffMatchNumber,
              notes: fix.notes,
              createdAt: now,
              updatedAt: now
            };
            state.fixtures.push(newFix);
            consolationGen.playoffMatches[idx].fixtureId = newFix.id;
          });
        }

        season.currentWeek = semifinalWeek;
        season.currentPhase = 'SEMIFINALS';
        season.status = 'PLAYOFFS';
        season.updatedAt = now;

        this.saveState(state);
        this.logAudit('WEEK_FINALISED', 'SEASON', seasonId, `Week ${weekNumber} Regular Season`, `Week ${semifinalWeek} Semifinals`, `Week ${weekNumber} completed, Quotas Locked, Playoff Brackets Generated.`);
        this.logAudit('QUOTA_LOCKED', 'SEASON', seasonId, undefined, 'All team quotas locked for playoffs', `Week ${weekNumber} Finalisation Rule`);
        this.logAudit('PLAYOFF_CREATED', 'PLAYOFFS', undefined, undefined, `Top 4: ${standings.slice(0, 4).map(s => `#${s.position} ${s.teamName}`).join(', ')}`, 'Generated Semifinals 1v4 and 2v3.');

        return {
          success: true,
          message: `Week ${weekNumber} finalized successfully! All team quotas are now LOCKED. Playoff Semifinals (Seed 1 vs 4, Seed 2 vs 3) and Consolation Bowl have been generated for Week ${semifinalWeek}.`
        };
      } else {
        // Less than 4 teams, complete season directly
        const champ = standings[0];
        const runnerUp = standings[1];
        season.championTeamId = champ?.teamId;
        season.runnerUpTeamId = runnerUp?.teamId;
        season.currentPhase = 'COMPLETED';
        season.status = 'COMPLETED';
        season.updatedAt = now;
        this.saveState(state);
        return {
          success: true,
          message: `Regular Season completed! ${champ?.teamName || 'Leader'} finished in 1st place.`
        };
      }
    } else if (weekNumber === semifinalWeek) {
      // Finalize Semifinals and advance to Championship
      const sfMatches = state.playoffs.filter(p => p.seasonId === seasonId && p.round === 'SEMIFINAL');
      const sf1 = sfMatches.find(p => p.seedA === 1);
      const sf2 = sfMatches.find(p => p.seedA === 2);

      if (!sf1?.winnerTeamId || !sf2?.winnerTeamId) {
        return { success: false, message: 'Cannot finalise Semifinals: Both Semifinal matches must have a recorded winner.' };
      }

      const teamA = state.teams.find(t => t.id === sf1.winnerTeamId);
      const teamB = state.teams.find(t => t.id === sf2.winnerTeamId);

      if (!teamA || !teamB) return { success: false, message: 'Winning teams not found.' };

      // Generate Championship Match
      const champ = PlayoffService.generateChampionshipMatch(
        seasonId,
        teamA.id,
        teamB.id,
        teamA.teamName,
        teamB.teamName,
        state.courses[0]?.id ?? 1
      );

      state.playoffs.push(champ.championshipMatch);

      const champFixture: Fixture = {
        id: Date.now() + 300,
        seasonId,
        weekNumber: championshipWeek,
        phase: 'CHAMPIONSHIP',
        fixtureDate: champ.fixture.fixtureDate!,
        deadline: champ.fixture.deadline!,
        courseId: champ.fixture.courseId!,
        teamAId: teamA.id,
        teamBId: teamB.id,
        status: 'OPEN',
        isPlayoff: true,
        playoffRound: 'CHAMPIONSHIP',
        playoffMatchNumber: 1,
        notes: `Week ${championshipWeek} Championship Match: ${teamA.teamName} vs ${teamB.teamName}`,
        createdAt: now,
        updatedAt: now
      };
      state.fixtures.push(champFixture);
      champ.championshipMatch.fixtureId = champFixture.id;

      season.currentWeek = championshipWeek;
      season.currentPhase = 'CHAMPIONSHIP';
      season.updatedAt = now;

      this.saveState(state);
      this.logAudit('SEMIFINAL_COMPLETED', 'PLAYOFFS', undefined, undefined, `Winners: ${teamA.teamName} & ${teamB.teamName}`, `Advanced to Week ${championshipWeek} Championship Match.`);

      return {
        success: true,
        message: `Week ${semifinalWeek} Semifinals finalized! Winners (${teamA.teamName} and ${teamB.teamName}) have advanced to the Week ${championshipWeek} Championship Match.`
      };
    } else if (weekNumber === championshipWeek) {
      // Finalize Championship
      const champMatch = state.playoffs.find(p => p.seasonId === seasonId && p.round === 'CHAMPIONSHIP');
      if (!champMatch?.winnerTeamId) {
        return { success: false, message: 'Championship match must have a recorded winner to finalize the season.' };
      }

      const champTeam = state.teams.find(t => t.id === champMatch.winnerTeamId);
      const runnerUpId = champMatch.teamAId === champMatch.winnerTeamId ? champMatch.teamBId : champMatch.teamAId;
      const runnerUpTeam = state.teams.find(t => t.id === runnerUpId);

      season.championTeamId = champTeam?.id;
      season.runnerUpTeamId = runnerUpTeam?.id;
      season.currentPhase = 'COMPLETED';
      season.status = 'COMPLETED';
      season.updatedAt = now;

      this.saveState(state);
      this.logAudit('CHAMPIONSHIP_COMPLETED', 'SEASON', seasonId, undefined, `Champion: ${champTeam?.teamName}, Runner-Up: ${runnerUpTeam?.teamName}`, 'Season Official Completion');

      return {
        success: true,
        message: `🏆 Season Completed! ${champTeam?.teamName} is crowned the Pairs Golf League Champion!`
      };
    } else {
      // Regular week prior to final week
      season.currentWeek = weekNumber + 1;
      season.updatedAt = now;
      this.saveState(state);
      this.logAudit('WEEK_FINALISED', 'SEASON', seasonId, `Week ${weekNumber}`, `Week ${weekNumber + 1}`, `Week ${weekNumber} completed and finalised.`);

      return {
        success: true,
        message: `Week ${weekNumber} finalized successfully. Active week is now Week ${weekNumber + 1}.`
      };
    }
  }

  // --- BACKUP & RESTORE ---
  public static createBackup(): DatabaseBackup {
    const state = this.getState();
    const backup: DatabaseBackup = {
      ...state,
      exportedAt: new Date().toISOString()
    };

    try {
      const allBackupsJson = localStorage.getItem(BACKUP_STORAGE_KEY) || '[]';
      const allBackups: DatabaseBackup[] = JSON.parse(allBackupsJson);
      allBackups.unshift(backup);
      // Keep up to 10 historical snapshots
      if (allBackups.length > 10) allBackups.pop();
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(allBackups));
    } catch (e) {
      console.error('Failed to store backup history:', e);
    }

    this.logAudit('BACKUP_CREATED', 'DATABASE', undefined, undefined, `Backup at ${backup.exportedAt}`, 'Manual or automated backup creation');
    return backup;
  }

  public static getBackupHistory(): DatabaseBackup[] {
    try {
      const all = localStorage.getItem(BACKUP_STORAGE_KEY);
      return all ? JSON.parse(all) : [];
    } catch (e) {
      return [];
    }
  }

  public static restoreBackup(backupData: DatabaseBackup): { success: boolean; message: string } {
    try {
      // 1. Create a safety backup first
      this.createBackup();

      // 2. Validate structure
      if (!backupData.seasons || !backupData.teams || !backupData.players || !backupData.fixtures) {
        return { success: false, message: 'Invalid backup format: missing core collections.' };
      }

      this.saveState({
        version: backupData.version || '1.0.0',
        seasons: backupData.seasons,
        players: backupData.players,
        teams: backupData.teams,
        courses: backupData.courses || [],
        fixtures: backupData.fixtures,
        playerScores: backupData.playerScores || [],
        teamResults: backupData.teamResults || [],
        quotaHistory: backupData.quotaHistory || [],
        playoffs: backupData.playoffs || [],
        auditLogs: backupData.auditLogs || [],
        settings: backupData.settings || this.getState().settings,
        standings: []
      });

      this.logAudit('BACKUP_RESTORED', 'DATABASE', undefined, undefined, `Restored from backup dated ${backupData.exportedAt}`, 'Safety backup was taken before restore.');
      return { success: true, message: 'Database successfully restored from backup.' };
    } catch (e: any) {
      return { success: false, message: `Restore failed: ${e.message}` };
    }
  }

  // --- SEED DATABASE GENERATOR ---
  public static generateInitialDatabase(): DatabaseState {
    const now = new Date().toISOString();
    const seasonId = 1;

    const season: Season = {
      id: seasonId,
      name: '2026 Championship Season',
      startDate: '2026-04-03',
      endDate: '2026-08-30',
      currentWeek: 8,
      totalWeeks: 15,
      currentPhase: 'REGULAR_SEASON',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    // 20 Players
    const playerNames = [
      { first: 'Jack', last: 'Nicklaus', hcp: 2 },
      { first: 'Arnold', last: 'Palmer', hcp: 3 },
      { first: 'Tiger', last: 'Woods', hcp: 1 },
      { first: 'Rory', last: 'McIlroy', hcp: 2 },
      { first: 'Phil', last: 'Mickelson', hcp: 3 },
      { first: 'Jordan', last: 'Spieth', hcp: 4 },
      { first: 'Dustin', last: 'Johnson', hcp: 2 },
      { first: 'Brooks', last: 'Koepka', hcp: 3 },
      { first: 'Jon', last: 'Rahm', hcp: 1 },
      { first: 'Scottie', last: 'Scheffler', hcp: 1 },
      { first: 'Collin', last: 'Morikawa', hcp: 2 },
      { first: 'Viktor', last: 'Hovland', hcp: 3 },
      { first: 'Justin', last: 'Thomas', hcp: 3 },
      { first: 'Patrick', last: 'Cantlay', hcp: 4 },
      { first: 'Xander', last: 'Schauffele', hcp: 2 },
      { first: 'Tommy', last: 'Fleetwood', hcp: 4 },
      { first: 'Shane', last: 'Lowry', hcp: 5 },
      { first: 'Matt', last: 'Fitzpatrick', hcp: 4 },
      { first: 'Hideki', last: 'Matsuyama', hcp: 3 },
      { first: 'Cameron', last: 'Smith', hcp: 2 }
    ];

    const players: Player[] = playerNames.map((p, idx) => ({
      id: idx + 1,
      firstName: p.first,
      lastName: p.last,
      displayName: `${p.first} ${p.last}`,
      email: `${p.first.toLowerCase()}.${p.last.toLowerCase()}@pairsgolf.org`,
      phone: `+44 7700 900${(100 + idx)}`,
      handicap: p.hcp,
      active: true,
      createdAt: now,
      updatedAt: now
    }));

    // 10 Teams
    const teamConfigs = [
      { name: 'Eagles', pA: 1, pB: 2, quota: 64 },
      { name: 'Birdies', pA: 3, pB: 4, quota: 66 },
      { name: 'Albatross', pA: 5, pB: 6, quota: 62 },
      { name: 'Fairway Aces', pA: 7, pB: 8, quota: 64 },
      { name: 'Pin Seekers', pA: 9, pB: 10, quota: 66 },
      { name: 'Iron Masters', pA: 11, pB: 12, quota: 62 },
      { name: 'Green Jackets', pA: 13, pB: 14, quota: 60 },
      { name: 'Sand Trappers', pA: 15, pB: 16, quota: 58 },
      { name: 'Bogey Busters', pA: 17, pB: 18, quota: 56 },
      { name: 'Putting Kings', pA: 19, pB: 20, quota: 60 }
    ];

    const teams: Team[] = teamConfigs.map((t, idx) => ({
      id: idx + 1,
      seasonId,
      teamName: t.name,
      playerAId: t.pA,
      playerBId: t.pB,
      currentQuota: t.quota,
      finalRegularSeasonQuota: undefined,
      playoffQuota: undefined,
      quotaLocked: false,
      active: true,
      createdAt: now,
      updatedAt: now
    }));

    // Courses
    const courses: Course[] = [
      {
        id: 1,
        courseName: 'Royal Links Championship Golf Club',
        location: 'St Andrews Coast, Fife',
        holes: 18,
        par: 72,
        tees: 'Championship Blue',
        courseRating: 73.8,
        slopeRating: 138,
        notes: 'Championship links host course with rolling fescue and deep pot bunkers.',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        courseName: 'Augusta Pine Valley Golf Club',
        location: 'Surrey Hills',
        holes: 18,
        par: 72,
        tees: 'Tournament White',
        courseRating: 72.4,
        slopeRating: 132,
        notes: 'Heathland course with undulating bentgrass greens.',
        active: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 3,
        courseName: 'Birkdale Sands Links',
        location: 'Southport Coastal',
        holes: 18,
        par: 71,
        tees: 'Gold Tees',
        courseRating: 71.9,
        slopeRating: 134,
        notes: 'Coastal links demanding precision tee shots and iron accuracy.',
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    // Generate 15 Weeks Round-Robin Schedule
    // 10 teams -> 9 round-robin rounds, then rounds 10-15 repeat pairings with reversed home/away
    const roundRobinPairings = [
      // Week 1
      [[1, 10], [2, 9], [3, 8], [4, 7], [5, 6]],
      // Week 2
      [[1, 9], [10, 8], [2, 7], [3, 6], [4, 5]],
      // Week 3
      [[1, 8], [9, 7], [10, 6], [2, 5], [3, 4]],
      // Week 4
      [[1, 7], [8, 6], [9, 5], [10, 4], [2, 3]],
      // Week 5
      [[1, 6], [7, 5], [8, 4], [9, 3], [10, 2]],
      // Week 6
      [[1, 5], [6, 4], [7, 3], [8, 2], [9, 10]],
      // Week 7
      [[1, 4], [5, 3], [6, 2], [7, 10], [8, 9]],
      // Week 8 (Current Week)
      [[1, 3], [4, 2], [5, 10], [6, 9], [7, 8]],
      // Week 9
      [[1, 2], [3, 10], [4, 9], [5, 8], [6, 7]],
      // Week 10
      [[10, 1], [9, 2], [8, 3], [7, 4], [6, 5]],
      // Week 11
      [[9, 1], [8, 10], [7, 2], [6, 3], [5, 4]],
      // Week 12
      [[8, 1], [7, 9], [6, 10], [5, 2], [4, 3]],
      // Week 13
      [[7, 1], [6, 8], [5, 9], [4, 10], [3, 2]],
      // Week 14
      [[6, 1], [5, 7], [4, 8], [3, 9], [2, 10]],
      // Week 15 (Final Regular Season)
      [[5, 1], [4, 6], [3, 7], [2, 8], [10, 9]]
    ];

    const fixtures: Fixture[] = [];
    const playerScores: PlayerScore[] = [];
    const teamResults: TeamResult[] = [];
    let fixtureIdCounter = 1;
    let scoreIdCounter = 1;
    let teamResultIdCounter = 1;

    // Generate fixtures and simulated completed scores for Weeks 1 to 7
    const baseDate = new Date(2026, 3, 3); // April 3, 2026

    roundRobinPairings.forEach((weekMatches, weekIdx) => {
      const weekNumber = weekIdx + 1;
      const fixtureDateObj = new Date(baseDate.getTime() + weekIdx * 7 * 24 * 60 * 60 * 1000);
      const deadlineObj = new Date(fixtureDateObj.getTime() + 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000); // Sunday 18:00
      const isCompletedWeek = weekNumber <= 7;
      const isOpenWeek = weekNumber === 8;
      const course = courses[(weekNumber - 1) % courses.length];

      weekMatches.forEach(([tAId, tBId], matchIdx) => {
        const fId = fixtureIdCounter++;
        const tA = teams.find(t => t.id === tAId)!;
        const tB = teams.find(t => t.id === tBId)!;

        const fixture: Fixture = {
          id: fId,
          seasonId,
          weekNumber,
          phase: 'REGULAR_SEASON',
          fixtureDate: fixtureDateObj.toISOString().split('T')[0],
          deadline: deadlineObj.toISOString(),
          courseId: course.id,
          teamAId: tA.id,
          teamBId: tB.id,
          status: isCompletedWeek ? 'COMPLETED' : (isOpenWeek ? 'OPEN' : 'SCHEDULED'),
          winnerTeamId: null,
          matchResult: undefined,
          isPlayoff: false,
          notes: `Week ${weekNumber} Regular Season Match ${matchIdx + 1}`,
          createdAt: now,
          updatedAt: now
        };

        if (isCompletedWeek) {
          // Deterministic simulated golf scores for weeks 1-7
          // Generate realistic scores: 65 to 76 (relative to par -7 to +4)
          const seedNum = weekNumber * 10 + matchIdx;
          const grossA1 = 66 + ((seedNum * 7) % 8); // 66..73
          const grossA2 = 67 + ((seedNum * 11) % 9); // 67..75
          const grossB1 = 66 + ((seedNum * 13) % 8); // 66..73
          const grossB2 = 68 + ((seedNum * 17) % 8); // 68..75

          const resA = ScoringService.calculateTeamResult(grossA1, false, grossA2, false, course.par, tA.currentQuota);
          const resB = ScoringService.calculateTeamResult(grossB1, false, grossB2, false, course.par, tB.currentQuota);

          const tiebreaker = TiebreakerService.resolveFixtureMatch(
            resA.weeklyNetResult,
            resA.lowestGrossScore,
            resA.secondGrossScore,
            resB.weeklyNetResult,
            resB.lowestGrossScore,
            resB.secondGrossScore
          );

          if (tiebreaker.winner === 'TEAM_A') {
            fixture.winnerTeamId = tA.id;
            fixture.matchResult = 'TEAM_A_WIN';
          } else if (tiebreaker.winner === 'TEAM_B') {
            fixture.winnerTeamId = tB.id;
            fixture.matchResult = 'TEAM_B_WIN';
          } else {
            fixture.winnerTeamId = null;
            fixture.matchResult = 'DRAW';
          }

          // Push player scores
          const pScores = [
            { pId: tA.playerAId, tId: tA.id, gross: grossA1, pts: resA.playerAPoints },
            { pId: tA.playerBId, tId: tA.id, gross: grossA2, pts: resA.playerBPoints },
            { pId: tB.playerAId, tId: tB.id, gross: grossB1, pts: resB.playerAPoints },
            { pId: tB.playerBId, tId: tB.id, gross: grossB2, pts: resB.playerBPoints },
          ];

          pScores.forEach(ps => {
            playerScores.push({
              id: scoreIdCounter++,
              fixtureId: fId,
              playerId: ps.pId,
              teamId: ps.tId,
              grossScore: ps.gross,
              coursePar: course.par,
              relativeToPar: ps.gross - course.par,
              leaguePoints: ps.pts,
              scoreStatus: 'VALID',
              submittedAt: fixtureDateObj.toISOString(),
              createdAt: now,
              updatedAt: now
            });
          });

          // Push Team Results
          teamResults.push({
            id: teamResultIdCounter++,
            fixtureId: fId,
            teamId: tA.id,
            playerAPoints: resA.playerAPoints,
            playerBPoints: resA.playerBPoints,
            teamPoints: resA.teamPoints,
            teamQuota: resA.teamQuota,
            weeklyNetResult: resA.weeklyNetResult,
            lowestGrossScore: resA.lowestGrossScore,
            secondGrossScore: resA.secondGrossScore,
            matchResult: fixture.winnerTeamId === tA.id ? 'WIN' : (fixture.winnerTeamId === null ? 'DRAW' : 'LOSS'),
            createdAt: now,
            updatedAt: now
          });

          teamResults.push({
            id: teamResultIdCounter++,
            fixtureId: fId,
            teamId: tB.id,
            playerAPoints: resB.playerAPoints,
            playerBPoints: resB.playerBPoints,
            teamPoints: resB.teamPoints,
            teamQuota: resB.teamQuota,
            weeklyNetResult: resB.weeklyNetResult,
            lowestGrossScore: resB.lowestGrossScore,
            secondGrossScore: resB.secondGrossScore,
            matchResult: fixture.winnerTeamId === tB.id ? 'WIN' : (fixture.winnerTeamId === null ? 'DRAW' : 'LOSS'),
            createdAt: now,
            updatedAt: now
          });
        } else if (isOpenWeek && matchIdx === 0) {
          // Pre-enter 1 match in Week 8 for demo visual richness
          const grossA1 = 67; // -5 on par 72 => 32 pts
          const grossA2 = 68; // -4 on par 72 => 32 pts
          const grossB1 = 70; // -2 on par 72 => 32 pts
          const grossB2 = 74; // +2 on par 72 => 24 pts

          const resA = ScoringService.calculateTeamResult(grossA1, false, grossA2, false, course.par, tA.currentQuota);
          const resB = ScoringService.calculateTeamResult(grossB1, false, grossB2, false, course.par, tB.currentQuota);

          const tiebreaker = TiebreakerService.resolveFixtureMatch(
            resA.weeklyNetResult,
            resA.lowestGrossScore,
            resA.secondGrossScore,
            resB.weeklyNetResult,
            resB.lowestGrossScore,
            resB.secondGrossScore
          );

          fixture.status = 'COMPLETED';
          fixture.winnerTeamId = tiebreaker.winner === 'TEAM_A' ? tA.id : (tiebreaker.winner === 'TEAM_B' ? tB.id : null);
          fixture.matchResult = tiebreaker.winner === 'TEAM_A' ? 'TEAM_A_WIN' : (tiebreaker.winner === 'TEAM_B' ? 'TEAM_B_WIN' : 'DRAW');

          const pScores = [
            { pId: tA.playerAId, tId: tA.id, gross: grossA1, pts: resA.playerAPoints },
            { pId: tA.playerBId, tId: tA.id, gross: grossA2, pts: resA.playerBPoints },
            { pId: tB.playerAId, tId: tB.id, gross: grossB1, pts: resB.playerAPoints },
            { pId: tB.playerBId, tId: tB.id, gross: grossB2, pts: resB.playerBPoints },
          ];

          pScores.forEach(ps => {
            playerScores.push({
              id: scoreIdCounter++,
              fixtureId: fId,
              playerId: ps.pId,
              teamId: ps.tId,
              grossScore: ps.gross,
              coursePar: course.par,
              relativeToPar: ps.gross - course.par,
              leaguePoints: ps.pts,
              scoreStatus: 'VALID',
              submittedAt: new Date().toISOString(),
              createdAt: now,
              updatedAt: now
            });
          });

          teamResults.push({
            id: teamResultIdCounter++,
            fixtureId: fId,
            teamId: tA.id,
            playerAPoints: resA.playerAPoints,
            playerBPoints: resA.playerBPoints,
            teamPoints: resA.teamPoints,
            teamQuota: resA.teamQuota,
            weeklyNetResult: resA.weeklyNetResult,
            lowestGrossScore: resA.lowestGrossScore,
            secondGrossScore: resA.secondGrossScore,
            matchResult: 'WIN',
            createdAt: now,
            updatedAt: now
          });

          teamResults.push({
            id: teamResultIdCounter++,
            fixtureId: fId,
            teamId: tB.id,
            playerAPoints: resB.playerAPoints,
            playerBPoints: resB.playerBPoints,
            teamPoints: resB.teamPoints,
            teamQuota: resB.teamQuota,
            weeklyNetResult: resB.weeklyNetResult,
            lowestGrossScore: resB.lowestGrossScore,
            secondGrossScore: resB.secondGrossScore,
            matchResult: 'LOSS',
            createdAt: now,
            updatedAt: now
          });
        }

        fixtures.push(fixture);
      });
    });

    // Quota history
    const quotaHistory: QuotaHistory[] = teams.map((t, idx) => ({
      id: idx + 1,
      teamId: t.id,
      seasonId,
      quota: t.currentQuota,
      effectiveFrom: '2026-04-01T00:00:00Z',
      locked: false,
      reason: 'Initial season assigned quota based on player combined handicaps.',
      createdAt: now
    }));

    // Initial audit logs
    const auditLogs: AuditLog[] = [
      {
        id: 1,
        seasonId,
        userId: 'Administrator',
        action: 'SEASON_CREATED',
        entityType: 'SEASON',
        entityId: 1,
        oldValue: undefined,
        newValue: '2026 Championship Season',
        reason: 'Initial database creation with 10 teams and 15-week schedule.',
        createdAt: now
      },
      {
        id: 2,
        seasonId,
        userId: 'Administrator',
        action: 'WEEK_OPENED',
        entityType: 'WEEK',
        entityId: 8,
        oldValue: 'Week 7 Finalised',
        newValue: 'Week 8 Open for Score Entry',
        reason: 'Regular weekly scheduled transition.',
        createdAt: now
      }
    ];

    const settings: AppSettings = {
      societyName: 'Royal Windows Pairs Golf League',
      seasonLength: 15,
      winPoints: 2,
      drawPoints: 1,
      lossPoints: 0,
      dnfLeaguePoints: 12,
      submissionDeadlineHours: 48,
      gracePeriodMinutes: 30,
      topPlayoffCount: 4,
      consolationCount: 6,
      autoDnfOnDeadline: true,
      grossTiebreakerEnabled: true,
      currentUserRole: 'ADMINISTRATOR',
      currentUserName: 'Garry Davies (Admin)'
    };

    return {
      version: '1.0.0',
      seasons: [season],
      players,
      teams,
      courses,
      fixtures,
      playerScores,
      teamResults,
      quotaHistory,
      playoffs: [],
      auditLogs,
      settings,
      standings: []
    };
  }

  // --- CRUD HELPERS ---
  public static addPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Player {
    const state = this.getState();
    const now = new Date().toISOString();
    const newPlayer: Player = {
      ...playerData,
      id: Date.now(),
      createdAt: now,
      updatedAt: now
    };
    state.players.push(newPlayer);
    this.saveState(state);
    this.logAudit('PLAYER_CREATED', 'PLAYER', newPlayer.id, undefined, newPlayer.displayName, 'Created new league player.');
    return newPlayer;
  }

  public static updatePlayer(playerId: number, data: Partial<Player>): boolean {
    const state = this.getState();
    const player = state.players.find(p => p.id === playerId);
    if (!player) return false;
    const oldName = player.displayName;
    Object.assign(player, data, { updatedAt: new Date().toISOString() });
    this.saveState(state);
    this.logAudit('PLAYER_UPDATED', 'PLAYER', playerId, oldName, player.displayName, 'Updated player details.');
    return true;
  }

  public static addTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'quotaLocked'>): Team {
    const state = this.getState();
    const now = new Date().toISOString();
    const newTeam: Team = {
      ...teamData,
      id: Date.now(),
      quotaLocked: false,
      createdAt: now,
      updatedAt: now
    };
    state.teams.push(newTeam);
    state.quotaHistory.unshift({
      id: Date.now(),
      teamId: newTeam.id,
      seasonId: newTeam.seasonId,
      quota: newTeam.currentQuota,
      effectiveFrom: now,
      locked: false,
      reason: 'Initial team registration quota.',
      createdAt: now
    });
    this.saveState(state);
    this.logAudit('TEAM_CREATED', 'TEAM', newTeam.id, undefined, newTeam.teamName, 'Created new team.');
    return newTeam;
  }

  public static updateTeam(teamId: number, data: Partial<Team>): boolean {
    const state = this.getState();
    const team = state.teams.find(t => t.id === teamId);
    if (!team) return false;
    const old = team.teamName;
    Object.assign(team, data, { updatedAt: new Date().toISOString() });
    this.saveState(state);
    this.logAudit('TEAM_UPDATED', 'TEAM', teamId, old, team.teamName, 'Updated team details.');
    return true;
  }

  public static addCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Course {
    const state = this.getState();
    const now = new Date().toISOString();
    const newCourse: Course = {
      ...courseData,
      id: Date.now(),
      createdAt: now,
      updatedAt: now
    };
    state.courses.push(newCourse);
    this.saveState(state);
    this.logAudit('COURSE_CREATED', 'COURSE', newCourse.id, undefined, newCourse.courseName, 'Added new golf course.');
    return newCourse;
  }

  public static updateCourse(courseId: number, data: Partial<Course>): boolean {
    const state = this.getState();
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return false;
    Object.assign(course, data, { updatedAt: new Date().toISOString() });
    this.saveState(state);
    this.logAudit('COURSE_UPDATED', 'COURSE', courseId, undefined, course.courseName, 'Updated course information.');
    return true;
  }

  public static updateSettings(newSettings: Partial<AppSettings>) {
    const state = this.getState();
    state.settings = { ...state.settings, ...newSettings };
    this.saveState(state);
    this.logAudit('SETTINGS_UPDATED', 'SETTINGS', undefined, undefined, 'Updated application settings', 'Administrator modified preferences.');
  }

  /**
   * Completely removes all seed data (players, teams, fixtures, scores, results, quota histories, playoffs).
   * Creates a fresh blank database ready for custom league administration.
   */
  public static removeAllSeedData(keepCourses: boolean = true): { success: boolean; message: string } {
    const state = this.getState();
    const now = new Date().toISOString();
    const seasonWeeks = state.settings.seasonLength || 15;

    const freshSeason: Season = {
      id: Date.now(),
      name: `${state.settings.societyName || 'Pairs Golf'} Championship Season`,
      startDate: now.split('T')[0],
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currentWeek: 1,
      totalWeeks: seasonWeeks,
      status: 'ACTIVE',
      currentPhase: 'REGULAR_SEASON',
      createdAt: now,
      updatedAt: now
    };

    const defaultCourses: Course[] = keepCourses && state.courses.length > 0 ? state.courses : [
      {
        id: 1,
        courseName: 'Championship Golf Links',
        location: 'Coastal Links',
        holes: 18,
        par: 72,
        tees: 'White',
        active: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    const cleanState: DatabaseState = {
      version: '1.0.0',
      seasons: [freshSeason],
      players: [],
      teams: [],
      courses: defaultCourses,
      fixtures: [],
      playerScores: [],
      teamResults: [],
      quotaHistory: [],
      playoffs: [],
      standings: [],
      auditLogs: [
        {
          id: Date.now(),
          seasonId: freshSeason.id,
          userId: state.settings.currentUserName || 'Administrator',
          action: 'DATABASE_CLEARED',
          entityType: 'DATABASE',
          newValue: 'Clean Blank Slate (0 Teams, 0 Players, 0 Fixtures)',
          reason: 'Administrator removed all seed data to configure custom league.',
          createdAt: now
        }
      ],
      settings: {
        ...state.settings,
        seasonLength: seasonWeeks,
        matchesPerWeek: state.settings.matchesPerWeek || 5
      }
    };

    this.saveState(cleanState);
    return {
      success: true,
      message: 'All seed data has been removed. A clean blank slate has been prepared for your custom players and teams.'
    };
  }

  /**
   * Clears all match scores and completed results, resetting all fixtures to unplayed and quotas to initial state.
   */
  public static clearAllScoresAndResults(): { success: boolean; message: string } {
    const state = this.getState();
    const now = new Date().toISOString();
    const activeSeason = state.seasons.find(s => s.status === 'ACTIVE') || state.seasons[0];

    // Reset fixtures
    state.fixtures.forEach(f => {
      f.status = f.weekNumber === 1 ? 'OPEN' : 'SCHEDULED';
      f.winnerTeamId = null;
      f.matchResult = undefined;
      f.updatedAt = now;
    });

    // Reset teams
    state.teams.forEach(t => {
      t.quotaLocked = false;
      t.quotaLockedAt = undefined;
      t.playoffQuota = undefined;
      t.finalRegularSeasonQuota = undefined;
      t.updatedAt = now;
    });

    // Clear scores, results, playoffs
    state.playerScores = [];
    state.teamResults = [];
    state.playoffs = [];
    state.quotaHistory = [];

    // Reset season to Week 1
    if (activeSeason) {
      activeSeason.currentWeek = 1;
      activeSeason.currentPhase = 'REGULAR_SEASON';
      activeSeason.status = 'ACTIVE';
      activeSeason.championTeamId = undefined;
      activeSeason.runnerUpTeamId = undefined;
      activeSeason.updatedAt = now;
    }

    this.saveState(state);
    this.logAudit('SCORES_CLEARED', 'DATABASE', undefined, undefined, 'Reset to Week 1 (All scores wiped)', 'Administrator reset match scores and results.');
    return {
      success: true,
      message: 'All match scores, handicaps, and results cleared. Season reset to Week 1 with rosters and fixtures intact.'
    };
  }

  /**
   * Generates or regenerates a schedule given the number of regular season weeks and matches per week.
   */
  public static regenerateSchedule(
    numWeeks: number,
    matchesPerWeek: number,
    startDate?: string
  ): { success: boolean; message: string } {
    const state = this.getState();
    const activeSeason = state.seasons.find(s => s.status === 'ACTIVE') || state.seasons[0];

    if (!activeSeason) {
      return { success: false, message: 'No active season found to generate schedule for.' };
    }

    if (state.teams.length < 2) {
      return {
        success: false,
        message: `At least 2 registered teams are required to generate fixtures (currently ${state.teams.length} registered).`
      };
    }

    const generatedFixtures = ScheduleGenerator.generateRoundRobinSchedule({
      seasonId: activeSeason.id,
      teams: state.teams,
      courses: state.courses,
      numWeeks,
      matchesPerWeek,
      startDate: startDate || activeSeason.startDate
    });

    // Replace fixtures for this season
    state.fixtures = [
      ...state.fixtures.filter(f => f.seasonId !== activeSeason.id),
      ...generatedFixtures
    ];

    // Reset scores & playoffs for this season
    state.playerScores = state.playerScores.filter(s => {
      const fix = state.fixtures.find(f => f.id === s.fixtureId);
      return fix && fix.seasonId !== activeSeason.id;
    });
    state.teamResults = state.teamResults.filter(r => {
      const fix = state.fixtures.find(f => f.id === r.fixtureId);
      return fix && fix.seasonId !== activeSeason.id;
    });
    state.playoffs = state.playoffs.filter(p => p.seasonId !== activeSeason.id);

    // Update settings
    state.settings.seasonLength = numWeeks;
    state.settings.matchesPerWeek = matchesPerWeek;

    // Update season
    activeSeason.totalWeeks = numWeeks + (state.teams.length >= 4 ? 2 : 0);
    activeSeason.currentWeek = 1;
    activeSeason.currentPhase = 'REGULAR_SEASON';
    activeSeason.status = 'ACTIVE';
    activeSeason.championTeamId = undefined;
    activeSeason.runnerUpTeamId = undefined;
    activeSeason.updatedAt = new Date().toISOString();

    this.saveState(state);
    this.logAudit(
      'SCHEDULE_GENERATED',
      'SEASON',
      activeSeason.id,
      undefined,
      `${numWeeks} Weeks, ${matchesPerWeek} Matches/Week (${generatedFixtures.length} Total Fixtures)`,
      'Generated custom round-robin league schedule.'
    );

    return {
      success: true,
      message: `Successfully generated ${numWeeks}-week schedule with ${matchesPerWeek} matches per week (${generatedFixtures.length} total fixtures).`
    };
  }

  /**
   * Creates or initializes a custom league with options to wipe seed data and auto-generate teams.
   */
  public static createCustomLeague(options: {
    societyName: string;
    numWeeks: number;
    matchesPerWeek: number;
    removeSeedData: boolean;
    autoGenerateTeams?: boolean;
    startDate?: string;
  }): { success: boolean; message: string } {
    const { societyName, numWeeks, matchesPerWeek, removeSeedData, autoGenerateTeams, startDate } = options;
    const now = new Date().toISOString();

    if (removeSeedData) {
      this.removeAllSeedData(true);
    }

    const state = this.getState();
    state.settings.societyName = societyName || 'Pairs Golf League';
    state.settings.seasonLength = numWeeks;
    state.settings.matchesPerWeek = matchesPerWeek;

    const activeSeason = state.seasons[0];
    if (activeSeason) {
      activeSeason.name = `${societyName} Championship Season`;
      activeSeason.totalWeeks = numWeeks + (autoGenerateTeams || state.teams.length >= 4 ? 2 : 0);
      activeSeason.startDate = startDate || activeSeason.startDate;
    }

    if (autoGenerateTeams) {
      // Generate pairs for the requested matches per week (e.g. 5 matches = 10 teams)
      const teamCount = Math.max(4, matchesPerWeek * 2);
      const teamNames = [
        'Eagle Strikers', 'Fairway Aces', 'Birdie Brigade', 'Iron Masters',
        'Bunker Bandits', 'Putter Pals', 'Green Keepers', 'Rough Riders',
        'Albatross Club', 'Chip & Run', 'Driver Dynamos', 'Links Legends',
        'Pin Seekers', 'Wedge Wizards', 'Bogey Busters', 'Par Explorers'
      ];
      const playerNames = [
        { f: 'James', l: 'Anderson', h: 4 }, { f: 'David', l: 'Taylor', h: 8 },
        { f: 'Michael', l: 'Brown', h: 6 }, { f: 'Robert', l: 'Wilson', h: 11 },
        { f: 'Christopher', l: 'Miller', h: 9 }, { f: 'Matthew', l: 'Davis', h: 14 },
        { f: 'Andrew', l: 'Clark', h: 5 }, { f: 'Thomas', l: 'White', h: 12 },
        { f: 'William', l: 'Harris', h: 7 }, { f: 'Richard', l: 'Martin', h: 15 },
        { f: 'Charles', l: 'Thompson', h: 8 }, { f: 'Joseph', l: 'Garcia', h: 13 },
        { f: 'Daniel', l: 'Martinez', h: 10 }, { f: 'Paul', l: 'Robinson', h: 16 },
        { f: 'Mark', l: 'Walker', h: 6 }, { f: 'Donald', l: 'Young', h: 17 },
        { f: 'George', l: 'Allen', h: 9 }, { f: 'Kenneth', l: 'King', h: 14 },
        { f: 'Steven', l: 'Wright', h: 7 }, { f: 'Edward', l: 'Scott', h: 12 },
        { f: 'Brian', l: 'Torres', h: 5 }, { f: 'Ronald', l: 'Nguyen', h: 18 },
        { f: 'Anthony', l: 'Hill', h: 11 }, { f: 'Kevin', l: 'Flores', h: 15 }
      ];

      state.players = [];
      state.teams = [];

      for (let i = 0; i < teamCount; i++) {
        const p1Data = playerNames[i * 2 % playerNames.length];
        const p2Data = playerNames[(i * 2 + 1) % playerNames.length];

        const p1: Player = {
          id: i * 2 + 1,
          firstName: p1Data.f,
          lastName: p1Data.l,
          displayName: `${p1Data.f} ${p1Data.l}`,
          handicap: p1Data.h,
          active: true,
          createdAt: now,
          updatedAt: now
        };
        const p2: Player = {
          id: i * 2 + 2,
          firstName: p2Data.f,
          lastName: p2Data.l,
          displayName: `${p2Data.f} ${p2Data.l}`,
          handicap: p2Data.h,
          active: true,
          createdAt: now,
          updatedAt: now
        };

        state.players.push(p1, p2);

        const team: Team = {
          id: i + 1,
          seasonId: activeSeason.id,
          teamName: teamNames[i % teamNames.length] || `Team ${i + 1}`,
          playerAId: p1.id,
          playerBId: p2.id,
          currentQuota: 60,
          quotaLocked: false,
          active: true,
          createdAt: now,
          updatedAt: now
        };

        state.teams.push(team);
      }

      this.saveState(state);
      // Now regenerate schedule
      this.regenerateSchedule(numWeeks, matchesPerWeek, startDate);
    } else {
      this.saveState(state);
    }

    this.logAudit('LEAGUE_CONFIGURED', 'SETTINGS', undefined, undefined, `${societyName} (${numWeeks} wks, ${matchesPerWeek} matches/wk)`, 'Created custom league configuration.');
    return {
      success: true,
      message: `League "${societyName}" configured with ${numWeeks} weeks and ${matchesPerWeek} matches per week.`
    };
  }

  public static resetToCleanDemo() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = null;
    const fresh = this.init();
    this.logAudit('DATABASE_RESET', 'DATABASE', undefined, undefined, 'Clean Demo Generated', 'Administrator executed database reset to default 10-team league state.');
    return fresh;
  }

  public static resetDatabase() {
    return this.resetToCleanDemo();
  }

  public static exportBackupJSON(): string {
    const state = this.getState();
    const backupData = {
      version: state.version,
      exportedAt: new Date().toISOString(),
      seasons: state.seasons,
      players: state.players,
      teams: state.teams,
      courses: state.courses,
      fixtures: state.fixtures,
      playerScores: state.playerScores,
      teamResults: state.teamResults,
      quotaHistory: state.quotaHistory,
      playoffs: state.playoffs,
      auditLogs: state.auditLogs,
      settings: state.settings
    };
    return JSON.stringify(backupData, null, 2);
  }

  public static importBackupJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.seasons || !parsed.teams || !parsed.players || !parsed.fixtures) {
        return { success: false, message: 'Invalid backup format: required collections missing.' };
      }
      const importedState: DatabaseState = {
        version: parsed.version || '1.0.0',
        seasons: parsed.seasons,
        players: parsed.players,
        teams: parsed.teams,
        courses: parsed.courses || [],
        fixtures: parsed.fixtures,
        playerScores: parsed.playerScores || [],
        teamResults: parsed.teamResults || [],
        quotaHistory: parsed.quotaHistory || [],
        playoffs: parsed.playoffs || [],
        auditLogs: parsed.auditLogs || [],
        settings: parsed.settings || {},
        standings: []
      };
      this.saveState(importedState);
      this.logAudit('DATABASE_RESTORED', 'DATABASE', undefined, undefined, 'Restored from JSON backup', 'Administrator restored database from external backup.');
      return { success: true, message: 'Database successfully restored from backup.' };
    } catch (e: any) {
      return { success: false, message: `Parse error: ${e.message}` };
    }
  }

  public static openWeek(seasonId: number, weekNumber: number) {
    const state = this.getState();
    const season = state.seasons.find(s => s.id === seasonId);
    if (season) {
      season.currentWeek = weekNumber;
      season.updatedAt = new Date().toISOString();
    }
    state.fixtures
      .filter(f => f.seasonId === seasonId && f.weekNumber === weekNumber)
      .forEach(f => {
        if (f.status === 'SCHEDULED') {
          f.status = 'OPEN';
          f.updatedAt = new Date().toISOString();
        }
      });
    this.saveState(state);
    this.logAudit('WEEK_OPENED', 'SEASON', seasonId, undefined, `Week ${weekNumber} opened`, `Week ${weekNumber} opened for score entry.`);
  }

  public static closeWeek(seasonId: number, weekNumber: number) {
    const state = this.getState();
    state.fixtures
      .filter(f => f.seasonId === seasonId && f.weekNumber === weekNumber)
      .forEach(f => {
        if (f.status !== 'COMPLETED') {
          f.status = 'COMPLETED';
          f.updatedAt = new Date().toISOString();
        }
      });
    this.saveState(state);
    this.logAudit('WEEK_CLOSED', 'SEASON', seasonId, undefined, `Week ${weekNumber} closed`, `Week ${weekNumber} closed.`);
  }

  public static extendWeekDeadline(seasonId: number, weekNumber: number, additionalHours: number) {
    const state = this.getState();
    state.fixtures
      .filter(f => f.seasonId === seasonId && f.weekNumber === weekNumber)
      .forEach(f => {
        const currentDl = new Date(f.deadline);
        currentDl.setHours(currentDl.getHours() + additionalHours);
        f.deadline = currentDl.toISOString();
        f.updatedAt = new Date().toISOString();
      });
    this.saveState(state);
    this.logAudit('DEADLINE_EXTENDED', 'SEASON', seasonId, undefined, `+${additionalHours}h`, `Extended Week ${weekNumber} deadline by ${additionalHours} hours.`);
  }
}
