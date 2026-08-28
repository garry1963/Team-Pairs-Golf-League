export type SeasonStatus = 'PLANNED' | 'ACTIVE' | 'PLAYOFFS' | 'COMPLETED' | 'ARCHIVED';
export type SeasonPhase = 'REGULAR_SEASON' | 'SEMIFINALS' | 'CHAMPIONSHIP' | 'CONSOLATION' | 'COMPLETED';
export type ScoreStatus = 'PENDING' | 'VALID' | 'DNF' | 'MISSED' | 'LATE' | 'CORRECTED';
export type FixtureStatus = 'SCHEDULED' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
export type PlayoffRound = 'SEMIFINAL' | 'CHAMPIONSHIP' | 'CONSOLATION';
export type MatchResult = 'TEAM_A_WIN' | 'TEAM_B_WIN' | 'DRAW';
export type UserRole = 'ADMINISTRATOR' | 'SCOREKEEPER' | 'VIEWER';

export interface Season {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  currentWeek: number;
  totalWeeks: number;
  currentPhase: SeasonPhase;
  status: SeasonStatus;
  championTeamId?: number;
  runnerUpTeamId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  email?: string;
  phone?: string;
  handicap?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: number;
  seasonId: number;
  teamName: string;
  playerAId: number;
  playerBId: number;
  currentQuota: number;
  finalRegularSeasonQuota?: number;
  playoffQuota?: number;
  quotaLocked: boolean;
  quotaLockedAt?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: number;
  courseName: string;
  location: string;
  holes: number;
  par: number;
  tees: string;
  courseRating?: number;
  slopeRating?: number;
  slope?: number;
  rating?: number;
  yardage?: number;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Fixture {
  id: number;
  seasonId: number;
  weekNumber: number;
  phase: SeasonPhase;
  fixtureDate: string;
  deadline: string;
  courseId: number;
  teamAId: number;
  teamBId: number;
  status: FixtureStatus;
  winnerTeamId?: number | null; // null for draw
  matchResult?: MatchResult;
  isPlayoff?: boolean;
  playoffRound?: PlayoffRound;
  playoffMatchNumber?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerScore {
  id: number;
  fixtureId: number;
  playerId: number;
  teamId: number;
  grossScore: number | null;
  coursePar: number;
  relativeToPar: number | null;
  leaguePoints: number;
  scoreStatus: ScoreStatus;
  submittedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamResult {
  id: number;
  fixtureId: number;
  teamId: number;
  playerAPoints: number;
  playerBPoints: number;
  teamPoints: number;
  teamQuota: number;
  weeklyNetResult: number;
  lowestGrossScore: number | null;
  secondGrossScore: number | null;
  matchResult: 'WIN' | 'LOSS' | 'DRAW';
  createdAt: string;
  updatedAt: string;
}

export interface QuotaHistory {
  id: number;
  teamId: number;
  seasonId: number;
  quota: number;
  effectiveFrom: string;
  effectiveTo?: string;
  locked: boolean;
  reason?: string;
  createdAt: string;
}

export interface PlayoffMatch {
  id: number;
  seasonId: number;
  round: PlayoffRound;
  seedA: number;
  seedB: number;
  teamAId?: number;
  teamBId?: number;
  winnerTeamId?: number;
  fixtureId?: number;
  status: FixtureStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StandingsRow {
  position: number;
  teamId: number;
  teamName: string;
  playerAName: string;
  playerBName: string;
  playerAId: number;
  playerBId: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  seasonPoints: number; // 2 pts for Win, 1 for Draw
  totalTeamPoints: number;
  totalNetResult: number;
  avgNetResult: number;
  currentQuota: number;
  quotaLocked: boolean;
  status: 'PLAYOFF' | 'CONSOLATION' | 'REGULAR';
}

export interface AuditLog {
  id: number;
  seasonId?: number;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: number;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  createdAt: string;
}

export interface AppSettings {
  societyName: string;
  adminEmail?: string;
  seasonLength: number; // default 15 regular season weeks
  matchesPerWeek?: number; // default 5 matches per week
  winPoints: number; // default 2
  drawPoints: number; // default 1
  lossPoints: number; // default 0
  pointsForWin?: number;
  pointsForDraw?: number;
  pointsForLoss?: number;
  dnfLeaguePoints: number; // 12
  submissionDeadlineHours: number; // e.g. 48
  gracePeriodMinutes: number;
  topPlayoffCount: number; // 4
  consolationCount: number; // 6 (teams 5-10)
  autoDnfOnDeadline: boolean;
  grossTiebreakerEnabled: boolean;
  currentUserRole: UserRole;
  currentUserName: string;
}

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

export interface DatabaseBackup {
  version: string;
  exportedAt: string;
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
}
