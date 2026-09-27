import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parseMoneyToMinor, minorToMajor } from '../../lib/money';
import { Debt, Settings } from '../../types';

export interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: Debt | null;
  settings: Settings;
  onSave: (debt: Debt) => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  debtToEdit,
  settings,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [balanceStr, setBalanceStr] = useState('');
  const [aprPercentStr, setAprPercentStr] = useState('18.5');
  const [minPaymentStr, setMinPaymentStr] = useState('');
  const [dueDay, setDueDay] = useState(15);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (debtToEdit) {
      setName(debtToEdit.name);
      setBalanceStr(minorToMajor(debtToEdit.balance_minor, settings.base_currency).toString());
      setAprPercentStr((debtToEdit.apr_bps / 100).toString());
      setMinPaymentStr(minorToMajor(debtToEdit.min_payment_minor, settings.base_currency).toString());
      setDueDay(debtToEdit.due_day);
    } else {
      setName('');
      setBalanceStr('');
      setAprPercentStr('18.5');
      setMinPaymentStr('');
      setDueDay(15);
    }
    setError(null);
  }, [debtToEdit, isOpen, settings.base_currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this debt.');
      return;
    }

    const balanceMinor = parseMoneyToMinor(balanceStr, settings.base_currency);
    const minPaymentMinor = parseMoneyToMinor(minPaymentStr, settings.base_currency);
    const aprBps = Math.round(parseFloat(aprPercentStr) * 100);

    if (balanceMinor <= 0) {
      setError('Current balance must be greater than 0.');
      return;
    }
    if (minPaymentMinor <= 0) {
      setError('Minimum monthly payment must be greater than 0.');
      return;
    }

    const debt: Debt = {
      id: debtToEdit ? debtToEdit.id : `debt-${Date.now()}`,
      name: name.trim(),
      balance_minor: balanceMinor,
      apr_bps: aprBps,
      min_payment_minor: minPaymentMinor,
      due_day: dueDay,
      created_at: debtToEdit ? debtToEdit.created_at : Date.now(),
      updated_at: Date.now(),
    };

    onSave(debt);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={debtToEdit ? 'Edit Debt Record' : 'Add Debt Record'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Debt / Loan Name
          </label>
          <input
            type="text"
            placeholder="e.g. Visa Credit Card, Student Loan, Car Loan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Current Balance
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
              className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Interest Rate (APR %)
            </label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 19.99"
              value={aprPercentStr}
              onChange={(e) => setAprPercentStr(e.target.value)}
              className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Minimum Monthly Payment
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={minPaymentStr}
              onChange={(e) => setMinPaymentStr(e.target.value)}
              className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Monthly Due Day (1-31)
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
              className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-xs text-[#D64545] font-medium">{error}</p>}

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg">
            {debtToEdit ? 'Save Debt' : 'Add Debt to Plan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
