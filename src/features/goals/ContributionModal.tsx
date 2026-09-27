import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parseMoneyToMinor, formatMoney } from '../../lib/money';
import { Goal, Account, Settings, GoalContribution, Transaction } from '../../types';

export interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  accounts: Account[];
  settings: Settings;
  onSaveContribution: (contrib: GoalContribution, tx?: Transaction) => void;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  isOpen,
  onClose,
  goal,
  accounts,
  settings,
  onSaveContribution,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [deductFromAccount, setDeductFromAccount] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (!goal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountMinor = parseMoneyToMinor(amountStr, settings.base_currency);
    if (amountMinor <= 0) {
      setError('Please enter a contribution amount greater than 0.');
      return;
    }

    const contributionId = `contrib-${Date.now()}`;
    let tx: Transaction | undefined = undefined;

    if (deductFromAccount && sourceAccountId) {
      tx = {
        id: `tx-contrib-${Date.now()}`,
        type: 'expense',
        amount_minor: amountMinor,
        currency: settings.base_currency,
        account_id: sourceAccountId,
        category_id: null,
        note: `Contribution towards goal: ${goal.name}`,
        date: Date.now(),
        is_reconciled: true,
        tags: ['savings', 'goal'],
        created_at: Date.now(),
        updated_at: Date.now(),
      };
    }

    const contrib: GoalContribution = {
      id: contributionId,
      goal_id: goal.id,
      amount_minor: amountMinor,
      date: Date.now(),
      transaction_id: tx?.id || null,
      note: note.trim() || undefined,
      created_at: Date.now(),
    };

    onSaveContribution(contrib, tx);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Contribution to "${goal.name}"`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Contribution Amount
          </label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full h-11 px-3.5 font-mono text-base font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Deduct from account option */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deduct-acc"
              checked={deductFromAccount}
              onChange={(e) => setDeductFromAccount(e.target.checked)}
              className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
            />
            <label
              htmlFor="deduct-acc"
              className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Deduct from an account balance
            </label>
          </div>

          {deductFromAccount && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Source Account
              </label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Monthly transfer, bonus money"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {error && <p className="text-xs text-[#D64545] font-medium">{error}</p>}

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg">
            Record Contribution
          </Button>
        </div>
      </form>
    </Modal>
  );
};
