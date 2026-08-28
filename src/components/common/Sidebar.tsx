import React, { useState } from 'react';
import {
  LayoutDashboard, Trophy, Calendar, Edit3, Users, Flag,
  BarChart3, Award, FileText, Settings, BookOpen, Clock,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Season } from '../../types';

interface SidebarProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  currentSeason?: Season;
  activeWeek?: number;
  activePhase?: string;
  outstandingScoresCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  collapsed: externalCollapsed,
  onToggleCollapse: externalToggle,
  currentSeason,
  activeWeek = 8,
  activePhase = 'REGULAR_SEASON',
  outstandingScoresCount = 0
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = externalToggle || (() => setInternalCollapsed(prev => !prev));

  const weekNum = currentSeason?.currentWeek ?? activeWeek;
  const phase = currentSeason?.currentPhase ?? activePhase;

  const navSections = [
    {
      title: 'CORE LEAGUE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'standings', label: 'League Table', icon: Trophy, badge: 'Top 4' },
        { id: 'fixtures', label: 'Fixtures & Schedule', icon: Calendar },
        { 
          id: 'score-entry', 
          label: 'Score Entry', 
          icon: Edit3, 
          badge: outstandingScoresCount > 0 ? `${outstandingScoresCount} Open` : undefined,
          badgeColor: 'bg-blue-600 text-white'
        },
        { id: 'week-management', label: 'Week Management', icon: Clock },
      ]
    },
    {
      title: 'ROSTER & COURSES',
      items: [
        { id: 'teams', label: 'Teams & Quotas', icon: Users, badge: '10 Teams' },
        { id: 'players', label: 'Players Roster', icon: Users, badge: '20 Players' },
        { id: 'courses', label: 'Golf Courses', icon: Flag },
      ]
    },
    {
      title: 'POSTSEASON & FINALS',
      items: [
        { 
          id: 'playoffs', 
          label: 'Week 16 Semifinals', 
          icon: Trophy, 
          badge: phase === 'PLAYOFFS' || weekNum >= 15 ? 'Active' : undefined,
          badgeColor: 'bg-amber-500 text-white'
        },
        { id: 'championship', label: 'Week 17 Championship', icon: Award },
        { id: 'consolation', label: 'Consolation Bowl (5–10)', icon: Flag },
      ]
    },
    {
      title: 'ANALYTICS & ADMIN',
      items: [
        { id: 'statistics', label: 'Statistics & Charts', icon: BarChart3 },
        { id: 'reports', label: 'Reports & Export', icon: FileText },
        { id: 'settings', label: 'Settings & Database', icon: Settings },
        { id: 'rules', label: 'League Rulebook', icon: BookOpen },
      ]
    }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Banner / Logo */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white shadow-sm flex-shrink-0 text-sm">
              ⛳
            </div>
            <div className="truncate">
              <span className="text-base font-bold text-white tracking-tight leading-tight block truncate">
                Pairs Golf
              </span>
              <span className="text-[10px] text-slate-400 font-medium block truncate">
                Executive Workstation
              </span>
            </div>
          </div>
        )}

        <button
          onClick={toggleCollapse}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition mx-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}

            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs font-medium ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />

                  {!isCollapsed && (
                    <div className="flex-1 flex items-center justify-between truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User / Season Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/90">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white border border-slate-600 font-bold">
              GA
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-semibold text-white truncate">Garry Davies</span>
              <span className="text-[10px] text-slate-400 truncate">League Commissioner</span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white border border-slate-600 font-bold mx-auto">
            GA
          </div>
        )}
      </div>
    </aside>
  );
};

