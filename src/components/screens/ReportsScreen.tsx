import React, { useState } from 'react';
import { FileText, Download, Printer, CheckCircle2, Shield, Calendar, Users, Trophy } from 'lucide-react';
import { Season, StandingsRow, Fixture, Team, Player, PlayerScore, AppSettings } from '../../types';
import { ExportService } from '../../services/exportService';

interface ReportsScreenProps {
  season: Season;
  standings: StandingsRow[];
  fixtures: Fixture[];
  teams: Team[];
  players: Player[];
  playerScores: PlayerScore[];
  settings: AppSettings;
  onToast: (type: 'success' | 'error' | 'warning', title: string, msg: string) => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  season,
  standings,
  fixtures,
  teams,
  players,
  playerScores,
  settings,
  onToast
}) => {
  const [selectedReport, setSelectedReport] = useState<string>('standings');

  const handleExportPdf = () => {
    try {
      if (selectedReport === 'standings') {
        ExportService.exportStandingsPdf(standings, season.name, settings.societyName);
      } else {
        ExportService.exportWeeklyReportPdf(season.currentWeek, fixtures, teams, standings, season.name);
      }
      onToast('success', 'PDF Generated', 'Document exported and downloaded successfully.');
    } catch (e: any) {
      onToast('error', 'Export Failed', e.message);
    }
  };

  const handleExportExcel = () => {
    try {
      ExportService.exportStandingsExcel(standings, season.name);
      onToast('success', 'Excel Spreadsheet Exported', 'Workbook downloaded successfully.');
    } catch (e: any) {
      onToast('error', 'Export Failed', e.message);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Official Reporting & Document Center
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} &bull; Export authoritative PDF certificates, weekly digests, and Excel workbooks
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Report 1: Official Standings */}
        <div
          onClick={() => setSelectedReport('standings')}
          className={`p-6 rounded-xl border transition cursor-pointer space-y-4 flex flex-col justify-between ${
            selectedReport === 'standings'
              ? 'bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-700 w-fit">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Official League Standings</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete 10-team standings table with match records, season points, quota, net results, and playoff qualification markers.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                ExportService.exportStandingsPdf(standings, season.name, settings.societyName);
              }}
              className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" /> <span>PDF</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                ExportService.exportStandingsExcel(standings, season.name);
              }}
              className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center justify-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" /> <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Report 2: Weekly Match Digest */}
        <div
          onClick={() => setSelectedReport('weekly')}
          className={`p-6 rounded-xl border transition cursor-pointer space-y-4 flex flex-col justify-between ${
            selectedReport === 'weekly'
              ? 'bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-800 w-fit">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Weekly Match Digest</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Print-ready summary of Week {season.currentWeek} match scores, lowest gross individual performers, and tiebreaker determinations.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                ExportService.exportWeeklyReportPdf(season.currentWeek, fixtures, teams, standings, season.name);
              }}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" /> <span>Export Weekly PDF</span>
            </button>
          </div>
        </div>

        {/* Report 3: Players Performance Audit */}
        <div
          onClick={() => setSelectedReport('players')}
          className={`p-6 rounded-xl border transition cursor-pointer space-y-4 flex flex-col justify-between ${
            selectedReport === 'players'
              ? 'bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-100 text-slate-700 w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Player Roster & HCP Audit</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export 20 registered players with historical scoring averages, handicap progression, and contact registry.
            </p>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                ExportService.exportStandingsPdf(standings, season.name, settings.societyName);
              }}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5" /> <span>Export Roster PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
