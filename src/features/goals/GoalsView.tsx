import React, { useState } from 'react';
import {
  Target,
  Plus,
  ShieldAlert,
  Flame,
  Snowflake,
  TrendingDown,
  Calendar,
  DollarSign,
  ArrowRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { MoneyText } from '../../components/ui/MoneyText';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatMoney } from '../../lib/money';
import { formatDateShort } from '../../lib/dates';
import { calculateDebtPayoff } from '../../lib/debtMath';
import { Goal, Debt, Transaction, Settings, Account } from '../../types';

export interface GoalsViewProps {
  goals: Goal[];
  debts: Debt[];
  transactions: Transaction[];
  accounts: Account[];
  settings: Settings;
  onOpenAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onOpenContribution: (goal: Goal) => void;
  onOpenAddDebt: () => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  debts,
  transactions,
  accounts,
  settings,
  onOpenAddGoal,
  onEditGoal,
  onDeleteGoal,
  onOpenContribution,
  onOpenAddDebt,
  onEditDebt,
  onDeleteDebt,
}) => {
  const [activeTab, setActiveTab] = useState<'goals' | 'debts'>('goals');
  const [debtStrategy, setDebtStrategy] = useState<'snowball' | 'avalanche'>('avalanche');
  const [extraPaymentStr, setExtraPaymentStr] = useState('100');

  // Compute trailing 3-month average monthly spend for Emergency Fund coverage
  const now = Date.now();
  const ninetyDaysAgo = now - 90 * 86400000;
  const recentExpensesMinor = transactions
    .filter((t) => t.type === 'expense' && t.date >= ninetyDaysAgo)
    .reduce((sum, t) => sum + t.amount_minor, 0);
  const avgMonthlyExpenseMinor = Math.max(recentExpensesMinor / 3, 100000); // Minimum fallback $1000

  // Debt payoff calculation
  const extraPaymentMinor = (parseFloat(extraPaymentStr) || 0) * 100;
  const snowballResult = calculateDebtPayoff(debts, 'snowball', extraPaymentMinor);
  const avalancheResult = calculateDebtPayoff(debts, 'avalanche', extraPaymentMinor);
  const currentPayoffResult = debtStrategy === 'snowball' ? snowballResult : avalancheResult;

  const totalDebtBalanceMinor = debts.reduce((sum, d) => sum + d.balance_minor, 0);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Segmented Tab: Savings Goals vs Debt Payoff */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab('goals')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'goals'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Savings Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'debts'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Debt Payoff Planner ({debts.length})
        </button>
      </div>

      {/* TAB 1: SAVINGS GOALS */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                Active Savings Targets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track progress towards emergency reserves, major purchases, and vacations.
              </p>
            </div>
            <Button onClick={onOpenAddGoal} size="sm">
              <Plus size={15} className="mr-1" />
              Add Goal
            </Button>
          </div>

          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No goals set up yet"
              message="Create a savings goal to start building your emergency fund or saving for your dream travel."
              actionLabel="Create First Goal"
              onAction={onOpenAddGoal}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {goals.map((g) => {
                const percent = Math.min(
                  Math.round((g.saved_minor / (g.target_minor || 1)) * 100),
                  100
                );
                const isEmergency = g.type === 'emergency_fund';
                const monthsCovered = isEmergency
                  ? (g.saved_minor / avgMonthlyExpenseMinor).toFixed(1)
                  : null;

                const daysRemaining = g.deadline
                  ? Math.max(0, Math.ceil((g.deadline - Date.now()) / 86400000))
                  : null;

                return (
                  <Card key={g.id} padding="md" className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <CircularProgress
                            progress={percent}
                            size={56}
                            strokeWidth={5}
                            color={g.color || '#10B981'}
                          >
                            <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
                              {percent}%
                            </span>
                          </CircularProgress>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {g.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                              {g.type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onEditGoal(g)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Edit goal"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteGoal(g.id)}
                            className="p-1 text-slate-400 hover:text-[#D64545]"
                            title="Delete goal"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="space-y-1 mb-3">
                        <div className="flex items-baseline justify-between text-xs font-mono">
                          <span className="text-slate-500">Saved:</span>
                          <span className="text-sm font-bold text-[#1F9D55] dark:text-[#3DD671]">
                            {formatMoney(g.saved_minor, settings.base_currency)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-xs font-mono">
                          <span className="text-slate-500">Target:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatMoney(g.target_minor, settings.base_currency)}
                          </span>
                        </div>
                      </div>

                      {/* Emergency Fund Insight Badge */}
                      {isEmergency && monthsCovered && (
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-[11px] text-[#1F9D55] dark:text-[#3DD671] font-medium mb-3 flex items-center gap-1.5">
                          <ShieldAlert size={14} />
                          <span>Covers ~{monthsCovered} months of living expenses</span>
                        </div>
                      )}

                      {/* Deadline Countdown */}
                      {daysRemaining !== null && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mb-3">
                          <Calendar size={12} />
                          <span>
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Deadline passed'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Add Contribution Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Button
                        onClick={() => onOpenContribution(g)}
                        variant="secondary"
                        size="sm"
                        fullWidth
                      >
                        + Add Contribution
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEBT PAYOFF PLANNER */}
      {activeTab === 'debts' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                Debt Snowball vs Avalanche Calculator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Compare paying smallest balance first (Snowball) vs highest interest first (Avalanche).
              </p>
            </div>
            <Button onClick={onOpenAddDebt} size="sm">
              <Plus size={15} className="mr-1" />
              Add Debt
            </Button>
          </div>

          {debts.length === 0 ? (
            <EmptyState
              icon={TrendingDown}
              title="No debts listed"
              message="Add credit card balances, personal loans, or student loans to generate an accelerated payoff strategy."
              actionLabel="Add First Debt"
              onAction={onOpenAddDebt}
            />
          ) : (
            <>
              {/* Comparison Hero Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Avalanche Card */}
                <Card
                  padding="md"
                  className={`border-2 transition-all cursor-pointer ${
                    debtStrategy === 'avalanche'
                      ? 'border-[#2E5EAA] dark:border-[#5B8DEF] bg-[#2E5EAA]/5 dark:bg-[#5B8DEF]/5'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => setDebtStrategy('avalanche')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#2E5EAA] dark:text-[#5B8DEF]">
                      <Flame size={15} />
                      Avalanche Strategy (Mathematically Optimal)
                    </span>
                    {debtStrategy === 'avalanche' && (
                      <span className="text-[10px] bg-[#2E5EAA] text-white px-2 py-0.5 rounded font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Focus extra cash on highest APR first. Saves maximum interest money.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Time to Debt-Free</span>
                      <strong className="text-sm text-slate-900 dark:text-slate-100">
                        {avalancheResult.totalMonths} months
                      </strong>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Total Interest</span>
                      <strong className="text-sm text-[#D64545]">
                        {formatMoney(avalancheResult.totalInterestMinor, settings.base_currency)}
                      </strong>
                    </div>
                  </div>
                </Card>

                {/* Snowball Card */}
                <Card
                  padding="md"
                  className={`border-2 transition-all cursor-pointer ${
                    debtStrategy === 'snowball'
                      ? 'border-[#2E5EAA] dark:border-[#5B8DEF] bg-[#2E5EAA]/5 dark:bg-[#5B8DEF]/5'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                  onClick={() => setDebtStrategy('snowball')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4EA8DE]">
                      <Snowflake size={15} />
                      Snowball Strategy (Psychological Momentum)
                    </span>
                    {debtStrategy === 'snowball' && (
                      <span className="text-[10px] bg-[#2E5EAA] text-white px-2 py-0.5 rounded font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Focus extra cash on smallest balance first. Delivers rapid quick wins.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Time to Debt-Free</span>
                      <strong className="text-sm text-slate-900 dark:text-slate-100">
                        {snowballResult.totalMonths} months
                      </strong>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg">
                      <span className="text-slate-400 block text-[10px]">Total Interest</span>
                      <strong className="text-sm text-[#D64545]">
                        {formatMoney(snowballResult.totalInterestMinor, settings.base_currency)}
                      </strong>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Extra Monthly Payment Slider / Input */}
              <Card padding="md" className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                    Extra Monthly Cash Available
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Additional monthly payment put towards priority debt
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">$</span>
                  <input
                    type="number"
                    value={extraPaymentStr}
                    onChange={(e) => setExtraPaymentStr(e.target.value)}
                    className="w-24 h-9 px-2 text-xs font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg"
                  />
                  <span className="text-xs text-slate-500">/ mo</span>
                </div>
              </Card>

              {/* Debt list & Payoff sequence */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-1">
                  Payoff Sequence ({debtStrategy.toUpperCase()})
                </h4>
                <div className="space-y-2.5">
                  {currentPayoffResult.payoffOrder.map((order, idx) => {
                    const original = debts.find((d) => d.id === order.debtId);
                    if (!original) return null;

                    return (
                      <Card
                        key={original.id}
                        padding="sm"
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {original.name}
                            </p>
                            <p className="text-[11px] text-slate-500 font-mono">
                              APR: {(original.apr_bps / 100).toFixed(2)}% · Min: {formatMoney(original.min_payment_minor, settings.base_currency)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right font-mono">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                              {formatMoney(original.balance_minor, settings.base_currency)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              Cleared in ~{order.monthsToPayoff} mos
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onEditDebt(original)}
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => onDeleteDebt(original.id)}
                              className="p-1 text-slate-400 hover:text-[#D64545]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
