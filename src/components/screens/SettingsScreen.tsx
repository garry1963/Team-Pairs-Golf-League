import React, { useState } from 'react';
import {
  Settings as SettingsIcon, Database, Save, Upload, Download,
  CheckCircle2, XCircle, Play, Shield, RefreshCw, AlertTriangle, FileSpreadsheet, Eye
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
  const [activeTab, setActiveTab] = useState<'general' | 'database' | 'import' | 'audit' | 'tests'>('general');

  // General form
  const [societyName, setSocietyName] = useState(settings.societyName);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail);
  const [pointsWin, setPointsWin] = useState(settings.pointsForWin);
  const [pointsDraw, setPointsDraw] = useState(settings.pointsForDraw);
  const [pointsLoss, setPointsLoss] = useState(settings.pointsForLoss);

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
      pointsForWin: pointsWin,
      pointsForDraw: pointsDraw,
      pointsForLoss: pointsLoss
    });
    onToast('success', 'Settings Saved', 'Application preferences updated successfully.');
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
            Configure society parameters, database backup/restore, audit logs, and automated engine validation
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'general'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          General Rules
        </button>
        <button
          onClick={() => setActiveTab('database')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'database'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Database Backup & Restore
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'import'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          CSV / Excel Import
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Audit Log ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
            activeTab === 'tests'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Automated Engine Tests</span>
        </button>
      </div>

      {/* Tab 1: General Settings */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="font-bold text-slate-900 text-base">Society Configuration</h3>

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
            <h4 className="font-bold text-slate-900 text-sm">League Match Points Allocation</h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Points for Win</label>
                <input
                  type="number"
                  value={pointsWin}
                  onChange={e => setPointsWin(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-blue-700 font-bold font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Points for Draw</label>
                <input
                  type="number"
                  value={pointsDraw}
                  onChange={e => setPointsDraw(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-amber-700 font-bold font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Points for Loss</label>
                <input
                  type="number"
                  value={pointsLoss}
                  onChange={e => setPointsLoss(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-rose-700 font-bold font-mono text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
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

      {/* Tab 2: Database Backup & Restore */}
      {activeTab === 'database' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Persistent Database Management</h3>
            <p className="text-xs text-slate-500 mt-1">
              Create complete offline backup snapshots or restore an existing JSON export.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
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

            <div className="p-5 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
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

          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-rose-900 text-xs">Reset All Data to Demo Seeds</h4>
              <p className="text-[11px] text-rose-700 mt-0.5">Re-seed 10 teams, 20 players, and 15-week fixtures.</p>
            </div>
            <button
              onClick={() => {
                DatabaseEngine.resetDatabase();
                onToast('warning', 'Database Reset', 'Clean seed dataset loaded.');
                onReload();
              }}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition shadow-xs"
            >
              Reset Database
            </button>
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
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-blue-700">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700">{log.entityType} #{log.entityId}</td>
                    <td className="py-2.5 px-4 text-slate-900">{log.details}</td>
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
