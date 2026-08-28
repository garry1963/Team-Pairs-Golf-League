import * as XLSX from 'xlsx';
import { Player, Team, Course } from '../types';

export interface ImportValidationResult<T> {
  totalRecords: number;
  validRecords: T[];
  errors: { row: number; field: string; message: string; raw: any }[];
  isValid: boolean;
}

export class ImportService {
  /**
   * Parses and validates player data from CSV/Excel file buffer or text.
   */
  public static parsePlayerFile(data: ArrayBuffer | string): ImportValidationResult<Omit<Player, 'id' | 'createdAt' | 'updatedAt'>> {
    const workbook = typeof data === 'string' 
      ? XLSX.read(data, { type: 'string' })
      : XLSX.read(data, { type: 'array' });

    const firstSheet = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[firstSheet]);

    const validRecords: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const errors: { row: number; field: string; message: string; raw: any }[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const firstName = row.FirstName || row.first_name || row['First Name'] || row.firstName;
      const lastName = row.LastName || row.last_name || row['Last Name'] || row.lastName;
      const email = row.Email || row.email;
      const phone = row.Phone || row.phone;
      const handicap = Number(row.Handicap || row.handicap || 0);

      if (!firstName || typeof firstName !== 'string') {
        errors.push({ row: rowNum, field: 'firstName', message: 'First name is required and must be text', raw: row });
        return;
      }
      if (!lastName || typeof lastName !== 'string') {
        errors.push({ row: rowNum, field: 'lastName', message: 'Last name is required and must be text', raw: row });
        return;
      }

      validRecords.push({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        email: email ? String(email).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        handicap: isNaN(handicap) ? 0 : handicap,
        active: true
      });
    });

    return {
      totalRecords: rawRows.length,
      validRecords,
      errors,
      isValid: errors.length === 0
    };
  }

  /**
   * Parses and validates courses data.
   */
  public static parseCourseFile(data: ArrayBuffer | string): ImportValidationResult<Omit<Course, 'id' | 'createdAt' | 'updatedAt'>> {
    const workbook = typeof data === 'string' 
      ? XLSX.read(data, { type: 'string' })
      : XLSX.read(data, { type: 'array' });

    const firstSheet = workbook.SheetNames[0];
    const rawRows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[firstSheet]);

    const validRecords: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const errors: { row: number; field: string; message: string; raw: any }[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2;
      const courseName = row.CourseName || row.course_name || row['Course Name'] || row.name;
      const location = row.Location || row.location || 'Local';
      const par = Number(row.Par || row.par || 72);
      const tees = row.Tees || row.tees || 'Championship';

      if (!courseName || typeof courseName !== 'string') {
        errors.push({ row: rowNum, field: 'courseName', message: 'Course name is required', raw: row });
        return;
      }
      if (isNaN(par) || par < 60 || par > 80) {
        errors.push({ row: rowNum, field: 'par', message: 'Par must be a realistic number between 60 and 80', raw: row });
        return;
      }

      validRecords.push({
        courseName: courseName.trim(),
        location: String(location).trim(),
        holes: 18,
        par,
        tees: String(tees).trim(),
        active: true
      });
    });

    return {
      totalRecords: rawRows.length,
      validRecords,
      errors,
      isValid: errors.length === 0
    };
  }

  /**
   * Validates raw CSV score input string.
   */
  public static validateScoreImportCsv(csvText: string): { validRows: any[]; errors: string[] } {
    const lines = csvText.trim().split('\n');
    const validRows: any[] = [];
    const errors: string[] = [];

    if (lines.length < 2) {
      return { validRows: [], errors: ['CSV must contain a header and at least one data row.'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(',').map(c => c.trim());
      if (cols.length < 4) {
        errors.push(`Row ${i + 1}: expected at least 4 columns (Week, Team, P1Score, P2Score).`);
        continue;
      }
      const week = parseInt(cols[0], 10);
      const team = cols[1];
      const p1 = parseInt(cols[2], 10);
      const p2 = parseInt(cols[3], 10);

      if (isNaN(week) || week < 1 || week > 17) {
        errors.push(`Row ${i + 1}: invalid week number "${cols[0]}".`);
        continue;
      }
      if (!team) {
        errors.push(`Row ${i + 1}: team name is required.`);
        continue;
      }
      validRows.push({ week, team, p1: isNaN(p1) ? null : p1, p2: isNaN(p2) ? null : p2 });
    }

    return { validRows, errors };
  }
}
