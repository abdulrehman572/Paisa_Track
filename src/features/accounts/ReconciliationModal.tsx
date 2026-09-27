import React, { useState } from 'react';
import { Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { parseMoneyToMinor, formatMoney } from '../../lib/money';
import { db } from '../../db/storage';
import { Account, Settings } from '../../types';

export interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  settings: Settings;
  onReconciled: () => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({
  isOpen,
  onClose,
  account,
  settings,
  onReconciled,
}) => {
  const [statementBalanceStr, setStatementBalanceStr] = useState('');
  const [statementDate, setStatementDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reconciledSuccess, setReconciledSuccess] = useState(false);

  if (!account) return null;

  const computedBalanceMinor = db.getAccountBalance(account.id);
  const enteredStatementMinor = parseMoneyToMinor(
    statementBalanceStr,
    account.currency || settings.base_currency
  );
  const deltaMinor = enteredStatementMinor - computedBalanceMinor;
  const isMatch = Math.abs(deltaMinor) === 0 && statementBalanceStr !== '';

  const handleMarkReconciled = () => {
    // Mark unreconciled transactions for this account up to statement date as reconciled
    const txs = db.getTransactions({ accountId: account.id });
    txs.forEach((t) => {
      if (!t.is_reconciled) {
        db.updateTransaction({ ...t, is_reconciled: true });
      }
    });

    setReconciledSuccess(true);
    setTimeout(() => {
      setReconciledSuccess(false);
      onReconciled();
      onClose();
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reconcile ${account.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Compare your bank or credit card statement with PaisaTrack to verify all transactions match.
        </p>

        {/* Current Computed Balance */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">PaisaTrack Computed Balance</span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
              {formatMoney(computedBalanceMinor, account.currency || settings.base_currency)}
            </span>
          </div>
          <Scale size={20} className="text-slate-400" />
        </div>

        {/* Statement Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bank Statement Balance
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={statementBalanceStr}
              onChange={(e) => setStatementBalanceStr(e.target.value)}
              className="w-full h-11 px-3.5 font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Statement Date
            </label>
            <input
              type="date"
              value={statementDate}
              onChange={(e) => setStatementDate(e.target.value)}
              className="w-full h-11 px-3 font-mono bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {/* Variance Display */}
        {statementBalanceStr !== '' && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm ${
              isMatch
                ? 'bg-emerald-500/10 border-emerald-500/20 text-[#1F9D55] dark:text-[#3DD671]'
                : 'bg-amber-500/10 border-amber-500/20 text-[#E0A526] dark:text-[#F0B94B]'
            }`}
          >
            <div className="flex items-center gap-2">
              {isMatch ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span className="font-semibold">
                {isMatch ? 'Balances match perfectly!' : 'Discrepancy detected:'}
              </span>
            </div>
            <span className="font-mono font-bold">
              {formatMoney(deltaMinor, account.currency || settings.base_currency, {
                showSign: true,
              })}
            </span>
          </div>
        )}

        {/* Success alert */}
        {reconciledSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-[#1F9D55] border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-center font-medium">
            Account marked as reconciled!
          </div>
        )}

        {/* Confirm reconcile */}
        <div className="pt-2">
          <Button
            onClick={handleMarkReconciled}
            fullWidth
            size="lg"
            disabled={reconciledSuccess || statementBalanceStr === ''}
          >
            Mark Account Reconciled
          </Button>
        </div>
      </div>
    </Modal>
  );
};
