import { Team, Course, Fixture } from '../types';

export interface ScheduleGeneratorOptions {
  seasonId: number;
  teams: Team[];
  courses: Course[];
  numWeeks: number;
  matchesPerWeek?: number;
  startDate?: string;
}

export class ScheduleGenerator {
  /**
   * Generates a weekly fixture schedule where all teams play each weekly round.
   * There are no team-against-team head-to-head match restrictions; every team plays
   * the host course and scores against their team quota.
   */
  public static generateWeeklySchedule(options: ScheduleGeneratorOptions): Fixture[] {
    const {
      seasonId,
      teams,
      courses,
      numWeeks,
      startDate = new Date().toISOString().split('T')[0]
    } = options;

    if (!teams || teams.length === 0) {
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

    const fixtures: Fixture[] = [];
    const baseDate = new Date(startDate);
    let fixtureIdCounter = Date.now();
    const now = new Date().toISOString();

    for (let week = 1; week <= numWeeks; week++) {
      const weekIdx = week - 1;
      const fixtureDateObj = new Date(baseDate.getTime() + weekIdx * 7 * 24 * 60 * 60 * 1000);
      const deadlineObj = new Date(fixtureDateObj.getTime() + 2 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000); // 48h + 18h
      const course = availableCourses[weekIdx % availableCourses.length];

      fixtures.push({
        id: fixtureIdCounter++,
        seasonId,
        weekNumber: week,
        phase: 'REGULAR_SEASON',
        fixtureDate: fixtureDateObj.toISOString().split('T')[0],
        deadline: deadlineObj.toISOString(),
        courseId: course.id,
        status: week === 1 ? 'OPEN' : 'SCHEDULED',
        isPlayoff: false,
        notes: `Week ${week} League Fixture — All ${teams.length} Teams Field Round`,
        createdAt: now,
        updatedAt: now
      });
    }

    return fixtures;
  }

  /**
   * Compatibility alias for schedule generation.
   */
  public static generateRoundRobinSchedule(options: ScheduleGeneratorOptions): Fixture[] {
    return this.generateWeeklySchedule(options);
  }
}

