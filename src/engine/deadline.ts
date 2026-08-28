import { Fixture, PlayerScore, Team, Course } from '../types';
import { ScoringService } from './scoring';
import { TiebreakerService } from './tiebreaker';

export interface CountdownState {
  expired: boolean;
  hours: string;
  minutes: string;
  seconds: string;
  totalSeconds: number;
  displayText: string;
}

export class DeadlineService {
  /**
   * Calculates countdown time remaining until deadline.
   */
  public static getRemainingTime(deadlineIsoString?: string): CountdownState {
    if (!deadlineIsoString) {
      return {
        expired: false,
        hours: '00',
        minutes: '00',
        seconds: '00',
        totalSeconds: 0,
        displayText: 'No Deadline Set'
      };
    }

    const targetTime = new Date(deadlineIsoString).getTime();
    const now = Date.now();
    const diffMs = targetTime - now;

    if (diffMs <= 0) {
      return {
        expired: true,
        hours: '00',
        minutes: '00',
        seconds: '00',
        totalSeconds: 0,
        displayText: 'SUBMISSION CLOSED (EXPIRED)'
      };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return {
      expired: false,
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      totalSeconds,
      displayText: `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`
    };
  }

  /**
   * Checks if deadline is expired for a fixture.
   */
  public static isDeadlineExpired(deadlineIsoString?: string): boolean {
    if (!deadlineIsoString) return false;
    return new Date(deadlineIsoString).getTime() <= Date.now();
  }

  /**
   * Generates or ensures DNF records for missing player scores when deadline expires.
   */
  public static processFixtureDNFs(
    fixture: Fixture,
    teamA: Team,
    teamB: Team,
    existingScores: PlayerScore[],
    course: Course
  ): {
    updatedScores: PlayerScore[];
    dnfsAssignedCount: number;
  } {
    const playerIds = [teamA.playerAId, teamA.playerBId, teamB.playerAId, teamB.playerBId];
    const scoreMap = new Map<number, PlayerScore>();
    existingScores.filter(s => s.fixtureId === fixture.id).forEach(s => scoreMap.set(s.playerId, s));

    let dnfsAssignedCount = 0;
    const updatedScores: PlayerScore[] = [];

    playerIds.forEach(pId => {
      const isTeamA = (pId === teamA.playerAId || pId === teamA.playerBId);
      const teamId = isTeamA ? teamA.id : teamB.id;
      const existing = scoreMap.get(pId);

      if (!existing || existing.scoreStatus === 'PENDING') {
        // Assign DNF
        dnfsAssignedCount++;
        updatedScores.push({
          id: existing?.id ?? Date.now() + pId,
          fixtureId: fixture.id,
          playerId: pId,
          teamId,
          grossScore: null,
          coursePar: course.par,
          relativeToPar: null,
          leaguePoints: ScoringService.DNF_LEAGUE_POINTS,
          scoreStatus: 'DNF',
          submittedAt: new Date().toISOString(),
          notes: 'Auto-assigned DNF on score submission deadline expiration.',
          createdAt: existing?.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        updatedScores.push(existing);
      }
    });

    return { updatedScores, dnfsAssignedCount };
  }
}
