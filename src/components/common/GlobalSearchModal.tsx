import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, Flag, Calendar, Trophy, ChevronRight, User } from 'lucide-react';
import { Player, Team, Course, Fixture, Season } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  players?: Player[];
  teams?: Team[];
  courses?: Course[];
  fixtures?: Fixture[];
  seasons?: Season[];
  onSelectResult?: (type: string, id: number) => void;
  onSelectTeam?: (teamId: number) => void;
  onSelectPlayer?: (playerId: number) => void;
  onSelectFixture?: (fixtureId: number) => void;
  onNavigate?: (screen: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  players = [],
  teams = [],
  courses = [],
  fixtures = [],
  seasons = [],
  onSelectResult,
  onSelectTeam,
  onSelectPlayer,
  onSelectFixture,
  onNavigate
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const cleanQ = query.trim().toLowerCase();

  const matchedTeams = cleanQ
    ? teams.filter(t => t.teamName.toLowerCase().includes(cleanQ))
    : [];

  const matchedPlayers = cleanQ
    ? players.filter(p => p.displayName.toLowerCase().includes(cleanQ) || (p.email && p.email.toLowerCase().includes(cleanQ)))
    : [];

  const matchedCourses = cleanQ
    ? courses.filter(c => c.courseName.toLowerCase().includes(cleanQ) || c.location.toLowerCase().includes(cleanQ))
    : [];

  const matchedFixtures = cleanQ
    ? fixtures.filter(f => `week ${f.weekNumber}`.includes(cleanQ) || (f.notes && f.notes.toLowerCase().includes(cleanQ)))
    : [];

  const totalMatches = matchedTeams.length + matchedPlayers.length + matchedCourses.length + matchedFixtures.length;

  const handleChooseTeam = (id: number) => {
    if (onSelectTeam) onSelectTeam(id);
    else if (onSelectResult) onSelectResult('team', id);
    onClose();
  };

  const handleChoosePlayer = (id: number) => {
    if (onSelectPlayer) onSelectPlayer(id);
    else if (onSelectResult) onSelectResult('player', id);
    onClose();
  };

  const handleChooseFixture = (id: number) => {
    if (onSelectFixture) onSelectFixture(id);
    else if (onSelectResult) onSelectResult('fixture', id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-20 z-50 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Header */}
        <div className="p-3.5 border-b border-slate-100 flex items-center gap-3 bg-white">
          <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search players, teams, courses, fixtures..."
            className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder-slate-400 font-medium"
          />
          <kbd className="px-2 py-0.5 bg-slate-100 text-[10px] font-semibold text-slate-500 rounded border border-slate-200">
            ESC
          </kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {cleanQ === '' ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <p>Type keywords to find any player, team, course, or fixture in the league.</p>
              <div className="flex items-center justify-center gap-2 text-[11px] text-blue-600 font-medium">
                <span>Quick search:</span>
                <span onClick={() => setQuery('Eagles')} className="px-2 py-0.5 bg-slate-100 rounded cursor-pointer hover:bg-slate-200 text-slate-700">Eagles</span>
                <span onClick={() => setQuery('Tiger')} className="px-2 py-0.5 bg-slate-100 rounded cursor-pointer hover:bg-slate-200 text-slate-700">Tiger</span>
                <span onClick={() => setQuery('Week 8')} className="px-2 py-0.5 bg-slate-100 rounded cursor-pointer hover:bg-slate-200 text-slate-700">Week 8</span>
              </div>
            </div>
          ) : totalMatches === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            <>
              {/* Teams */}
              {matchedTeams.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Teams ({matchedTeams.length})
                  </div>
                  {matchedTeams.map(t => (
                    <button
                      key={`team-${t.id}`}
                      onClick={() => handleChooseTeam(t.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition group border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                            {t.teamName}
                          </span>
                          <span className="ml-2 text-xs text-slate-400 font-normal">
                            Quota: {t.currentQuota} {t.quotaLocked && '🔒'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        TEAM
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Players */}
              {matchedPlayers.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Players ({matchedPlayers.length})
                  </div>
                  {matchedPlayers.map(p => (
                    <button
                      key={`player-${p.id}`}
                      onClick={() => handleChoosePlayer(p.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition group border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                            {p.displayName}
                          </span>
                          <span className="ml-2 text-xs text-slate-400 font-normal">
                            Handicap: {p.handicap ?? 'N/A'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        PLAYER
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Courses */}
              {matchedCourses.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Courses ({matchedCourses.length})
                  </div>
                  {matchedCourses.map(c => (
                    <button
                      key={`course-${c.id}`}
                      onClick={() => {
                        if (onNavigate) onNavigate('courses');
                        else if (onSelectResult) onSelectResult('course', c.id);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition group border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <Flag className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                            {c.courseName}
                          </span>
                          <span className="ml-2 text-xs text-slate-400 font-normal">
                            Par {c.par} • {c.location}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        COURSE
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Fixtures */}
              {matchedFixtures.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Fixtures ({matchedFixtures.length})
                  </div>
                  {matchedFixtures.slice(0, 5).map(f => (
                    <button
                      key={`fixture-${f.id}`}
                      onClick={() => handleChooseFixture(f.id)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition group border border-transparent hover:border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                            Week {f.weekNumber} Match #{f.id}
                          </span>
                          <span className="ml-2 text-xs text-slate-400 font-normal">
                            {f.status} • {f.fixtureDate}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        FIXTURE
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

