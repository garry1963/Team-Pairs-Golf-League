import React from 'react';
import { Minus, Square, X, Search, ShieldCheck } from 'lucide-react';
import { Season, AppSettings } from '../../types';

interface WindowsTitleBarProps {
  currentSeason?: Season;
  seasonName?: string;
  settings?: AppSettings;
  onOpenSearch: () => void;
  onNavigate?: (screen: string) => void;
}

export const WindowsTitleBar: React.FC<WindowsTitleBarProps> = ({
  currentSeason,
  seasonName,
  settings,
  onOpenSearch,
  onNavigate
}) => {
  const title = currentSeason?.name || seasonName || 'Pairs Golf Championship';
  const phase = currentSeason?.currentPhase || 'REGULAR_SEASON';
  const week = currentSeason?.currentWeek || 8;
  const userName = settings?.currentUserName || 'Garry Davies';

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand / Title */}
      <div className="flex items-center space-x-3">
        <div 
          onClick={() => onNavigate && onNavigate('dashboard')}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-80 transition"
        >
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-xs text-xs">
            ⛳
          </div>
          <span className="text-sm font-bold text-slate-800 tracking-tight">
            PAIRS GAGUE
          </span>
        </div>

        <span className="text-slate-300">|</span>

        {/* Season & Phase Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-700">{title}</span>
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold">
            {phase.replace('_', ' ')} • W{week}
          </span>
        </div>
      </div>

      {/* Center: Search Trigger Input */}
      <div className="flex-1 max-w-sm mx-6">
        <div 
          onClick={onOpenSearch}
          className="relative cursor-pointer group"
        >
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors" />
          <input
            type="text"
            readOnly
            placeholder="Search players, teams, fixtures... (Ctrl+K)"
            className="w-full pl-9 pr-14 py-1.5 bg-slate-100 hover:bg-slate-200/60 border border-transparent rounded-full text-xs text-slate-700 placeholder-slate-400 outline-none cursor-pointer transition-colors"
          />
          <kbd className="absolute right-2.5 top-2 px-1.5 py-0.5 bg-white text-[10px] font-semibold text-slate-500 rounded border border-slate-200 shadow-2xs">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: User Badge & Window Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">{userName}</span>
        </div>

        {/* Windows Window Buttons */}
        <div className="flex items-center space-x-1 border-l border-slate-200 pl-3">
          <button 
            title="Minimize"
            className="w-7 h-7 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="Maximize / Restore"
            className="w-7 h-7 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition flex items-center justify-center"
          >
            <Square className="w-3 h-3" />
          </button>
          <button 
            title="Close"
            className="w-7 h-7 rounded hover:bg-red-500 text-slate-500 hover:text-white transition flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

