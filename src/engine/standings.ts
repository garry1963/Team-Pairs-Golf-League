import { StandingsRow, Team, Player, Fixture, TeamResult, AppSettings } from '../types';

export class StandingsService {
  /**
   * Calculates official season standings from completed regular season fixtures.
   * 
   * Season Points System:
   * Each team's season points are the cumulative sum of their match Net Result values (+/-).
   * Positive net results add to the running total; negative net results deduct from it.
   * Match outcome and tiebreaker protocol points are not used.
   */
  public static calculateStandings(
    seasonId: number,
    teams: Team[],
    players: Player[],
    fixtures: Fixture[],
    teamResults: TeamResult[],
    settings?: Partial<AppSettings>
  ): StandingsRow[] {
    const regularSeasonWeeks = settings?.seasonLength ?? 15;

    // Filter regular season fixtures only (non-playoff)
    const regularFixtures = fixtures.filter(
      f => f.seasonId === seasonId && !f.isPlayoff && f.weekNumber <= regularSeasonWeeks
    );
    const completedFixtureIds = new Set(
      regularFixtures.filter(f => f.status === 'COMPLETED').map(f => f.id)
    );

    // Map players by ID
    const playerMap = new Map<number, Player>();
    players.forEach(p => playerMap.set(p.id, p));

    // Calculate per team
    const seasonTeams = teams.filter(t => t.seasonId === seasonId);

    const standings: StandingsRow[] = seasonTeams.map(team => {
      const pA = playerMap.get(team.playerAId);
      const pB = playerMap.get(team.playerBId);

      let played = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let totalTeamPoints = 0;
      let totalNetResult = 0;

      // Fixtures for this team that are completed
      const teamFixtures = regularFixtures.filter(
        f => completedFixtureIds.has(f.id) && (f.teamAId === team.id || f.teamBId === team.id)
      );

      teamFixtures.forEach(fix => {
        played++;
        const res = teamResults.find(r => r.fixtureId === fix.id && r.teamId === team.id);
        if (res) {
          totalTeamPoints += res.teamPoints;
          // Running Net Result accumulation: positive adds, negative subtracts
          totalNetResult += res.weeklyNetResult;
          if (res.weeklyNetResult > 0) wins++;
          else if (res.weeklyNetResult === 0) draws++;
          else losses++;
        }
      });

      // Season Points = Running sum of match net results
      const seasonPoints = totalNetResult;
      const avgNetResult = played > 0 ? Number((totalNetResult / played).toFixed(2)) : 0;

      return {
        position: 0, // Assigned after sorting
        teamId: team.id,
        teamName: team.teamName,
        playerAName: pA ? `${pA.firstName} ${pA.lastName}` : 'Player A',
        playerBName: pB ? `${pB.firstName} ${pB.lastName}` : 'Player B',
        playerAId: team.playerAId,
        playerBId: team.playerBId,
        played,
        wins,
        draws,
        losses,
        seasonPoints,
        totalTeamPoints,
        totalNetResult,
        avgNetResult,
        currentQuota: team.currentQuota,
        quotaLocked: Boolean(team.quotaLocked),
        status: 'REGULAR'
      };
    });

    // Sort primarily by Season Points (Running Net Result Total, desc),
    // then by Total Team Points (desc), then alphabetically
    standings.sort((a, b) => {
      if (b.seasonPoints !== a.seasonPoints) {
        return b.seasonPoints - a.seasonPoints;
      }
      if (b.totalTeamPoints !== a.totalTeamPoints) {
        return b.totalTeamPoints - a.totalTeamPoints;
      }
      return a.teamName.localeCompare(b.teamName);
    });

    // Assign positions & playoff zone status
    standings.forEach((row, index) => {
      row.position = index + 1;
      if (row.position <= (settings?.topPlayoffCount ?? 4)) {
        row.status = 'PLAYOFF';
      } else {
        row.status = 'CONSOLATION';
      }
    });

    return standings;
  }
}
