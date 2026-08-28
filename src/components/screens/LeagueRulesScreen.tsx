import React from 'react';
import { BookOpen, Trophy, Shield, Lock, Award, CheckCircle2, Clock } from 'lucide-react';
import { SCORING_POINTS_TIERS } from '../../engine/scoring';

export const LeagueRulesScreen: React.FC = () => {
  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-1">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Official Pairs Golf League Constitution & Rulebook
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Governing Constitution for 10-Team Pairs Golf Leagues &bull; Authoritative Rules, Quota System & Playoff Framework
        </p>
      </div>

      {/* Rules Accordions / Cards */}
      <div className="space-y-4 text-xs text-slate-700">
        {/* Rule 1: Structure */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
            <Trophy className="w-4 h-4" />
            <span>1. League Structure & Format</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            The league comprises exactly <strong className="text-slate-900">10 Pairs Teams</strong> (2 players per team, 20 total competitors). The season consists of a 15-Week Regular Season round-robin schedule followed by a 2-Week Postseason Championship (Week 16 Semifinals and Week 17 Grand Final).
          </p>
        </div>

        {/* Rule 2: Scoring Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
            <Award className="w-4 h-4" />
            <span>2. Individual Scoring Matrix (Relative to Par)</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            Players are awarded League Points based strictly on their Gross Score Relative to Par for the host course:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-center">
            {SCORING_POINTS_TIERS.map((tier) => (
              <div key={tier.relativeToParLabel} className="p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 block font-medium">{tier.relativeToParLabel} to par</span>
                <span className="font-bold text-blue-700 text-base">{tier.points} pts</span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 pt-1">
            *Scores of +13 or worse, as well as Did Not Finish (DNF) or deadline forfeiture, receive the minimum baseline of <strong className="text-slate-700">12 points</strong>.
          </p>
        </div>

        {/* Rule 3: Team Quota & Net Result Points System */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
            <Shield className="w-4 h-4" />
            <span>3. Team Points, Quota & Season Points System</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 leading-relaxed text-slate-600 pl-1">
            <li><strong className="text-slate-900">Team Points:</strong> The sum of Player 1 League Points and Player 2 League Points.</li>
            <li><strong className="text-slate-900">Weekly Net Result:</strong> Calculated as <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-bold border border-slate-200">Team Points Total - Current Team Quota</code> (e.g. 68 Team Points minus 60 Quota = +8 Net Result).</li>
            <li><strong className="text-slate-900">Cumulative Season Points:</strong> Each team's Season Points are their cumulative Match Net Result value. A positive Net Result is added to the team's running season points total, while a negative Net Result is subtracted from it.</li>
          </ul>
        </div>

        {/* Rule 4: Standings Order & Quota Adjustments */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>4. League Standings Hierarchy</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-600 pl-1">
            <li><strong className="text-slate-900">Season Points:</strong> Standings rank teams primarily by total Season Points (cumulative Net Result).</li>
            <li><strong className="text-slate-900">Total Team Points:</strong> If Season Points are tied, teams are separated by total aggregate Team Points scored across the season.</li>
            <li><strong className="text-slate-900">Alphabetical:</strong> If still tied, alphabetical order by team name applies.</li>
          </ol>
        </div>

        {/* Rule 5: Week 15 Quota Lock & Playoffs */}
        <div className="bg-slate-50 p-6 rounded-xl border border-amber-300 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>5. Week 15 Permanent Quota Lock & Postseason Playoffs</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            Upon the conclusion and finalization of Regular Season Week 15, all team quotas are permanently locked. No further quota adjustments occur during the postseason.
          </p>
          <ul className="list-disc list-inside space-y-1 leading-relaxed text-slate-600 pl-1">
            <li><strong className="text-slate-800">Championship Semifinals (Week 16):</strong> Seed #1 vs Seed #4, and Seed #2 vs Seed #3.</li>
            <li><strong className="text-slate-800">Championship Grand Final (Week 17):</strong> Semifinal Winner 1 vs Semifinal Winner 2 to crown the League Champion.</li>
            <li><strong className="text-slate-800">Consolation Bowl:</strong> Teams finishing #5 through #10 compete in the postseason Consolation tournament.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
