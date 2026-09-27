import React, { useState } from 'react';
import {
  Shield,
  Coins,
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  Lock,
  Database,
  Info,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SUPPORTED_CURRENCIES } from '../../lib/money';
import { db } from '../../db/storage';
import { Settings, Category, Account } from '../../types';

export interface SettingsViewProps {
  settings: Settings;
  categories: Category[];
  accounts?: Account[];
  onUpdateSettings: (updates: Partial<Settings>) => void;
  onOpenCsvImport: () => void;
  onWipeData: () => void;
  onLockAppNow: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  categories,
  accounts,
  onUpdateSettings,
  onOpenCsvImport,
  onWipeData,
  onLockAppNow,
}) => {
  const [pinInput, setPinInput] = useState(settings.pin_code || '');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeConfirmText, setWipeConfirmText] = useState('');
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  // Backup download handler
  const handleExportBackup = () => {
    const jsonStr = db.generateBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paisatrack-full-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    onUpdateSettings({ last_backup_at: Date.now() });
    setBackupNotice('Backup exported successfully to your downloads!');
    setTimeout(() => setBackupNotice(null), 3000);
  };

  // Restore file handler
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = db.restoreFromJSON(content);
      if (success) {
        setBackupNotice('Database successfully restored from backup file!');
        setTimeout(() => setBackupNotice(null), 3500);
      } else {
        alert('Invalid backup file. Restoration failed.');
      }
    };
    reader.readAsText(file);
  };

  const handleSavePin = () => {
    if (pinInput.length !== 4) {
      alert('Please enter a 4-digit numeric PIN.');
      return;
    }
    onUpdateSettings({ pin_enabled: true, pin_code: pinInput });
    setShowPinModal(false);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-2xl mx-auto">
      {backupNotice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-[#1F9D55] dark:text-[#3DD671] rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{backupNotice}</span>
        </div>
      )}

      {/* 1. CURRENCY & LOCALE */}
      <Card padding="md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Coins size={15} />
          Currency & Regional
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                Base Currency
              </span>
              <span className="text-[11px] text-slate-400">
                Primary currency used for net worth and reports
              </span>
            </div>
            <select
              value={settings.base_currency}
              onChange={(e) => onUpdateSettings({ base_currency: e.target.value })}
              className="h-9 px-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c} value={c}>
                  {c} ({SUPPORTED_CURRENCIES[c].symbol}) - {SUPPORTED_CURRENCIES[c].name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Apply Base Currency to all Accounts */}
          {accounts && accounts.length > 0 && accounts.some((a) => a.currency !== settings.base_currency) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Synchronize Accounts
                </span>
                <span className="text-[11px] text-slate-400">
                  Update all existing accounts to {settings.base_currency} ({SUPPORTED_CURRENCIES[settings.base_currency]?.symbol})
                </span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  accounts.forEach((acc) => {
                    db.saveAccount({ ...acc, currency: settings.base_currency });
                  });
                  setBackupNotice(`All accounts updated to ${settings.base_currency}!`);
                  setTimeout(() => setBackupNotice(null), 3000);
                }}
              >
                Apply to Accounts
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 2. SECURITY & PRIVACY */}
      <Card padding="md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Shield size={15} />
          Security & App Lock
        </h3>

        <div className="space-y-3">
          {/* PIN Lock */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                4-Digit PIN Lock
              </span>
              <span className="text-[11px] text-slate-400">
                Require PIN when opening PaisaTrack
              </span>
            </div>
            <div className="flex items-center gap-2">
              {settings.pin_enabled ? (
                <>
                  <button
                    onClick={() => setShowPinModal(true)}
                    className="text-xs text-[#2E5EAA] dark:text-[#5B8DEF] font-medium hover:underline"
                  >
                    Change PIN
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ pin_enabled: false })}
                    className="text-xs text-rose-500 font-medium hover:underline"
                  >
                    Disable
                  </button>
                </>
              ) : (
                <Button onClick={() => setShowPinModal(true)} size="sm">
                  Enable PIN
                </Button>
              )}
            </div>
          </div>

          {/* Biometric simulation */}
          {settings.pin_enabled && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Fingerprint size={16} className="text-slate-500" />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                    Biometric Unlock
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Use Face ID / Touch ID quick unlock
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.biometric_enabled}
                onChange={(e) => onUpdateSettings({ biometric_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
              />
            </div>
          )}

          {/* Privacy Blur */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                App Switcher Privacy Blur
              </span>
              <span className="text-[11px] text-slate-400">
                Blur balances when switching apps or browser tabs
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.show_privacy_blur}
              onChange={(e) => onUpdateSettings({ show_privacy_blur: e.target.checked })}
              className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
            />
          </div>

          {/* Auto Lock Timeout */}
          {settings.pin_enabled && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                  Auto-Lock Timeout
                </span>
                <span className="text-[11px] text-slate-400">
                  Lock app when inactive or in background
                </span>
              </div>
              <select
                value={settings.auto_lock_seconds}
                onChange={(e) =>
                  onUpdateSettings({ auto_lock_seconds: parseInt(e.target.value) || 0 })
                }
                className="h-9 px-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              >
                <option value="0">Immediately</option>
                <option value="60">1 Minute</option>
                <option value="300">5 Minutes</option>
                <option value="-1">Never</option>
              </select>
            </div>
          )}

          {settings.pin_enabled && (
            <div className="pt-2">
              <Button onClick={onLockAppNow} variant="outline" size="sm" fullWidth>
                <Lock size={14} className="mr-1.5" />
                Lock App Now
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 3. DATA MANAGEMENT & BACKUP */}
      <Card padding="md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Database size={15} />
          Data & Local Backup
        </h3>

        <div className="space-y-3">
          {/* CSV Import */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                Import CSV File
              </span>
              <span className="text-[11px] text-slate-400">
                Import bank statements with column mapping
              </span>
            </div>
            <Button onClick={onOpenCsvImport} variant="secondary" size="sm">
              <FileSpreadsheet size={14} className="mr-1.5" />
              Import CSV
            </Button>
          </div>

          {/* Full JSON Backup Export */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                Export Full Backup (JSON)
              </span>
              <span className="text-[11px] text-slate-400">
                Complete database backup containing accounts, budgets & transactions
              </span>
            </div>
            <Button onClick={handleExportBackup} variant="secondary" size="sm">
              <Download size={14} className="mr-1.5" />
              Export
            </Button>
          </div>

          {/* Restore JSON Backup */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
                Restore Database from JSON
              </span>
              <span className="text-[11px] text-slate-400">
                Restore all data from a previously exported backup file
              </span>
            </div>
            <label className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer">
              <Upload size={14} />
              Restore
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Wipe All Data */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowWipeConfirm(true)}
              className="text-xs text-[#D64545] font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <Trash2 size={14} />
              Delete All Data & Reset Application
            </button>
          </div>
        </div>
      </Card>

      {/* 4. ABOUT & PRIVACY */}
      <Card padding="md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
          <Info size={15} />
          About PaisaTrack
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          PaisaTrack is designed from the ground up to be <strong>100% local-first and private</strong>.
          There are no analytics, no external tracking, no backend database servers, and no AI Studio API keys required.
          All your balances, transaction receipts, budgets, and debts reside exclusively in your device storage.
        </p>
        <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Version 1.0.0 (Offline Build)</span>
          <span>Zero Server Footprint</span>
        </div>
      </Card>

      {/* PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 max-w-xs w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-center">
              Set 4-Digit Security PIN
            </h4>
            <input
              type="password"
              maxLength={4}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              className="w-full h-12 text-center text-2xl font-mono tracking-widest bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setShowPinModal(false)}
              >
                Cancel
              </Button>
              <Button size="sm" fullWidth onClick={handleSavePin}>
                Save PIN
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe Confirmation Dialog */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-[#D64545] flex items-center justify-center mx-auto">
              <AlertTriangle size={20} />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 text-center">
              Erase All Data?
            </h4>
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              This action is permanent and irreversible. All accounts, transactions, goals, and recurring rules will be completely wiped from this device.
            </p>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 text-center">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                className="w-full h-10 px-3 font-mono text-center text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => setShowWipeConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                fullWidth
                disabled={wipeConfirmText !== 'DELETE'}
                onClick={() => {
                  setShowWipeConfirm(false);
                  onWipeData();
                }}
              >
                Erase Everything
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
