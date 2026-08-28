/**
 * Official Tiebreaker Engine for Windows Pairs Golf League
 * 
 * Rules (Section 43):
 * 1. Compare Weekly Net Result.
 * 2. If tied, compare the lowest individual gross score on each team.
 * 3. If still tied, compare the second player's gross score.
 * 4. If still tied, record as a Draw (or configured resolution).
 * 
 * Note: Never use League Points as a substitute for the required gross-score tiebreaker.
 */

export interface TiebreakerResult {
  winner: 'TEAM_A' | 'TEAM_B' | 'DRAW';
  resolvedBy: 'NET_RESULT' | 'LOWEST_GROSS' | 'SECOND_GROSS' | 'EQUAL_DRAW';
  teamANet: number;
  teamBNet: number;
  teamALowGross: number | null;
  teamBLowGross: number | null;
  teamASecondGross: number | null;
  teamBSecondGross: number | null;
  explanation: string;
}

export class TiebreakerService {
  /**
   * Evaluates a weekly match fixture result between Team A and Team B.
   */
  public static resolveFixtureMatch(
    teamANet: number,
    teamALowGross: number | null,
    teamASecondGross: number | null,
    teamBNet: number,
    teamBLowGross: number | null,
    teamBSecondGross: number | null
  ): TiebreakerResult {
    // 1. Primary rule: Weekly Net Result
    if (teamANet > teamBNet) {
      return {
        winner: 'TEAM_A',
        resolvedBy: 'NET_RESULT',
        teamANet,
        teamBNet,
        teamALowGross,
        teamBLowGross,
        teamASecondGross,
        teamBSecondGross,
        explanation: `Team A won on Net Result (${teamANet > 0 ? `+${teamANet}` : teamANet} vs ${teamBNet > 0 ? `+${teamBNet}` : teamBNet}).`
      };
    } else if (teamBNet > teamANet) {
      return {
        winner: 'TEAM_B',
        resolvedBy: 'NET_RESULT',
        teamANet,
        teamBNet,
        teamALowGross,
        teamBLowGross,
        teamASecondGross,
        teamBSecondGross,
        explanation: `Team B won on Net Result (${teamBNet > 0 ? `+${teamBNet}` : teamBNet} vs ${teamANet > 0 ? `+${teamANet}` : teamANet}).`
      };
    }

    // 2. Net Result is TIED. Compare lowest individual gross score.
    // Lower gross score is better in golf.
    const aHasLow = teamALowGross !== null && !isNaN(teamALowGross);
    const bHasLow = teamBLowGross !== null && !isNaN(teamBLowGross);

    if (aHasLow && !bHasLow) {
      return {
        winner: 'TEAM_A',
        resolvedBy: 'LOWEST_GROSS',
        teamANet,
        teamBNet,
        teamALowGross,
        teamBLowGross,
        teamASecondGross,
        teamBSecondGross,
        explanation: `Tied Net Result (${teamANet}). Team A won tiebreaker with lowest gross score (${teamALowGross} vs DNF).`
      };
    } else if (!aHasLow && bHasLow) {
      return {
        winner: 'TEAM_B',
        resolvedBy: 'LOWEST_GROSS',
        teamANet,
        teamBNet,
        teamALowGross,
        teamBLowGross,
        teamASecondGross,
        teamBSecondGross,
        explanation: `Tied Net Result (${teamBNet}). Team B won tiebreaker with lowest gross score (${teamBLowGross} vs DNF).`
      };
    } else if (aHasLow && bHasLow) {
      if (teamALowGross! < teamBLowGross!) {
        return {
          winner: 'TEAM_A',
          resolvedBy: 'LOWEST_GROSS',
          teamANet,
          teamBNet,
          teamALowGross,
          teamBLowGross,
          teamASecondGross,
          teamBSecondGross,
          explanation: `Tied Net Result (${teamANet}). Team A won tiebreaker with lower individual gross score (${teamALowGross} vs ${teamBLowGross}).`
        };
      } else if (teamBLowGross! < teamALowGross!) {
        return {
          winner: 'TEAM_B',
          resolvedBy: 'LOWEST_GROSS',
          teamANet,
          teamBNet,
          teamALowGross,
          teamBLowGross,
          teamASecondGross,
          teamBSecondGross,
          explanation: `Tied Net Result (${teamBNet}). Team B won tiebreaker with lower individual gross score (${teamBLowGross} vs ${teamALowGross}).`
        };
      }
    }

    // 3. Lowest individual gross is also TIED. Compare second player's gross score.
    const aHasSecond = teamASecondGross !== null && !isNaN(teamASecondGross);
    const bHasSecond = teamBSecondGross !== null && !isNaN(teamBSecondGross);

    if (aHasSecond && !bHasSecond) {
      return {
        winner: 'TEAM_A',
        resolvedBy: 'SECOND_GROSS',
        teamANet,
        teamBNet,
        teamALowGross,
        teamBLowGross,
        teamASecondGross,
        teamBSecondGross,
        explanation: `Tied Net Result & 1st Gross. Team A won tiebreaker on second player's gross score (${teamASecondGross} vs DNF).`
      };
    } else if (!aHasSecond && bHasSecond) {
      return {
        winner: 'TEAM_B',
        resolvedBy: 'SECOND_GROSS',
        teamANet,
        teamBNet,
        teamALowGross,
        teamBLowGross,
        teamASecondGross,
        teamBSecondGross,
        explanation: `Tied Net Result & 1st Gross. Team B won tiebreaker on second player's gross score (${teamBSecondGross} vs DNF).`
      };
    } else if (aHasSecond && bHasSecond) {
      if (teamASecondGross! < teamBSecondGross!) {
        return {
          winner: 'TEAM_A',
          resolvedBy: 'SECOND_GROSS',
          teamANet,
          teamBNet,
          teamALowGross,
          teamBLowGross,
          teamASecondGross,
          teamBSecondGross,
          explanation: `Tied Net Result & 1st Gross. Team A won tiebreaker on second player's gross score (${teamASecondGross} vs ${teamBSecondGross}).`
        };
      } else if (teamBSecondGross! < teamASecondGross!) {
        return {
          winner: 'TEAM_B',
          resolvedBy: 'SECOND_GROSS',
          teamANet,
          teamBNet,
          teamALowGross,
          teamBLowGross,
          teamASecondGross,
          teamBSecondGross,
          explanation: `Tied Net Result & 1st Gross. Team B won tiebreaker on second player's gross score (${teamBSecondGross} vs ${teamASecondGross}).`
        };
      }
    }

    // 4. Equal draw
    return {
      winner: 'DRAW',
      resolvedBy: 'EQUAL_DRAW',
      teamANet,
      teamBNet,
      teamALowGross,
      teamBLowGross,
      teamASecondGross,
      teamBSecondGross,
      explanation: `Match finished as a Draw (Tied Net Result ${teamANet} and identical gross scores).`
    };
  }
}
