import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, ChevronRight, Plus, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { MoneyText } from '../../components/ui/MoneyText';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { CategoryIconBadge } from '../../components/ui/CategoryIconBadge';
import { formatTransactionDate } from '../../lib/dates';
import { formatMoney } from '../../lib/money';
import { Transaction, Budget, Category, Account, Settings } from '../../types';

export interface DashboardViewProps {
  currentYear: number;
  currentMonth: number;
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  accounts: Account[];
  settings: Settings;
  onNavigateToTransactions: () => void;
  onNavigateToBudgets: () => void;
  onNavigateToAccounts: () => void;
  onOpenAddTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  netWorth: { assetsMinor: number; liabilitiesMinor: number; netWorthMinor: number };
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentYear,
  currentMonth,
  transactions,
  budgets,
  categories,
  accounts,
  settings,
  onNavigateToTransactions,
  onNavigateToBudgets,
  onNavigateToAccounts,
  onOpenAddTransaction,
  onSelectTransaction,
  netWorth,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Month bounds
  const monthStart = new Date(currentYear, currentMonth, 1).getTime();
  const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999).getTime();

  // Transactions strictly in current month
  const monthTransactions = transactions.filter(
    (t) => t.date >= monthStart && t.date <= monthEnd
  );

  let monthIncomeMinor = 0;
  let monthExpenseMinor = 0;

  monthTransactions.forEach((t) => {
    if (t.type === 'income') {
      monthIncomeMinor += t.amount_minor;
    } else if (t.type === 'expense') {
      monthExpenseMinor += t.amount_minor;
    }
  });

  const netMonthCashflowMinor = monthIncomeMinor - monthExpenseMinor;

  // Recent 5 transactions overall
  const recentTransactions = transactions.slice(0, 5);

  // Compute category spending for budgets this month
  const categorySpending = new Map<string, number>();
  monthTransactions.forEach((t) => {
    if (t.type === 'expense' && t.category_id) {
      const cur = categorySpending.get(t.category_id) || 0;
      categorySpending.set(t.category_id, cur + t.amount_minor);
    }
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. HERO NET WORTH CARD */}
      <Card
        padding="lg"
        className="relative overflow-hidden bg-gradient-to-br from-[#2E5EAA] to-[#1E3F73] text-white border-0 shadow-md"
      >
        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-white/80">
              Total Net Worth
            </span>
            <button
              onClick={onNavigateToAccounts}
              className="text-xs font-medium text-white/90 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <span>{accounts.length} Accounts</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 my-2">
            <span className="font-mono tabular-nums text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatMoney(netWorth.netWorthMinor, settings.base_currency)}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${
                netMonthCashflowMinor >= 0
                  ? 'bg-[#1F9D55]/30 text-emerald-200'
                  : 'bg-[#D64545]/30 text-rose-200'
              }`}
            >
              {netMonthCashflowMinor >= 0 ? '+' : ''}
              {formatMoney(netMonthCashflowMinor, settings.base_currency)} this month
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
            <div>
              <span>Assets: </span>
              <span className="font-mono font-semibold text-white">
                {formatMoney(netWorth.assetsMinor, settings.base_currency)}
              </span>
            </div>
            <div>
              <span>Liabilities: </span>
              <span className="font-mono font-semibold text-white">
                {formatMoney(netWorth.liabilitiesMinor, settings.base_currency)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. STAT CARDS: INCOME & EXPENSE */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Income Card */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Income
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#1F9D55]/15 text-[#1F9D55] dark:text-[#3DD671] flex items-center justify-center">
              <ArrowDownLeft size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <MoneyText
              amountMinor={monthIncomeMinor}
              currency={settings.base_currency}
              type="income"
              size="2xl"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">This month</p>
          </div>
        </Card>

        {/* Expense Card */}
        <Card padding="md" className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Expenses
            </span>
            <div className="w-7 h-7 rounded-lg bg-[#D64545]/15 text-[#D64545] dark:text-[#F0685E] flex items-center justify-center">
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <MoneyText
              amountMinor={monthExpenseMinor}
              currency={settings.base_currency}
              type="expense"
              size="2xl"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">This month</p>
          </div>
        </Card>
      </div>

      {/* 3. BUDGET SNAPSHOT STRIP */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
            Monthly Budget Snapshot
          </h2>
          <button
            onClick={onNavigateToBudgets}
            className="text-xs font-medium text-[#2E5EAA] dark:text-[#5B8DEF] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            Manage
            <ChevronRight size={14} />
          </button>
        </div>

        {budgets.length === 0 ? (
          <Card padding="sm" className="text-center py-4 text-xs text-slate-500">
            No budgets configured yet.{' '}
            <button
              onClick={onNavigateToBudgets}
              className="text-[#2E5EAA] dark:text-[#5B8DEF] font-medium underline ml-1 cursor-pointer"
            >
              Create your first budget
            </button>
          </Card>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
            {budgets.slice(0, 5).map((b) => {
              const cat = categoryMap.get(b.category_id);
              const spentMinor = categorySpending.get(b.category_id) || 0;
              const percent = Math.round((spentMinor / (b.amount_minor || 1)) * 100);
              const isOver = spentMinor > b.amount_minor;

              return (
                <Card
                  key={b.id}
                  padding="sm"
                  className="min-w-[210px] sm:min-w-[240px] shrink-0 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CategoryIconBadge
                      iconName={cat?.icon}
                      color={cat?.color || '#2E5EAA'}
                      size={28}
                    />
                    <div className="truncate flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cat?.name || 'Category'}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {percent}% of limit
                      </p>
                    </div>
                  </div>

                  <ProgressBar progress={percent} size="sm" className="my-1.5" />

                  <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                    <span
                      className={
                        isOver
                          ? 'text-[#D64545] font-semibold'
                          : 'text-slate-700 dark:text-slate-300'
                      }
                    >
                      {formatMoney(spentMinor, settings.base_currency, { hideDecimalsIfWhole: true })}
                    </span>
                    <span className="text-slate-400">
                      / {formatMoney(b.amount_minor, settings.base_currency, { hideDecimalsIfWhole: true })}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. RECENT TRANSACTIONS */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
            Recent Activity
          </h2>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs font-medium text-[#2E5EAA] dark:text-[#5B8DEF] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            See all
            <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <Card padding="lg" className="text-center py-8">
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3">
              No transactions recorded yet.
            </p>
            <button
              onClick={onOpenAddTransaction}
              className="px-3.5 py-1.5 bg-[#2E5EAA] dark:bg-[#5B8DEF] text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer"
            >
              Add First Transaction
            </button>
          </Card>
        ) : (
          <Card padding="none" className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentTransactions.map((tx) => {
              const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
              const acc = accountMap.get(tx.account_id);

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIconBadge
                      iconName={tx.type === 'transfer' ? 'ArrowLeftRight' : cat?.icon}
                      color={tx.type === 'transfer' ? '#2E5EAA' : cat?.color}
                      size={36}
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tx.note || cat?.name || (tx.type === 'transfer' ? 'Transfer' : 'Transaction')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {acc?.name || 'Account'} · {formatTransactionDate(tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <MoneyText
                      amountMinor={tx.amount_minor}
                      currency={tx.currency || settings.base_currency}
                      type={tx.type === 'transfer' ? 'neutral' : tx.type}
                      size="sm"
                      showSign={tx.type === 'income'}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
};
