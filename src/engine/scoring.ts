/**
 * Official Scoring Engine for Windows Pairs Golf League
 * 
 * Rules:
 * - relativeToPar = grossScore - coursePar
 * - 8-tier points table based on relativeToPar:
 *   <= -19       : 45 pts
 *   -18 to -13  : 40 pts
 *   -12 to -7   : 36 pts
 *   -6 to -1    : 32 pts
 *   0           : 30 pts
 *   +1 to +6    : 24 pts
 *   +7 to +12   : 18 pts
 *   >= +13      : 12 pts
 * - DNF: gross = null, relativeToPar = null, leaguePoints = 12
 * - Team Points = Player A Points + Player B Points
 * - Weekly Net Result = Team Points - Team Quota
 */

export interface ScoreCalculationResult {
  relativeToPar: number | null;
  leaguePoints: number;
  isDnf: boolean;
  explanation: string;
}

export interface TeamScoreCalculationResult {
  playerAPoints: number;
  playerBPoints: number;
  teamPoints: number;
  teamQuota: number;
  weeklyNetResult: number;
  lowestGrossScore: number | null;
  secondGrossScore: number | null;
}

export interface ScoringTier {
  relativeToParLabel: string;
  minRel: number;
  maxRel: number;
  points: number;
}

export const SCORING_POINTS_TIERS: ScoringTier[] = [
  { relativeToParLabel: '≤ -19', minRel: -99, maxRel: -19, points: 45 },
  { relativeToParLabel: '-18 to -13', minRel: -18, maxRel: -13, points: 40 },
  { relativeToParLabel: '-12 to -7', minRel: -12, maxRel: -7, points: 36 },
  { relativeToParLabel: '-6 to -1', minRel: -6, maxRel: -1, points: 32 },
  { relativeToParLabel: 'Even (0)', minRel: 0, maxRel: 0, points: 30 },
  { relativeToParLabel: '+1 to +6', minRel: 1, maxRel: 6, points: 24 },
  { relativeToParLabel: '+7 to +12', minRel: 7, maxRel: 12, points: 18 },
  { relativeToParLabel: '≥ +13 / DNF', minRel: 13, maxRel: 99, points: 12 }
];

export class ScoringService {
  public static readonly DNF_LEAGUE_POINTS = 12;

  /**
   * Calculates Relative to Par from gross score and course par.
   */
  public static calculateRelativeToPar(grossScore: number | null, coursePar: number): number | null {
    if (grossScore === null || grossScore === undefined || isNaN(grossScore)) {
      return null;
    }
    return grossScore - coursePar;
  }

  /**
   * Converts Relative-to-Par into official League Points.
   * Authoritative implementation per Section 17.2 of rules specification.
   */
  public static convertRelativeToParToLeaguePoints(relativeToPar: number | null, isDnf: boolean = false): number {
    if (isDnf || relativeToPar === null || relativeToPar === undefined || isNaN(relativeToPar)) {
      return this.DNF_LEAGUE_POINTS;
    }

    if (relativeToPar <= -19) {
      return 45;
    } else if (relativeToPar >= -18 && relativeToPar <= -13) {
      return 40;
    } else if (relativeToPar >= -12 && relativeToPar <= -7) {
      return 36;
    } else if (relativeToPar >= -6 && relativeToPar <= -1) {
      return 32;
    } else if (relativeToPar === 0) {
      return 30;
    } else if (relativeToPar >= 1 && relativeToPar <= 6) {
      return 24;
    } else if (relativeToPar >= 7 && relativeToPar <= 12) {
      return 18;
    } else {
      // relativeToPar >= 13
      return 12;
    }
  }

  /**
   * Calculates full individual score details.
   */
  public static calculatePlayerScore(grossScore: number | null, coursePar: number, isDnf: boolean = false): ScoreCalculationResult {
    if (isDnf || grossScore === null || grossScore === undefined) {
      return {
        relativeToPar: null,
        leaguePoints: this.DNF_LEAGUE_POINTS,
        isDnf: true,
        explanation: 'DNF recorded: awarded standard 12 League Points.'
      };
    }

    const relativeToPar = this.calculateRelativeToPar(grossScore, coursePar);
    const leaguePoints = this.convertRelativeToParToLeaguePoints(relativeToPar, false);
    
    const sign = (relativeToPar ?? 0) > 0 ? `+${relativeToPar}` : `${relativeToPar}`;
    return {
      relativeToPar,
      leaguePoints,
      isDnf: false,
      explanation: `Gross ${grossScore} (Par ${coursePar}) = ${sign} to par → ${leaguePoints} League Points`
    };
  }

  /**
   * Calculates Team Points and Weekly Net Result.
   */
  public static calculateTeamResult(
    playerAGross: number | null,
    playerADnf: boolean,
    playerBGross: number | null,
    playerBDnf: boolean,
    coursePar: number,
    teamQuota: number
  ): TeamScoreCalculationResult {
    const scoreA = this.calculatePlayerScore(playerAGross, coursePar, playerADnf);
    const scoreB = this.calculatePlayerScore(playerBGross, coursePar, playerBDnf);

    const playerAPoints = scoreA.leaguePoints;
    const playerBPoints = scoreB.leaguePoints;
    const teamPoints = playerAPoints + playerBPoints;
    const weeklyNetResult = teamPoints - teamQuota;

    // Gross score extraction for official tiebreakers
    const grossScores: number[] = [];
    if (!playerADnf && playerAGross !== null && !isNaN(playerAGross)) {
      grossScores.push(playerAGross);
    }
    if (!playerBDnf && playerBGross !== null && !isNaN(playerBGross)) {
      grossScores.push(playerBGross);
    }
    grossScores.sort((a, b) => a - b);

    const lowestGrossScore = grossScores.length > 0 ? grossScores[0] : null;
    const secondGrossScore = grossScores.length > 1 ? grossScores[1] : null;

    return {
      playerAPoints,
      playerBPoints,
      teamPoints,
      teamQuota,
      weeklyNetResult,
      lowestGrossScore,
      secondGrossScore
    };
  }
}
