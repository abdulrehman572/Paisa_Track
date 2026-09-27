import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Edit2,
  Trash2,
  Tv,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { CategoryIconBadge } from '../../components/ui/CategoryIconBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatMoney } from '../../lib/money';
import { formatDateShort, getDaysInMonth } from '../../lib/dates';
import { RecurringRule, Category, Account, Settings } from '../../types';

export interface BillsViewProps {
  currentYear: number;
  currentMonth: number;
  recurringRules: RecurringRule[];
  categories: Category[];
  accounts: Account[];
  settings: Settings;
  onOpenAddRecurring: () => void;
  onEditRecurring: (rule: RecurringRule) => void;
  onDeleteRecurring: (id: string) => void;
  onRunCatchUp: () => void;
}

export const BillsView: React.FC<BillsViewProps> = ({
  currentYear,
  currentMonth,
  recurringRules,
  categories,
  accounts,
  settings,
  onOpenAddRecurring,
  onEditRecurring,
  onDeleteRecurring,
  onRunCatchUp,
}) => {
  const [subView, setSubView] = useState<'calendar' | 'subscriptions'>('calendar');

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const now = Date.now();
  const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth);

  // Group recurring bills by timeline
  const activeRules = recurringRules.filter((r) => r.is_active);

  const dueIn3Days: RecurringRule[] = [];
  const dueThisWeek: RecurringRule[] = [];
  const dueLater: RecurringRule[] = [];

  activeRules.forEach((rule) => {
    const diffDays = Math.ceil((rule.next_run_at - now) / 86400000);
    if (diffDays <= 3 && diffDays >= 0) {
      dueIn3Days.push(rule);
    } else if (diffDays <= 7 && diffDays > 3) {
      dueThisWeek.push(rule);
    } else {
      dueLater.push(rule);
    }
  });

  // Calculate monthly subscription spend
  const subscriptions = activeRules.filter((r) => r.is_subscription);
  const totalSubMonthlyMinor = subscriptions.reduce((sum, r) => {
    if (r.frequency === 'yearly') return sum + Math.round(r.amount_minor / 12);
    if (r.frequency === 'weekly') return sum + r.amount_minor * 4;
    return sum + r.amount_minor;
  }, 0);

  // Map calendar days with bills
  const billDaysSet = new Set<number>();
  activeRules.forEach((r) => {
    const d = new Date(r.next_run_at);
    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      billDaysSet.add(d.getDate());
    }
  });

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header & Subscriptions Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            onClick={() => setSubView('calendar')}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              subView === 'calendar'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Due Bills Calendar ({activeRules.length})
          </button>
          <button
            onClick={() => setSubView('subscriptions')}
            className={`py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              subView === 'subscriptions'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRunCatchUp}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
            title="Check and process due recurring transactions"
          >
            <RefreshCw size={14} />
            <span className="hidden sm:inline">Sync Due</span>
          </button>
          <Button onClick={onOpenAddRecurring} size="sm">
            <Plus size={15} className="mr-1" />
            Add Bill
          </Button>
        </div>
      </div>

      {/* VIEW A: CALENDAR & TIMELINE */}
      {subView === 'calendar' && (
        <div className="space-y-6">
          {/* Mini Month Grid */}
          <Card padding="md">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Bill Due Dates This Month
            </h4>
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-slate-400 text-[10px] font-semibold pb-1">
                  {day}
                </div>
              ))}
              {Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1).map((d) => {
                const hasBill = billDaysSet.has(d);
                const isToday =
                  new Date().getDate() === d &&
                  new Date().getMonth() === currentMonth &&
                  new Date().getFullYear() === currentYear;

                return (
                  <div
                    key={d}
                    className={`h-9 flex flex-col items-center justify-center rounded-lg relative text-xs ${
                      isToday
                        ? 'bg-[#2E5EAA] text-white font-bold'
                        : hasBill
                        ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/20'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{d}</span>
                    {hasBill && !isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9B6BFF] absolute bottom-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Grouped Due Bills */}
          <div className="space-y-5">
            {/* Due in 3 days */}
            {dueIn3Days.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#D64545] dark:text-[#F0685E] mb-2 flex items-center gap-1.5">
                  <Clock size={14} />
                  Due in 3 Days ({dueIn3Days.length})
                </h4>
                <div className="space-y-2">
                  {dueIn3Days.map((r) => (
                    <BillCard
                      key={r.id}
                      rule={r}
                      category={categoryMap.get(r.category_id || '')}
                      account={accountMap.get(r.account_id)}
                      currency={settings.base_currency}
                      onEdit={() => onEditRecurring(r)}
                      onDelete={() => onDeleteRecurring(r.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Due this week */}
            {dueThisWeek.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#E0A526] dark:text-[#F0B94B] mb-2 flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  Due This Week ({dueThisWeek.length})
                </h4>
                <div className="space-y-2">
                  {dueThisWeek.map((r) => (
                    <BillCard
                      key={r.id}
                      rule={r}
                      category={categoryMap.get(r.category_id || '')}
                      account={accountMap.get(r.account_id)}
                      currency={settings.base_currency}
                      onEdit={() => onEditRecurring(r)}
                      onDelete={() => onDeleteRecurring(r.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Due later */}
            {dueLater.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Due Later ({dueLater.length})
                </h4>
                <div className="space-y-2">
                  {dueLater.map((r) => (
                    <BillCard
                      key={r.id}
                      rule={r}
                      category={categoryMap.get(r.category_id || '')}
                      account={accountMap.get(r.account_id)}
                      currency={settings.base_currency}
                      onEdit={() => onEditRecurring(r)}
                      onDelete={() => onDeleteRecurring(r.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeRules.length === 0 && (
              <EmptyState
                icon={CalendarDays}
                title="No recurring bills"
                message="Set up recurring rent, utilities, insurance, or salaries to automate monthly tracking."
                actionLabel="Add Recurring Bill"
                onAction={onOpenAddRecurring}
              />
            )}
          </div>
        </div>
      )}

      {/* VIEW B: SUBSCRIPTIONS */}
      {subView === 'subscriptions' && (
        <div className="space-y-4">
          {/* Subscription Total Card */}
          <Card padding="md" className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total Monthly Subscriptions</span>
              <MoneyText
                amountMinor={totalSubMonthlyMinor}
                currency={settings.base_currency}
                size="2xl"
              />
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-[#9B6BFF] flex items-center justify-center">
              <Tv size={22} />
            </div>
          </Card>

          {subscriptions.length === 0 ? (
            <EmptyState
              icon={Tv}
              title="No subscriptions tracked"
              message="Track Netflix, Spotify, gym memberships, and cloud storage to see total recurring costs and detect unused fees."
              actionLabel="Add Subscription"
              onAction={onOpenAddRecurring}
            />
          ) : (
            <div className="space-y-2.5">
              {subscriptions.map((r) => {
                const cat = categoryMap.get(r.category_id || '');
                const acc = accountMap.get(r.account_id);
                // Inactive alert simulation (60+ days without edit/interaction)
                const isPossiblyUnused = now - r.created_at > 60 * 86400000;

                return (
                  <Card key={r.id} padding="sm" className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIconBadge
                        iconName={cat?.icon}
                        color={cat?.color || '#9B6BFF'}
                        size={36}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {r.name}
                          </p>
                          {r.autopay && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-medium">
                              Autopay
                            </span>
                          )}
                          {isPossiblyUnused && (
                            <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                              <HelpCircle size={10} />
                              Unused 60d+?
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {acc?.name || 'Account'} · Renews {formatDateShort(r.next_run_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {formatMoney(r.amount_minor, settings.base_currency)}
                        </span>
                        <span className="text-[10px] text-slate-400 block capitalize">
                          /{r.frequency.replace('ly', '')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditRecurring(r)}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteRecurring(r.id)}
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
          )}
        </div>
      )}
    </div>
  );
};

interface BillCardProps {
  rule: RecurringRule;
  category?: Category;
  account?: Account;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}

const BillCard: React.FC<BillCardProps> = ({
  rule,
  category,
  account,
  currency,
  onEdit,
  onDelete,
}) => {
  return (
    <Card padding="sm" className="flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <CategoryIconBadge
          iconName={category?.icon}
          color={category?.color || '#2E5EAA'}
          size={36}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h5 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {rule.name}
            </h5>
            {rule.autopay && (
              <span className="text-[10px] text-[#1F9D55] font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded">
                Autopay
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Due {formatDateShort(rule.next_run_at)} · {account?.name || 'Account'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <MoneyText
          amountMinor={rule.amount_minor}
          currency={currency}
          type={rule.type === 'income' ? 'income' : 'expense'}
          size="sm"
          showSign={rule.type === 'income'}
        />
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="p-1 text-slate-400 hover:text-slate-600">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="p-1 text-slate-400 hover:text-[#D64545]">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
};
