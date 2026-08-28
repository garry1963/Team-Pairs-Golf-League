import React, { useState } from 'react';
import { Trophy, Download, FileText, ArrowUpDown, Shield, Lock, Users, Sparkles } from 'lucide-react';
import { StandingsRow, Season, AppSettings } from '../../types';
import { ExportService } from '../../services/exportService';

interface LeagueTableScreenProps {
  season: Season;
  standings: StandingsRow[];
  settings: AppSettings;
  onSelectTeam: (teamId: number) => void;
}

type SortField = 'position' | 'teamName' | 'played' | 'wins' | 'draws' | 'losses' | 'seasonPoints' | 'totalTeamPoints' | 'totalNetResult' | 'avgNetResult' | 'currentQuota';

export const LeagueTableScreen: React.FC<LeagueTableScreenProps> = ({
  season,
  standings,
  settings,
  onSelectTeam
}) => {
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'teamName' || field === 'position');
    }
  };

  const sortedStandings = [...standings].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
    }
    return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Official League Standings
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {season.name} &bull; Positions 1–4 Qualify for Week 16 Semifinals &bull; Positions 5–10 to Consolation Bowl
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => ExportService.exportStandingsPdf(standings, season.name, settings.societyName)}
            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => ExportService.exportStandingsExcel(standings, season.name)}
            className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition flex items-center space-x-1.5 border border-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Legend Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center space-x-3 text-xs">
          <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-xs shrink-0" />
          <div>
            <span className="font-bold text-blue-900">Playoff Qualification Zone (Positions 1–4)</span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Top 4 advance to Week 16 Semifinals (1 vs 4, 2 vs 3). Regular season quotas freeze permanently after Week 15.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3 text-xs">
          <div className="w-3.5 h-3.5 rounded-full bg-slate-400 shrink-0" />
          <div>
            <span className="font-bold text-slate-800">Consolation Bowl Zone (Positions 5–10)</span>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Teams 5–10 advance to the post-season Consolation Championship bracket.
            </p>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
              <tr>
                <th onClick={() => handleSort('position')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                  <div className="flex items-center space-x-1">
                    <span>Pos</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('teamName')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                  <div className="flex items-center space-x-1">
                    <span>Team & Players</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('played')} className="py-3 px-2.5 text-center cursor-pointer hover:text-slate-900">
                  P
                </th>
                <th onClick={() => handleSort('wins')} className="py-3 px-2.5 text-center cursor-pointer hover:text-slate-900 font-bold text-green-700">
                  W
                </th>
                <th onClick={() => handleSort('draws')} className="py-3 px-2.5 text-center cursor-pointer hover:text-slate-900">
                  D
                </th>
                <th onClick={() => handleSort('losses')} className="py-3 px-2.5 text-center cursor-pointer hover:text-slate-900">
                  L
                </th>
                <th onClick={() => handleSort('seasonPoints')} className="py-3 px-3.5 text-center cursor-pointer hover:text-blue-900 font-bold text-blue-700 bg-blue-50/50">
                  <div className="flex items-center justify-center space-x-1">
                    <span>Season Pts</span>
                    <ArrowUpDown className="w-3 h-3 text-blue-500" />
                  </div>
                </th>
                <th onClick={() => handleSort('totalTeamPoints')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                  Team Pts
                </th>
                <th onClick={() => handleSort('totalNetResult')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 font-bold">
                  <div className="flex items-center justify-center space-x-1">
                    <span>Net Result</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th onClick={() => handleSort('avgNetResult')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                  Avg Net
                </th>
                <th onClick={() => handleSort('currentQuota')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                  Quota
                </th>
                <th className="py-3 px-3 text-right">Zone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {sortedStandings.map((row) => {
                const isTop4 = row.position <= 4;

                return (
                  <tr
                    key={row.teamId}
                    onClick={() => onSelectTeam(row.teamId)}
                    className="hover:bg-slate-50 transition group cursor-pointer"
                  >
                    {/* Position */}
                    <td className="py-3.5 px-3 font-bold text-slate-800">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                          row.position === 1
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : row.position <= 4
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {row.position}
                      </span>
                    </td>

                    {/* Team & Players */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition">
                        {row.teamName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">
                        {row.playerAName} &bull; {row.playerBName}
                      </div>
                    </td>

                    {/* Record Stats */}
                    <td className="py-3.5 px-2.5 text-center text-slate-600 font-semibold">{row.played}</td>
                    <td className="py-3.5 px-2.5 text-center font-bold text-green-600">{row.wins}</td>
                    <td className="py-3.5 px-2.5 text-center text-slate-400">{row.draws}</td>
                    <td className="py-3.5 px-2.5 text-center text-red-500">{row.losses}</td>

                    {/* Season Points */}
                    <td className="py-3.5 px-3.5 text-center font-bold text-sm text-blue-700 bg-blue-50/50">
                      {row.seasonPoints}
                    </td>

                    {/* Team Points */}
                    <td className="py-3.5 px-3 text-center text-slate-600 font-mono">
                      {row.totalTeamPoints}
                    </td>

                    {/* Total Net Result */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sm">
                      <span className={row.totalNetResult >= 0 ? 'text-green-600' : 'text-red-500'}>
                        {row.totalNetResult > 0 ? `+${row.totalNetResult}` : row.totalNetResult}
                      </span>
                    </td>

                    {/* Average Net Result */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-500">
                      {row.avgNetResult > 0 ? `+${row.avgNetResult}` : row.avgNetResult}
                    </td>

                    {/* Current Quota & Lock Indicator */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs">
                        <span>{row.currentQuota}</span>
                        {row.quotaLocked && <Lock className="w-2.5 h-2.5 text-amber-500" />}
                      </span>
                    </td>

                    {/* Zone Badge */}
                    <td className="py-3.5 px-3 text-right">
                      {isTop4 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                          PLAYOFFS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          CONSOLATION
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

