import React, { useState, useEffect } from 'react';
import { DatabaseEngine } from './storage/db';
import { DatabaseState, StandingsRow } from './types';
import { WindowsTitleBar } from './components/common/WindowsTitleBar';
import { WindowsMenuBar } from './components/common/WindowsMenuBar';
import { WindowsStatusBar } from './components/common/WindowsStatusBar';
import { Sidebar } from './components/common/Sidebar';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ToastContainer, ToastMessage } from './components/common/ToastContainer';

// Screens
import { StartupScreen } from './components/screens/StartupScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { LeagueTableScreen } from './components/screens/LeagueTableScreen';
import { FixturesScreen } from './components/screens/FixturesScreen';
import { ScoreEntryScreen } from './components/screens/ScoreEntryScreen';
import { TeamsScreen } from './components/screens/TeamsScreen';
import { TeamProfileScreen } from './components/screens/TeamProfileScreen';
import { PlayersScreen } from './components/screens/PlayersScreen';
import { PlayerProfileScreen } from './components/screens/PlayerProfileScreen';
import { CoursesScreen } from './components/screens/CoursesScreen';
import { WeekManagementScreen } from './components/screens/WeekManagementScreen';
import { PlayoffsScreen } from './components/screens/PlayoffsScreen';
import { ChampionshipScreen } from './components/screens/ChampionshipScreen';
import { ConsolationBowlScreen } from './components/screens/ConsolationBowlScreen';
import { StatisticsScreen } from './components/screens/StatisticsScreen';
import { ReportsScreen } from './components/screens/ReportsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { LeagueRulesScreen } from './components/screens/LeagueRulesScreen';
import { ExportService } from './services/exportService';

export default function App() {
  const [dbState, setDbState] = useState<DatabaseState>(DatabaseEngine.getState());
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | undefined>(undefined);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(undefined);

  // Global search modal & Toasts
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Subscribe to persistent database changes
  useEffect(() => {
    const unsubscribe = DatabaseEngine.subscribe(() => {
      setDbState(DatabaseEngine.getState());
    });
    return () => unsubscribe();
  }, []);

  // Global Keyboard Shortcuts (Ctrl+K search, Ctrl+S export, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const activeSeason = dbState.seasons.find(s => s.status === 'ACTIVE') || dbState.seasons[0];
  const standings = dbState.standings;

  // Handlers
  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleSelectFixture = (fixtureId: number) => {
    setSelectedFixtureId(fixtureId);
    setCurrentScreen('score-entry');
  };

  const handleSelectTeam = (teamId: number) => {
    setSelectedTeamId(teamId);
    setCurrentScreen('team-profile');
  };

  const handleSelectPlayer = (playerId: number) => {
    setSelectedPlayerId(playerId);
    setCurrentScreen('player-profile');
  };

  const handleQuickBackup = () => {
    try {
      const jsonStr = DatabaseEngine.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pairs_golf_league_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'Backup Saved', 'Database snapshot exported.');
    } catch (e: any) {
      addToast('error', 'Backup Failed', e.message);
    }
  };

  const handleQuickExportPdf = () => {
    try {
      ExportService.exportStandingsPdf(standings, activeSeason.name, dbState.settings.societyName);
      addToast('success', 'PDF Generated', 'Official Standings downloaded.');
    } catch (e: any) {
      addToast('error', 'Export Error', e.message);
    }
  };

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'startup':
        return (
          <StartupScreen
            onOpenLeague={() => setCurrentScreen('dashboard')}
            onCreateNewLeague={() => setCurrentScreen('dashboard')}
            onLoadDemo={() => {
              DatabaseEngine.resetDatabase();
              addToast('success', 'Demo Re-seeded', 'Clean 10-team league restored.');
              setCurrentScreen('dashboard');
            }}
          />
        );

      case 'dashboard':
        return (
          <DashboardScreen
            season={activeSeason}
            standings={standings}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            teamResults={dbState.teamResults}
            onNavigate={handleNavigate}
            onSelectFixture={handleSelectFixture}
          />
        );

      case 'standings':
        return (
          <LeagueTableScreen
            season={activeSeason}
            standings={standings}
            settings={dbState.settings}
            onSelectTeam={handleSelectTeam}
          />
        );

      case 'fixtures':
        return (
          <FixturesScreen
            season={activeSeason}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            players={dbState.players}
            courses={dbState.courses}
            teamResults={dbState.teamResults}
            onSelectFixture={handleSelectFixture}
            onNavigate={handleNavigate}
            onToast={addToast}
          />
        );

      case 'score-entry':
        return (
          <ScoreEntryScreen
            fixtureId={selectedFixtureId}
            season={activeSeason}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            players={dbState.players}
            courses={dbState.courses}
            playerScores={dbState.playerScores}
            teamResults={dbState.teamResults}
            onBack={() => setCurrentScreen('fixtures')}
            onScoreSaved={(msg) => {
              addToast('success', 'Score Saved', msg);
              setCurrentScreen('fixtures');
            }}
          />
        );

      case 'teams':
        return (
          <TeamsScreen
            season={activeSeason}
            teams={dbState.teams}
            players={dbState.players}
            onSelectTeam={handleSelectTeam}
            onToast={addToast}
          />
        );

      case 'team-profile':
        return (
          <TeamProfileScreen
            teamId={selectedTeamId || dbState.teams[0]?.id || 1}
            season={activeSeason}
            teams={dbState.teams}
            players={dbState.players}
            fixtures={dbState.fixtures}
            teamResults={dbState.teamResults}
            standings={standings}
            courses={dbState.courses}
            onBack={() => setCurrentScreen('teams')}
            onToast={addToast}
          />
        );

      case 'players':
        return (
          <PlayersScreen
            season={activeSeason}
            players={dbState.players}
            teams={dbState.teams}
            playerScores={dbState.playerScores}
            onSelectPlayer={handleSelectPlayer}
            onToast={addToast}
          />
        );

      case 'player-profile':
        return (
          <PlayerProfileScreen
            playerId={selectedPlayerId || dbState.players[0]?.id || 1}
            players={dbState.players}
            teams={dbState.teams}
            playerScores={dbState.playerScores}
            fixtures={dbState.fixtures}
            courses={dbState.courses}
            onBack={() => setCurrentScreen('players')}
          />
        );

      case 'courses':
        return (
          <CoursesScreen
            courses={dbState.courses}
            onToast={addToast}
          />
        );

      case 'week-management':
        return (
          <WeekManagementScreen
            season={activeSeason}
            fixtures={dbState.fixtures}
            standings={standings}
            teams={dbState.teams}
            courses={dbState.courses}
            onToast={addToast}
            onNavigate={handleNavigate}
          />
        );

      case 'playoffs':
        return (
          <PlayoffsScreen
            season={activeSeason}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            courses={dbState.courses}
            teamResults={dbState.teamResults}
            standings={standings}
            onSelectFixture={handleSelectFixture}
            onNavigate={handleNavigate}
          />
        );

      case 'championship':
        return (
          <ChampionshipScreen
            season={activeSeason}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            players={dbState.players}
            courses={dbState.courses}
            teamResults={dbState.teamResults}
            onSelectFixture={handleSelectFixture}
            onNavigate={handleNavigate}
          />
        );

      case 'consolation':
        return (
          <ConsolationBowlScreen
            season={activeSeason}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            courses={dbState.courses}
            teamResults={dbState.teamResults}
            standings={standings}
            onSelectFixture={handleSelectFixture}
            onNavigate={handleNavigate}
          />
        );

      case 'statistics':
        return (
          <StatisticsScreen
            season={activeSeason}
            standings={standings}
            players={dbState.players}
            playerScores={dbState.playerScores}
            teams={dbState.teams}
            teamResults={dbState.teamResults}
            onSelectPlayer={handleSelectPlayer}
            onSelectTeam={handleSelectTeam}
          />
        );

      case 'reports':
        return (
          <ReportsScreen
            season={activeSeason}
            standings={standings}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            players={dbState.players}
            playerScores={dbState.playerScores}
            settings={dbState.settings}
            onToast={addToast}
          />
        );

      case 'settings':
        return (
          <SettingsScreen
            season={activeSeason}
            settings={dbState.settings}
            auditLogs={dbState.auditLogs}
            onToast={addToast}
            onReload={() => setDbState(DatabaseEngine.getState())}
          />
        );

      case 'rules':
        return <LeagueRulesScreen />;

      default:
        return (
          <DashboardScreen
            season={activeSeason}
            standings={standings}
            fixtures={dbState.fixtures}
            teams={dbState.teams}
            teamResults={dbState.teamResults}
            onNavigate={handleNavigate}
            onSelectFixture={handleSelectFixture}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
      {/* 1. Windows Native OS Desktop Title Bar */}
      <WindowsTitleBar
        seasonName={activeSeason?.name || '2026 Championship'}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 2. Classic Windows Application Menu Bar */}
      <WindowsMenuBar
        onNavigate={handleNavigate}
        onBackup={handleQuickBackup}
        onExportPdf={handleQuickExportPdf}
        onSearch={() => setIsSearchOpen(true)}
      />

      {/* 3. Main Desktop Workstation Layout (Sidebar + Active Screen) */}
      <div className="flex-1 flex overflow-hidden">
        {currentScreen !== 'startup' && (
          <Sidebar
            currentScreen={currentScreen}
            onNavigate={handleNavigate}
            activeWeek={activeSeason?.currentWeek || 8}
            activePhase={activeSeason?.currentPhase || 'REGULAR_SEASON'}
          />
        )}

        <main className="flex-1 overflow-y-auto bg-slate-100">
          {renderActiveScreen()}
        </main>
      </div>

      {/* 4. Windows Desktop Status Bar */}
      <WindowsStatusBar
        currentWeek={activeSeason?.currentWeek || 8}
        totalWeeks={activeSeason?.totalWeeks || 17}
        phase={activeSeason?.currentPhase || 'REGULAR_SEASON'}
        syncStatus="CONNECTED"
      />

      {/* 5. Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        teams={dbState.teams}
        players={dbState.players}
        fixtures={dbState.fixtures}
        onSelectTeam={(tId) => {
          handleSelectTeam(tId);
          setIsSearchOpen(false);
        }}
        onSelectPlayer={(pId) => {
          handleSelectPlayer(pId);
          setIsSearchOpen(false);
        }}
        onSelectFixture={(fId) => {
          handleSelectFixture(fId);
          setIsSearchOpen(false);
        }}
        onNavigate={(screen) => {
          handleNavigate(screen);
          setIsSearchOpen(false);
        }}
      />

      {/* 6. Desktop Toast Notifications System */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
