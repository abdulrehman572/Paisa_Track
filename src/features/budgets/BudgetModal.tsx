import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parseMoneyToMinor, minorToMajor } from '../../lib/money';
import { CategoryIconBadge } from '../../components/ui/CategoryIconBadge';
import { Budget, Category, BudgetPeriodType, Settings } from '../../types';

export interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
  categories: Category[];
  settings: Settings;
  onSave: (budget: Budget) => void;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
  categories,
  settings,
  onSave,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [periodType, setPeriodType] = useState<BudgetPeriodType>('monthly');
  const [rollover, setRollover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (budgetToEdit) {
      setCategoryId(budgetToEdit.category_id);
      setAmountStr(minorToMajor(budgetToEdit.amount_minor, settings.base_currency).toString());
      setPeriodType(budgetToEdit.period_type);
      setRollover(budgetToEdit.rollover);
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setAmountStr('');
      setPeriodType('monthly');
      setRollover(false);
    }
    setError(null);
  }, [budgetToEdit, isOpen, expenseCategories, settings.base_currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    const amountMinor = parseMoneyToMinor(amountStr, settings.base_currency);
    if (amountMinor <= 0) {
      setError('Please enter a valid budget limit greater than 0.');
      return;
    }

    const budget: Budget = {
      id: budgetToEdit ? budgetToEdit.id : `bgt-${Date.now()}`,
      category_id: categoryId,
      amount_minor: amountMinor,
      period_type: periodType,
      period_start: 0,
      period_end: 0,
      rollover,
      mode: settings.budget_mode,
      created_at: budgetToEdit ? budgetToEdit.created_at : Date.now(),
      updated_at: Date.now(),
    };

    onSave(budget);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Edit Budget' : 'Set Category Budget'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Picker */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Category
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Budget Limit Amount */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Monthly Spending Limit
          </label>
          <input
            type="number"
            step="any"
            placeholder="e.g. 500.00"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Period */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Budget Period
          </label>
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as BudgetPeriodType)}
            className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-Weekly</option>
            <option value="per_paycheck">Per Paycheck</option>
          </select>
        </div>

        {/* Rollover Toggle */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="rollover-toggle"
            checked={rollover}
            onChange={(e) => setRollover(e.target.checked)}
            className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
          />
          <label
            htmlFor="rollover-toggle"
            className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            Rollover unused budget to next month
          </label>
        </div>

        {error && <p className="text-xs text-[#D64545] font-medium">{error}</p>}

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg">
            {budgetToEdit ? 'Save Budget' : 'Create Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
