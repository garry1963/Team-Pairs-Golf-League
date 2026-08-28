import { Team, Course, Fixture } from '../types';

export interface ScheduleGeneratorOptions {
  seasonId: number;
  teams: Team[];
  courses: Course[];
  numWeeks: number;
  matchesPerWeek: number;
  startDate?: string;
}

export class ScheduleGenerator {
  /**
   * Generates a round-robin schedule for a given number of weeks and matches per week.
   */
  public static generateRoundRobinSchedule(options: ScheduleGeneratorOptions): Fixture[] {
    const {
      seasonId,
      teams,
      courses,
      numWeeks,
      matchesPerWeek,
      startDate = new Date().toISOString().split('T')[0]
    } = options;

    if (!teams || teams.length < 2) {
      return [];
    }

    const availableCourses = courses && courses.length > 0 ? courses : [
      {
        id: 1,
        courseName: 'Championship Golf Links',
        location: 'Coastal Links',
        holes: 18,
        par: 72,
        tees: 'White',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const teamList = [...teams];
    const n = teamList.length;
    const isOdd = n % 2 !== 0;

    // Berger Round Robin table generation
    // If odd number of teams, add null as bye
    const participants: (Team | null)[] = isOdd ? [...teamList, null] : [...teamList];
    const totalParticipants = participants.length;
    const roundsInCycle = totalParticipants - 1;

    // Generate all round-robin pair rounds
    const roundPairings: [Team, Team][][] = [];

    for (let r = 0; r < roundsInCycle; r++) {
      const roundMatches: [Team, Team][] = [];
      for (let i = 0; i < totalParticipants / 2; i++) {
        const team1 = participants[i];
        const team2 = participants[totalParticipants - 1 - i];

        if (team1 !== null && team2 !== null) {
          // Alternate home and away to keep balance
          if (r % 2 === 1) {
            roundMatches.push([team2, team1]);
          } else {
            roundMatches.push([team1, team2]);
          }
        }
      }
      roundPairings.push(roundMatches);

      // Rotate participants keeping the first one fixed
      const fixed = participants[0];
      const rest = participants.slice(1);
      const last = rest.pop()!;
      rest.unshift(last);
      participants.splice(0, participants.length, fixed, ...rest);
    }

    const fixtures: Fixture[] = [];
    const baseDate = new Date(startDate);
    let fixtureIdCounter = Date.now();
    const now = new Date().toISOString();

    for (let week = 1; week <= numWeeks; week++) {
      const weekIdx = week - 1;
      const cycleRound = weekIdx % roundsInCycle;
      const cycleCount = Math.floor(weekIdx / roundsInCycle);
      const isReversedCycle = cycleCount % 2 === 1;

      // Matches available in this cycle round
      const rawMatches = roundPairings[cycleRound] || [];
      const candidateMatches: [Team, Team][] = rawMatches.map(([tA, tB]) => 
        isReversedCycle ? [tB, tA] : [tA, tB]
      );

      // Select target matches for this week (up to matchesPerWeek)
      const selectedForWeek: [Team, Team][] = [];
      
      if (candidateMatches.length >= matchesPerWeek) {
        selectedForWeek.push(...candidateMatches.slice(0, matchesPerWeek));
      } else {
        // If candidate matches in round is smaller than requested matchesPerWeek, fill from next rounds
        selectedForWeek.push(...candidateMatches);
        let lookahead = 1;
        while (selectedForWeek.length < matchesPerWeek && lookahead < roundsInCycle) {
          const extraRound = (cycleRound + lookahead) % roundsInCycle;
          const extraMatches = roundPairings[extraRound] || [];
          for (const m of extraMatches) {
            if (selectedForWeek.length < matchesPerWeek) {
              selectedForWeek.push(isReversedCycle ? [m[1], m[0]] : [m[0], m[1]]);
            }
          }
          lookahead++;
        }
      }

      // Calculate fixture date & deadline
      const fixtureDateObj = new Date(baseDate.getTime() + weekIdx * 7 * 24 * 60 * 60 * 1000);
      const deadlineObj = new Date(fixtureDateObj.getTime() + 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000); // 48h after
      const course = availableCourses[weekIdx % availableCourses.length];

      selectedForWeek.forEach(([teamA, teamB], matchIdx) => {
        fixtures.push({
          id: fixtureIdCounter++,
          seasonId,
          weekNumber: week,
          phase: 'REGULAR_SEASON',
          fixtureDate: fixtureDateObj.toISOString().split('T')[0],
          deadline: deadlineObj.toISOString(),
          courseId: course.id,
          teamAId: teamA.id,
          teamBId: teamB.id,
          status: week === 1 ? 'OPEN' : 'SCHEDULED',
          winnerTeamId: null,
          matchResult: undefined,
          isPlayoff: false,
          notes: `Week ${week} Match ${matchIdx + 1}: ${teamA.teamName} vs ${teamB.teamName}`,
          createdAt: now,
          updatedAt: now
        });
      });
    }

    return fixtures;
  }
}
