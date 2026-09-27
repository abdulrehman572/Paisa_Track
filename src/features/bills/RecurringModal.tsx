import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parseMoneyToMinor, minorToMajor } from '../../lib/money';
import { formatDateInput, parseDateInput } from '../../lib/dates';
import { RecurringRule, TransactionType, FrequencyType, Category, Account, Settings } from '../../types';

export interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: RecurringRule | null;
  categories: Category[];
  accounts: Account[];
  settings: Settings;
  onSave: (rule: RecurringRule) => void;
}

export const RecurringModal: React.FC<RecurringModalProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
  categories,
  accounts,
  settings,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [nextRunDateStr, setNextRunDateStr] = useState(formatDateInput(Date.now()));
  const [isSubscription, setIsSubscription] = useState(false);
  const [autopay, setAutopay] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ruleToEdit) {
      setName(ruleToEdit.name);
      setType(ruleToEdit.type);
      setAmountStr(minorToMajor(ruleToEdit.amount_minor, settings.base_currency).toString());
      setAccountId(ruleToEdit.account_id);
      setCategoryId(ruleToEdit.category_id || categories[0]?.id || '');
      setFrequency(ruleToEdit.frequency);
      setNextRunDateStr(formatDateInput(ruleToEdit.next_run_at));
      setIsSubscription(ruleToEdit.is_subscription);
      setAutopay(ruleToEdit.autopay);
    } else {
      setName('');
      setType('expense');
      setAmountStr('');
      setAccountId(accounts[0]?.id || '');
      setCategoryId(categories[0]?.id || '');
      setFrequency('monthly');
      setNextRunDateStr(formatDateInput(Date.now()));
      setIsSubscription(false);
      setAutopay(true);
    }
    setError(null);
  }, [ruleToEdit, isOpen, accounts, categories, settings.base_currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this bill or rule.');
      return;
    }

    const amountMinor = parseMoneyToMinor(amountStr, settings.base_currency);
    if (amountMinor <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }

    const rule: RecurringRule = {
      id: ruleToEdit ? ruleToEdit.id : `rec-${Date.now()}`,
      name: name.trim(),
      type,
      amount_minor: amountMinor,
      account_id: accountId,
      category_id: categoryId || null,
      note: `${name.trim()} (Recurring)`,
      frequency,
      interval: 1,
      next_run_at: parseDateInput(nextRunDateStr),
      is_active: true,
      is_subscription: isSubscription,
      autopay,
      reminder_days_before: 3,
      created_at: ruleToEdit ? ruleToEdit.created_at : Date.now(),
      updated_at: Date.now(),
    };

    onSave(rule);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ruleToEdit ? 'Edit Recurring Bill' : 'Schedule Recurring Bill'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
              type === 'expense'
                ? 'bg-[#D64545] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Recurring Expense
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg ${
              type === 'income'
                ? 'bg-[#1F9D55] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Recurring Income (Salary)
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Bill / Income Name
          </label>
          <input
            type="text"
            placeholder="e.g. Netflix, Rent, Payroll Salary"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Amount & Frequency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              step="any"
              placeholder="0.00"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FrequencyType)}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* Account & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Next Due Date */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Next Charge / Due Date
          </label>
          <input
            type="date"
            value={nextRunDateStr}
            onChange={(e) => setNextRunDateStr(e.target.value)}
            className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          />
        </div>

        {/* Checkboxes for Subscription & Autopay */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sub-check"
              checked={isSubscription}
              onChange={(e) => setIsSubscription(e.target.checked)}
              className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
            />
            <label
              htmlFor="sub-check"
              className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              This is a digital subscription (Netflix, Spotify, SaaS, etc.)
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autopay-check"
              checked={autopay}
              onChange={(e) => setAutopay(e.target.checked)}
              className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
            />
            <label
              htmlFor="autopay-check"
              className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Autopay enabled (automatically logged when due)
            </label>
          </div>
        </div>

        {error && <p className="text-xs text-[#D64545] font-medium">{error}</p>}

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg">
            {ruleToEdit ? 'Save Bill' : 'Schedule Bill'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
