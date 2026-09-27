import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CategoryIconBadge } from '../../components/ui/CategoryIconBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatMoney } from '../../lib/money';
import { formatTransactionDate } from '../../lib/dates';
import { Budget, Category, Transaction, Settings, BudgetMode } from '../../types';

export interface BudgetsViewProps {
  currentYear: number;
  currentMonth: number;
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  settings: Settings;
  onOpenAddBudget: () => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onUpdateBudgetMode: (mode: BudgetMode) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  currentYear,
  currentMonth,
  budgets,
  categories,
  transactions,
  settings,
  onOpenAddBudget,
  onEditBudget,
  onDeleteBudget,
  onUpdateBudgetMode,
}) => {
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [showVarianceReport, setShowVarianceReport] = useState(false);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  // Month bounds
  const monthStart = new Date(currentYear, currentMonth, 1).getTime();
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

  // Transactions for this month
  const monthTxs = transactions.filter((t) => t.date >= monthStart && t.date <= monthEnd);

  // Month income for envelope budgeting
  const monthIncomeMinor = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount_minor, 0);

  // Spending per category this month
  const categorySpending = new Map<string, number>();
  const categoryTxs = new Map<string, Transaction[]>();

  monthTxs.forEach((t) => {
    if (t.type === 'expense' && t.category_id) {
      const cur = categorySpending.get(t.category_id) || 0;
      categorySpending.set(t.category_id, cur + t.amount_minor);

      if (!categoryTxs.has(t.category_id)) {
        categoryTxs.set(t.category_id, []);
      }
      categoryTxs.get(t.category_id)!.push(t);
    }
  });

  // Total budgeted vs spent
  const totalBudgetedMinor = budgets.reduce((sum, b) => sum + b.amount_minor, 0);
  const totalSpentMinor = Array.from(categorySpending.values()).reduce((sum, val) => sum + val, 0);
  const overallPercent = totalBudgetedMinor > 0 ? Math.round((totalSpentMinor / totalBudgetedMinor) * 100) : 0;

  // Envelope mode calculation: Unallocated income = Month Income - Total Budgeted
  const unallocatedIncomeMinor = monthIncomeMinor - totalBudgetedMinor;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. TOP SUMMARY BAR */}
      <Card padding="lg" className="border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Monthly Budget Summary
              </h2>
              {/* Standard vs Envelope Mode Switch */}
              <button
                onClick={() =>
                  onUpdateBudgetMode(settings.budget_mode === 'standard' ? 'envelope' : 'standard')
                }
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 font-medium cursor-pointer"
                title="Toggle Standard vs Envelope Budgeting"
              >
                Mode: {settings.budget_mode === 'standard' ? 'Standard' : 'Zero-Based / Envelope'}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {settings.budget_mode === 'envelope'
                ? 'Assign every dollar of income to a category envelope.'
                : 'Spending limits tracked across categories.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVarianceReport(!showVarianceReport)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {showVarianceReport ? 'Hide Variance' : 'Budget vs Actual'}
            </button>
            <Button onClick={onOpenAddBudget} size="sm">
              <Plus size={15} className="mr-1" />
              Add Budget
            </Button>
          </div>
        </div>

        {/* Envelope Mode Banner */}
        {settings.budget_mode === 'envelope' && (
          <div
            className={`p-3 rounded-xl mb-4 text-xs flex items-center justify-between ${
              unallocatedIncomeMinor === 0
                ? 'bg-emerald-500/10 text-[#1F9D55] dark:text-[#3DD671]'
                : unallocatedIncomeMinor > 0
                ? 'bg-blue-500/10 text-[#2E5EAA] dark:text-[#5B8DEF]'
                : 'bg-red-500/10 text-[#D64545] dark:text-[#F0685E]'
            }`}
          >
            <span>
              {unallocatedIncomeMinor === 0
                ? 'All income is fully allocated (Zero-Based balanced!).'
                : unallocatedIncomeMinor > 0
                ? 'Unallocated income remaining to budget:'
                : 'Budget exceeds monthly income by:'}
            </span>
            <span className="font-mono font-bold text-sm">
              {formatMoney(Math.abs(unallocatedIncomeMinor), settings.base_currency)}
            </span>
          </div>
        )}

        {/* Overall progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              Total Spent:{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-mono">
                {formatMoney(totalSpentMinor, settings.base_currency)}
              </strong>
            </span>
            <span className="font-mono font-medium text-slate-500">
              Limit: {formatMoney(totalBudgetedMinor, settings.base_currency)} ({overallPercent}%)
            </span>
          </div>
          <ProgressBar progress={overallPercent} size="md" />
        </div>
      </Card>

      {/* 2. BUDGET VS ACTUAL VARIANCE REPORT (Collapsible) */}
      {showVarianceReport && (
        <Card padding="md" className="animate-in fade-in duration-200">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Budget vs Actual Variance Report
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Budgeted</th>
                  <th className="pb-2 text-right">Actual Spent</th>
                  <th className="pb-2 text-right">Variance ($)</th>
                  <th className="pb-2 text-right">Variance (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                {budgets.map((b) => {
                  const cat = categoryMap.get(b.category_id);
                  const spent = categorySpending.get(b.category_id) || 0;
                  const varianceMinor = b.amount_minor - spent;
                  const pct = b.amount_minor > 0 ? Math.round((spent / b.amount_minor) * 100) : 0;
                  const isOver = varianceMinor < 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-sans font-medium text-slate-900 dark:text-slate-100">
                        {cat?.name || 'Category'}
                      </td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                        {formatMoney(b.amount_minor, settings.base_currency)}
                      </td>
                      <td className="py-2.5 text-right text-slate-900 dark:text-slate-100 font-semibold">
                        {formatMoney(spent, settings.base_currency)}
                      </td>
                      <td
                        className={`py-2.5 text-right font-semibold ${
                          isOver ? 'text-[#D64545]' : 'text-[#1F9D55]'
                        }`}
                      >
                        {isOver ? '-' : '+'}
                        {formatMoney(Math.abs(varianceMinor), settings.base_currency)}
                      </td>
                      <td
                        className={`py-2.5 text-right font-semibold ${
                          isOver ? 'text-[#D64545]' : 'text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 3. CATEGORY BUDGET CARDS LIST */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 mb-3 px-1">
          Category Budgets ({budgets.length})
        </h3>

        {budgets.length === 0 ? (
          <EmptyState
            icon={PieChart}
            title="No budgets created"
            message="Create budgets for food, transportation, utilities, and shopping to keep your monthly spending on target."
            actionLabel="Create Budget"
            onAction={onOpenAddBudget}
          />
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => {
              const cat = categoryMap.get(b.category_id);
              const spentMinor = categorySpending.get(b.category_id) || 0;
              const remainingMinor = b.amount_minor - spentMinor;
              const percent = b.amount_minor > 0 ? Math.round((spentMinor / b.amount_minor) * 100) : 0;
              const isOver = remainingMinor < 0;
              const isExpanded = expandedCategoryId === b.category_id;
              const txs = categoryTxs.get(b.category_id) || [];

              return (
                <Card key={b.id} padding="md" className="overflow-hidden transition-all">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIconBadge
                        iconName={cat?.icon}
                        color={cat?.color || '#2E5EAA'}
                        size={38}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {cat?.name || 'Category'}
                          </h4>
                          {b.rollover && (
                            <span className="text-[10px] text-slate-400 font-mono">
                              (Rollover)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isOver ? (
                            <span className="text-[#D64545] font-semibold">
                              Over budget by {formatMoney(Math.abs(remainingMinor), settings.base_currency)}
                            </span>
                          ) : (
                            <span>
                              {formatMoney(remainingMinor, settings.base_currency)} remaining
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right side amount + actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatMoney(spentMinor, settings.base_currency)}
                        </span>
                        <span className="text-xs text-slate-400 block">
                          of {formatMoney(b.amount_minor, settings.base_currency)}
                        </span>
                      </div>

                      <button
                        onClick={() => setExpandedCategoryId(isExpanded ? null : b.category_id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="View transactions"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      <button
                        onClick={() => onEditBudget(b)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit budget"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => onDeleteBudget(b.id)}
                        className="p-1.5 text-slate-400 hover:text-[#D64545] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete budget"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <ProgressBar progress={percent} size="md" />
                  </div>

                  {/* Expanded Category Transactions */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <h5 className="text-xs font-semibold text-slate-500 mb-2">
                        Transactions this month ({txs.length})
                      </h5>
                      {txs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No transactions in this category for this month.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-44 overflow-y-auto">
                          {txs.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/60"
                            >
                              <div className="truncate mr-2">
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {t.note || 'Expense'}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-1.5">
                                  {formatTransactionDate(t.date)}
                                </span>
                              </div>
                              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                                {formatMoney(t.amount_minor, settings.base_currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
