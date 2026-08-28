import React, { useState, useEffect } from 'react';
import { Database, Wifi, Lock, Unlock, Clock, CheckCircle2 } from 'lucide-react';
import { Season } from '../../types';

interface WindowsStatusBarProps {
  currentSeason?: Season;
  currentWeek?: number;
  totalWeeks?: number;
  phase?: string;
  quotasLocked?: boolean;
  syncStatus?: string;
}

export const WindowsStatusBar: React.FC<WindowsStatusBarProps> = ({
  currentSeason,
  currentWeek = 8,
  totalWeeks = 17,
  phase = 'REGULAR_SEASON',
  quotasLocked,
  syncStatus = 'CONNECTED'
}) => {
  const [time, setTime] = useState<string>('');

  const activeWeek = currentSeason?.currentWeek ?? currentWeek;
  const activeTotal = currentSeason?.totalWeeks ?? totalWeeks;
  const activePhase = currentSeason?.currentPhase ?? phase;
  const isLocked = quotasLocked !== undefined ? quotasLocked : (activeWeek >= 15);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-6 bg-slate-900 text-slate-400 text-[11px] px-4 flex items-center justify-between border-t border-slate-800 select-none z-30 shrink-0">
      {/* Left: DB & Engine Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
          <Database className="w-3 h-3 text-blue-400" />
          <span>Local SQLite: <strong className="text-white">Active</strong></span>
        </div>

        <span className="text-slate-700">|</span>

        <div className="flex items-center space-x-1.5 text-slate-300">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          <span>System Status: <span className="text-slate-200">Online & Synced</span></span>
        </div>

        <span className="text-slate-700">|</span>

        {/* Quota Lock Indicator */}
        <div className="flex items-center space-x-1.5">
          {isLocked ? (
            <span className="flex items-center space-x-1 text-amber-400 font-medium bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40 text-[10px]">
              <Lock className="w-2.5 h-2.5" /> <span>Quotas Locked (Playoffs)</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-blue-300 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-800/40 text-[10px]">
              <Unlock className="w-2.5 h-2.5" /> <span>Dynamic Quotas Active</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: Phase & Clock */}
      <div className="flex items-center space-x-4">
        <span className="text-slate-400">
          Phase: <strong className="text-blue-300">{activePhase.replace('_', ' ')}</strong> (Week {activeWeek}/{activeTotal})
        </span>

        <div className="flex items-center space-x-1 text-slate-300 font-mono text-[10px]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>{time}</span>
        </div>
      </div>
    </footer>
  );
};

