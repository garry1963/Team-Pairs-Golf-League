import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { StandingsRow, Fixture, PlayerScore, TeamResult, Player, Team, Course, Season, AuditLog, AppSettings } from '../types';

export class ExportService {
  /**
   * Generates a comprehensive Official Season PDF Report.
   */
  public static exportFullSeasonReportPdf(
    season: Season,
    standings: StandingsRow[],
    fixtures: Fixture[],
    teams: Team[],
    players: Player[],
    courses: Course[],
    settings: AppSettings
  ) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const primaryColor: [number, number, number] = [15, 60, 35]; // Deep Golf Green
    const goldColor: [number, number, number] = [197, 160, 89]; // Championship Gold

    // Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.societyName.toUpperCase(), 14, 16);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...goldColor);
    doc.text(`OFFICIAL SEASON REPORT — ${season.name.toUpperCase()}`, 14, 24);

    doc.setTextColor(200, 220, 210);
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 32);

    let currentY = 46;

    // Section 1: Season Summary
    doc.setTextColor(20, 30, 25);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. SEASON OVERVIEW', 14, currentY);
    currentY += 6;

    const champTeam = teams.find(t => t.id === season.championTeamId);
    const runnerTeam = teams.find(t => t.id === season.runnerUpTeamId);

    const summaryData = [
      ['Season Name', season.name, 'Current Phase', season.currentPhase.replace('_', ' ')],
      ['Total Teams', `${teams.length} Pairs`, 'Total Players', `${players.length} Registered`],
      ['Status', season.status, 'Total Weeks', `${season.totalWeeks} Weeks`],
      ['🏆 Champion', champTeam ? champTeam.teamName : (season.status === 'COMPLETED' ? 'TBD' : 'In Progress'), '🥈 Runner-Up', runnerTeam ? runnerTeam.teamName : 'TBD']
    ];

    autoTable(doc, {
      startY: currentY,
      body: summaryData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5 },
      headStyles: { fillColor: primaryColor },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 245, 242], cellWidth: 35 },
        1: { cellWidth: 60 },
        2: { fontStyle: 'bold', fillColor: [240, 245, 242], cellWidth: 35 },
        3: { cellWidth: 50 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Section 2: Official League Standings
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 30, 25);
    doc.text('2. OFFICIAL LEAGUE TABLE & STANDINGS', 14, currentY);
    currentY += 4;

    const tableRows = standings.map(row => [
      `#${row.position}`,
      row.teamName,
      `${row.playerAName} & ${row.playerBName}`,
      row.seasonPoints > 0 ? `+${row.seasonPoints}` : row.seasonPoints.toString(),
      row.totalTeamPoints.toString(),
      row.avgNetResult > 0 ? `+${row.avgNetResult}` : row.avgNetResult.toString(),
      row.currentQuota.toString(),
      row.status
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Pos', 'Team', 'Players', 'Season Pts (Net)', 'Team Pts', 'Avg Net', 'Quota', 'Zone']],
      body: tableRows,
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 248] },
      didParseCell: (data) => {
        if (data.section === 'body') {
          const pos = standings[data.row.index]?.position;
          if (pos && pos <= 4) {
            if (data.column.index === 0 || data.column.index === 7) {
              data.cell.styles.textColor = [16, 110, 60];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    });

    // Page 2: Weekly Results
    doc.addPage();
    currentY = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('3. COMPLETED FIXTURES & MATCH RESULTS', 14, currentY);
    currentY += 6;

    const completedFixtures = fixtures.filter(f => f.status === 'COMPLETED');
    const teamMap = new Map<number, Team>();
    teams.forEach(t => teamMap.set(t.id, t));

    const fixtureRows = completedFixtures.slice(0, 40).map(f => {
      const tA = teamMap.get(f.teamAId)?.teamName || 'Team A';
      const tB = teamMap.get(f.teamBId)?.teamName || 'Team B';
      const winner = f.winnerTeamId ? (f.winnerTeamId === f.teamAId ? tA : tB) : 'Draw';
      return [
        f.isPlayoff ? `${f.phase}` : `Week ${f.weekNumber}`,
        f.fixtureDate,
        `${tA} vs ${tB}`,
        winner === 'Draw' ? 'DRAW' : `${winner} WIN`,
        f.status
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Week/Phase', 'Date', 'Fixture', 'Result', 'Status']],
      body: fixtureRows,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: primaryColor }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(130, 140, 135);
      doc.text(`Windows Pairs Golf League Official System • Page ${i} of ${pageCount}`, 14, 290);
    }

    doc.save(`Pairs_Golf_League_Season_${season.name.replace(/\s+/g, '_')}_Report.pdf`);
  }

  /**
   * Export League Standings to PDF.
   */
  public static exportStandingsPdf(standings: StandingsRow[], seasonName: string, societyName: string) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 60, 35];

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${societyName.toUpperCase()} — LEAGUE STANDINGS`, 14, 12);
    doc.setFontSize(10);
    doc.setTextColor(200, 230, 210);
    doc.text(`Season: ${seasonName} • Printed: ${new Date().toLocaleDateString()}`, 14, 19);

    const rows = standings.map(r => [
      `#${r.position}`,
      r.teamName,
      `${r.playerAName} & ${r.playerBName}`,
      r.seasonPoints > 0 ? `+${r.seasonPoints}` : r.seasonPoints.toString(),
      r.totalTeamPoints.toString(),
      r.avgNetResult > 0 ? `+${r.avgNetResult}` : r.avgNetResult.toString(),
      r.currentQuota.toString(),
      r.status
    ]);

    autoTable(doc, {
      startY: 32,
      head: [['Pos', 'Team', 'Players', 'Season Pts (Net)', 'Team Pts', 'Avg Net', 'Quota', 'Zone']],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 8.5, cellPadding: 2.2 },
      headStyles: { fillColor: primaryColor }
    });

    doc.save(`League_Standings_${seasonName.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * Export Weekly Report PDF.
   */
  public static exportWeeklyReportPdf(
    weekNumber: number,
    fixtures: Fixture[],
    teams: Team[],
    standings: StandingsRow[],
    seasonName: string
  ) {
    const doc = new jsPDF();
    const primaryColor: [number, number, number] = [15, 60, 35];
    const teamMap = new Map<number, Team>();
    teams.forEach(t => teamMap.set(t.id, t));

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`WEEK ${weekNumber} MATCH DIGEST`, 14, 12);
    doc.setFontSize(10);
    doc.setTextColor(200, 230, 210);
    doc.text(`Season: ${seasonName} • Printed: ${new Date().toLocaleDateString()}`, 14, 19);

    const weekFixtures = fixtures.filter(f => f.weekNumber === weekNumber);
    const rows = weekFixtures.map(f => {
      const tA = teamMap.get(f.teamAId)?.teamName || 'Team A';
      const tB = teamMap.get(f.teamBId)?.teamName || 'Team B';
      const winner = f.winnerTeamId ? (f.winnerTeamId === f.teamAId ? tA : tB) : (f.status === 'COMPLETED' ? 'Draw' : 'Pending');
      return [
        `#${f.id}`,
        f.fixtureDate,
        `${tA} vs ${tB}`,
        f.status,
        winner
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [['Match #', 'Date', 'Fixture Pairing', 'Status', 'Outcome']],
      body: rows,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: primaryColor }
    });

    doc.save(`Week_${weekNumber}_Match_Digest_${seasonName.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * Export League Table to Excel (.xlsx) or CSV.
   */
  public static exportStandingsExcel(standings: StandingsRow[], seasonName: string) {
    const rows = standings.map(r => ({
      Position: r.position,
      Team: r.teamName,
      'Player A': r.playerAName,
      'Player B': r.playerBName,
      'Season Points': r.seasonPoints,
      'Total Team Points': r.totalTeamPoints,
      'Average Net Result': r.avgNetResult,
      'Current Quota': r.currentQuota,
      'Quota Locked': r.quotaLocked ? 'YES' : 'NO',
      Status: r.status
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Standings');
    XLSX.writeFile(wb, `League_Standings_${seasonName.replace(/\s+/g, '_')}.xlsx`);
  }

  /**
   * Export CSV format helper.
   */
  public static exportToCsv(filename: string, rows: Record<string, any>[]) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const val = row[h] ?? '';
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
