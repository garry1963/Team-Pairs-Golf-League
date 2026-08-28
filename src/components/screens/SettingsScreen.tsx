import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Database, Save, Upload, Download,
  CheckCircle2, XCircle, Play, Shield, ShieldCheck, RefreshCw, AlertTriangle, FileSpreadsheet, Eye
} from 'lucide-react';
import { AppSettings, AuditLog, Season } from '../../types';
import { DatabaseEngine } from '../../storage/db';
import { LeagueUnitTester, TestResultItem } from '../../engine/unitTests';
import { ImportService } from '../../services/importService';

interface SettingsScreenProps {
  season: Season;
  settings: AppSettings;
  auditLogs: AuditLog[];
  onToast: (type: 'success' | 'error' | 'warning', title: string, msg: string) => void;
  onReload: () => void;
}

interface TestRunState {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  results: TestResultItem[];
  durationMs: number;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  season,
  settings,
  auditLogs,
  onToast,
  onReload
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'season' | 'database' | 'import' | 'audit' | 'tests'>('season');

  // General form
  const [societyName, setSocietyName] = useState(settings.societyName);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || '');
  const [seasonWeeks, setSeasonWeeks] = useState(settings.seasonLength || 15);
  const [matchesPerWeek, setMatchesPerWeek] = useState(settings.matchesPerWeek || 5);
  const [pointsWin, setPointsWin] = useState(settings.pointsForWin ?? settings.winPoints ?? 2);
  const [pointsDraw, setPointsDraw] = useState(settings.pointsForDraw ?? settings.drawPoints ?? 1);
  const [pointsLoss, setPointsLoss] = useState(settings.pointsForLoss ?? settings.lossPoints ?? 0);

  // Modals confirmation
  const [confirmClearSeedModal, setConfirmClearSeedModal] = useState(false);
  const [confirmClearScoresModal, setConfirmClearScoresModal] = useState(false);
  const [confirmResetDemoModal, setConfirmResetDemoModal] = useState(false);

  // Test suite state
  const [testResults, setTestResults] = useState<TestRunState | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Import state
  const [importText, setImportText] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    DatabaseEngine.updateSettings({
      societyName: societyName.trim(),
      adminEmail: adminEmail.trim(),
      seasonLength: seasonWeeks,
      matchesPerWeek: matchesPerWeek,
      winPoints: pointsWin,
      drawPoints: pointsDraw,
      lossPoints: pointsLoss,
      pointsForWin: pointsWin,
      pointsForDraw: pointsDraw,
      pointsForLoss: pointsLoss
    });
    onToast('success', 'Settings Saved', 'Application preferences updated successfully.');
  };

  const handleRegenerateSchedule = () => {
    const res = DatabaseEngine.regenerateSchedule(seasonWeeks, matchesPerWeek);
    if (res.success) {
      onToast('success', 'Schedule Generated', res.message);
      onReload();
    } else {
      onToast('error', 'Generation Error', res.message);
    }
  };

  const handleRemoveAllSeedData = () => {
    const res = DatabaseEngine.removeAllSeedData(true);
    if (res.success) {
      onToast('success', 'Seed Data Removed', res.message);
      setConfirmClearSeedModal(false);
      onReload();
    }
  };

  const handleClearScores = () => {
    const res = DatabaseEngine.clearAllScoresAndResults();
    if (res.success) {
      onToast('success', 'Scores Cleared', res.message);
      setConfirmClearScoresModal(false);
      onReload();
    }
  };

  const handleResetDemo = () => {
    DatabaseEngine.resetToCleanDemo();
    onToast('success', 'Demo League Loaded', 'Restored default 10 teams, 20 players, and 15-week schedule.');
    setConfirmResetDemoModal(false);
    onReload();
  };

  const handleBackup = () => {
    const jsonStr = DatabaseEngine.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pairs_golf_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('success', 'Backup Exported', 'Full database snapshot downloaded.');
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = DatabaseEngine.importBackupJSON(content);
      if (res.success) {
        onToast('success', 'Database Restored', res.message);
        onReload();
      } else {
        onToast('error', 'Restore Failed', res.message);
      }
    };
    reader.readAsText(file);
  };

  const handleRunUnitTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = LeagueUnitTester.runAllTests();
      setTestResults(results);
      setIsRunningTests(false);
      onToast('success', 'Engine Verification Complete', `Passed ${results.passedCount}/${results.total} rules.`);
    }, 200);
  };

  const handleParseImport = () => {
    if (!importText.trim()) {
      onToast('error', 'Validation Error', 'Paste CSV score data to validate.');
      return;
    }
    const res = ImportService.validateScoreImportCsv(importText);
    setImportResult(res);
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              League Settings & System Diagnostics
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Configure season weeks, matches per week, database seed removal, scoring points, and engine diagnostics
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('season')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'season'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Season & Schedule Setup
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          General & Points Rules
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'database'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Database & Seed Data Management
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'import'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          CSV / Excel Import
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Audit Log ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 ${
            activeTab === 'tests'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Automated Engine Tests</span>
        </button>
      </div>

      {/* Tab: Season & Schedule Setup */}
      {activeTab === 'season' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Season Length & Weekly Matches Configuration</h3>
            <p className="text-xs text-slate-500 mt-1">
              Customize the total number of regular season weeks and the scheduled matches per week for your league.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Number of Weeks Setting */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-900 font-bold text-sm">Number of Regular Season Weeks</label>
                <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {seasonWeeks} Weeks
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Controls the duration of the regular season before the playoff quota lock and knockout brackets trigger.
              </p>
              <div className="space-y-2">
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={seasonWeeks}
                  onChange={e => setSeasonWeeks(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={seasonWeeks}
                    onChange={e => setSeasonWeeks(Math.max(1, Math.min(30, Number(e.target.value) || 1)))}
                    className="w-28 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-500">Regular season rounds (e.g. 10, 15, 20)</span>
                </div>
              </div>
            </div>

            {/* Matches Per Week Setting */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-900 font-bold text-sm">Number of Matches Per Week</label>
                <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {matchesPerWeek} Matches/Wk
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The number of paired matches scheduled per week across the participating teams and courses.
              </p>
              <div className="space-y-2">
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={matchesPerWeek}
                  onChange={e => setMatchesPerWeek(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={matchesPerWeek}
                    onChange={e => setMatchesPerWeek(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                    className="w-28 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-slate-500">Fixtures scheduled per round (default: 5)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Action Banner */}
          <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-blue-950 text-sm">Regenerate League Schedule with New Parameters</h4>
              <p className="text-xs text-blue-800 leading-relaxed">
                Calculates a balanced round-robin fixture list for {seasonWeeks} weeks with {matchesPerWeek} matches per week ({seasonWeeks * matchesPerWeek} total matches) based on your currently registered teams.
              </p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-2xs transition"
              >
                Save Settings Only
              </button>
              <button
                type="button"
                onClick={handleRegenerateSchedule}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Apply & Regenerate Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-900 text-base">Society Configuration & Points Allocation</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Golf Society / League Title</label>
              <input
                type="text"
                required
                value={societyName}
                onChange={e => setSocietyName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">League Administrator Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Official League Season Points System</h4>
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-blue-900 font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Cumulative Match Net Result Points</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Each team's League Season Points total is the cumulative sum of their weekly match Net Result values. Positive net results are <strong>added</strong> to the running points total, while negative net results are <strong>deducted</strong>.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                  <span className="text-[11px] font-bold text-green-700 block">+ Net Result (e.g. +8 pts)</span>
                  <span className="text-[10px] text-slate-500">Adds directly to team's running season points</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-blue-100">
                  <span className="text-[11px] font-bold text-rose-700 block">- Net Result (e.g. -6 pts)</span>
                  <span className="text-[10px] text-slate-500">Deducts directly from team's running season points</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Database Backup & Seed Data Management */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Persistent Database & Seed Data Management</h3>
            <p className="text-xs text-slate-500 mt-1">
              Remove seed demo data for clean real-league entry, reset match scores, or export/restore backup snapshots.
            </p>
          </div>

          {/* Seed Data and Reset Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Remove All Seed Data */}
            <div className="p-5 rounded-xl bg-rose-50 border border-rose-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Remove All Seed Data</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Completely wipes all demo players, teams, fixtures, and scores. Produces a 100% clean blank slate so you can enter your real society roster.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClearSeedModal(true)}
                className="w-full px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-2xs transition"
              >
                Remove All Seed Data
              </button>
            </div>

            {/* Card 2: Clear Scores & Results */}
            <div className="p-5 rounded-xl bg-amber-50 border border-amber-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
                  <RefreshCw className="w-5 h-5" />
                  <span>Clear Scores & Reset Week 1</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Keeps all existing registered teams and player rosters, but clears all entered scores and resets the season back to Week 1.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmClearScoresModal(true)}
                className="w-full px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition"
              >
                Clear Scores (Keep Teams)
              </button>
            </div>

            {/* Card 3: Re-seed Demo League */}
            <div className="p-5 rounded-xl bg-blue-50 border border-blue-200 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-blue-700 font-bold text-sm">
                  <Database className="w-5 h-5" />
                  <span>Re-Seed Demo League</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Loads the default demo dataset with 10 pairs teams, 20 players, course setup, and active Week 8 schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmResetDemoModal(true)}
                className="w-full px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition"
              >
                Load Demo Dataset
              </button>
            </div>
          </div>

          {/* Backup & Restore JSON */}
          <div className="border-t border-slate-100 pt-6">
            <h4 className="font-bold text-slate-900 text-sm mb-3">Offline Backup Snapshot & Restore</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Export Full Backup</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Download all seasons, teams, players, scores, courses, and audit logs into a single JSON file.
                </p>
                <button
                  onClick={handleBackup}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Backup (.json)</span>
                </button>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Restore from Backup</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Import a previously exported JSON backup file to overwrite or restore league data.
                </p>
                <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 cursor-pointer shadow-xs transition">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Select JSON File</span>
                  <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Remove All Seed Data */}
      {confirmClearSeedModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Remove All Seed Data?</h3>
                <span className="text-xs text-slate-500">This action will wipe all demo players and teams</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will completely remove all 10 demo teams, 20 players, simulated fixture schedules, and entered match scores. You will have a clean blank league ready to register your actual players and teams.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmClearSeedModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveAllSeedData}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
              >
                Confirm Wipe Seed Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear Scores */}
      {confirmClearScoresModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Reset to Week 1 (Clear Scores)?</h3>
                <span className="text-xs text-slate-500">Teams and rosters will remain preserved</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              All entered match scores, handicaps, and standings will be reset to Week 1. Your team pairings and player profiles will stay saved.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmClearScoresModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearScores}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition"
              >
                Reset Scores
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Re-seed Demo */}
      {confirmResetDemoModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center space-x-3 text-blue-600">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Load Default Demo League?</h3>
                <span className="text-xs text-slate-500">Restores standard 10 teams and 15 weeks</span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore the complete demo dataset with 10 pairs teams, 20 players, golf courses, and 7 completed weeks.
            </p>
            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmResetDemoModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
              >
                Load Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: CSV Import */}
      {activeTab === 'import' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Bulk CSV Score Import</h3>
            <p className="text-xs text-slate-500 mt-1">
              Paste CSV score data containing columns: Week, TeamName, Player1Gross, Player2Gross.
            </p>
          </div>

          <textarea
            rows={5}
            value={importText}
            onChange={e => setImportText(e.target.value)}
            placeholder="Week,TeamName,Player1Gross,Player2Gross&#10;8,Eagles,68,65&#10;8,Birdies,70,72"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />

          <div className="flex justify-end space-x-2">
            <button
              onClick={handleParseImport}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Validate CSV Data</span>
            </button>
          </div>

          {importResult && (
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h4 className="font-bold text-slate-900">Validation Results:</h4>
              <p className="text-emerald-700 font-semibold">{importResult.validRows.length} valid rows parsed.</p>
              {importResult.errors.length > 0 && (
                <div className="text-rose-600 space-y-1">
                  {importResult.errors.map((err: string, i: number) => (
                    <div key={i}>&bull; {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Audit Log */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Immutable Audit Log</h3>
            <span className="text-xs text-slate-500">{auditLogs.length} Recorded Operations</span>
          </div>

          <div className="overflow-x-auto max-h-96 custom-scrollbar">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] sticky top-0 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-4">Details</th>
                  <th className="py-2.5 px-3">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt || (log as any).timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700">{log.entityType} {log.entityId ? `#${log.entityId}` : ''}</td>
                    <td className="py-2.5 px-4 text-slate-900">{log.reason || log.newValue || (log as any).details || '--'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{log.userId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Automated Unit Test Suite Runner */}
      {activeTab === 'tests' && (
        <div className="bg-white p-6 rounded-xl border border-amber-300 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center space-x-2">
                <Shield className="w-5 h-5 text-amber-600" />
                <span>Authoritative League Engine Test Suite</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Automated in-app unit tests validating Scoring, Relative-to-Par, Net Result, Tiebreakers, and Week 15 Quota Locking.
              </p>
            </div>

            <button
              onClick={handleRunUnitTests}
              disabled={isRunningTests}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>{isRunningTests ? 'Running Suite...' : 'Run Automated Tests'}</span>
            </button>
          </div>

          {testResults ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      Engine Verification {testResults.passed ? 'Passed' : 'Failed'} ({testResults.passedCount} / {testResults.total} tests)
                    </h4>
                    <span className="text-[11px] text-slate-500">Total runtime: {testResults.durationMs} ms</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full border font-bold text-xs ${
                  testResults.passed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {testResults.passed ? 'ALL GREEN 100%' : 'FAILURES DETECTED'}
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {testResults.results.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      {t.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-bold text-slate-900 text-xs">{t.name}</h5>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                            {t.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Expected: <span className="text-emerald-700 font-mono font-medium">{t.expected}</span> &bull; Actual: <span className="text-slate-700 font-mono">{t.actual}</span>
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-emerald-700">PASS</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
              Click &quot;Run Automated Tests&quot; above to execute the mathematical validation suite across scoring algorithms.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

