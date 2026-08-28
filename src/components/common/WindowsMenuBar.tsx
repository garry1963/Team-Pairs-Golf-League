import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Database, Download, Upload, LogOut, LayoutDashboard,
  Trophy, Calendar, Users, Flag, Play, Award, Settings, ShieldAlert,
  HelpCircle, BookOpen, CheckCircle, RefreshCw, Layers, Search
} from 'lucide-react';

interface WindowsMenuBarProps {
  onNavigate: (screen: string) => void;
  onBackup?: () => void;
  onRestore?: () => void;
  onExport?: () => void;
  onExportPdf?: () => void;
  onRunTests?: () => void;
  onSearch?: () => void;
}

export const WindowsMenuBar: React.FC<WindowsMenuBarProps> = ({
  onNavigate,
  onBackup,
  onRestore,
  onExport,
  onExportPdf,
  onRunTests,
  onSearch
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const handleItemSelect = (action?: () => void) => {
    if (action) action();
    setOpenMenu(null);
  };

  return (
    <div ref={menuRef} className="h-7 bg-slate-900 text-slate-300 flex items-center px-4 text-xs border-b border-slate-800 select-none relative z-40">
      {/* FILE MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('File')}
          className={`px-2.5 py-0.5 rounded hover:bg-slate-800 hover:text-white transition ${
            openMenu === 'File' ? 'bg-slate-800 text-white font-semibold' : ''
          }`}
        >
          File
        </button>
        {openMenu === 'File' && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => handleItemSelect(onBackup)}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Backup Database</span>
            </button>
            <button
              onClick={() => handleItemSelect(onRestore)}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Upload className="w-3.5 h-3.5 text-amber-500" />
              <span>Restore Database</span>
            </button>
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => handleItemSelect(onExportPdf || onExport)}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Export League Standings (PDF)</span>
            </button>
            {onSearch && (
              <button
                onClick={() => handleItemSelect(onSearch)}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span>Search Everything (Ctrl+K)</span>
              </button>
            )}
            <div className="my-1 border-t border-slate-100" />
            <button
              onClick={() => handleItemSelect(() => onNavigate('dashboard'))}
              className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-slate-700 hover:text-red-600 flex items-center gap-2 text-xs font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-red-500" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        )}
      </div>

      {/* LEAGUE MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('League')}
          className={`px-2.5 py-0.5 rounded hover:bg-slate-800 hover:text-white transition ${
            openMenu === 'League' ? 'bg-slate-800 text-white font-semibold' : ''
          }`}
        >
          League
        </button>
        {openMenu === 'League' && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => handleItemSelect(() => onNavigate('dashboard'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('standings'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Standings / League Table</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('fixtures'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Fixtures & Schedule</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('teams'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Teams & Quotas</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('players'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Players Roster</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('courses'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Flag className="w-3.5 h-3.5 text-blue-600" />
              <span>Courses</span>
            </button>
          </div>
        )}
      </div>

      {/* COMPETITION MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('Competition')}
          className={`px-2.5 py-0.5 rounded hover:bg-slate-800 hover:text-white transition ${
            openMenu === 'Competition' ? 'bg-slate-800 text-white font-semibold' : ''
          }`}
        >
          Competition
        </button>
        {openMenu === 'Competition' && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => handleItemSelect(() => onNavigate('week-management'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Week Management</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('playoffs'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Week 16 Semifinals</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('championship'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Week 17 Championship</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('consolation'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Flag className="w-3.5 h-3.5 text-blue-600" />
              <span>Consolation Bowl (Teams 5–10)</span>
            </button>
          </div>
        )}
      </div>

      {/* REPORTS MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('Reports')}
          className={`px-2.5 py-0.5 rounded hover:bg-slate-800 hover:text-white transition ${
            openMenu === 'Reports' ? 'bg-slate-800 text-white font-semibold' : ''
          }`}
        >
          Reports
        </button>
        {openMenu === 'Reports' && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => handleItemSelect(() => onNavigate('reports'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Reports & Exports</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('statistics'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
              <span>Statistics & Charts</span>
            </button>
          </div>
        )}
      </div>

      {/* ADMINISTRATION MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('Admin')}
          className={`px-2.5 py-0.5 rounded hover:bg-slate-800 hover:text-white transition ${
            openMenu === 'Admin' ? 'bg-slate-800 text-white font-semibold' : ''
          }`}
        >
          Administration
        </button>
        {openMenu === 'Admin' && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => handleItemSelect(() => onNavigate('settings'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <Settings className="w-3.5 h-3.5 text-blue-600" />
              <span>Season & League Setup</span>
            </button>
            <button
              onClick={() => handleItemSelect(() => onNavigate('startup'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2 text-xs font-medium"
            >
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>Startup Screen & Seed Data</span>
            </button>
            {onRunTests && (
              <button
                onClick={() => handleItemSelect(onRunTests)}
                className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium border-t border-slate-100"
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span>Run Automated Logic Tests</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* HELP MENU */}
      <div className="relative">
        <button
          onClick={() => handleMenuClick('Help')}
          className={`px-2.5 py-0.5 rounded hover:bg-slate-800 hover:text-white transition ${
            openMenu === 'Help' ? 'bg-slate-800 text-white font-semibold' : ''
          }`}
        >
          Help
        </button>
        {openMenu === 'Help' && (
          <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 shadow-xl rounded-lg py-1 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => handleItemSelect(() => onNavigate('rules'))}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 text-xs font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Official League Rulebook</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

