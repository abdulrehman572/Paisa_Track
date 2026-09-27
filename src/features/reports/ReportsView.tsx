import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  Award,
  ShoppingBag,
  Zap,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { CategoryIconBadge } from '../../components/ui/CategoryIconBadge';
import { formatMoney } from '../../lib/money';
import { exportTransactionsToCSV } from '../../lib/csv';
import { Transaction, Category, Account, Settings } from '../../types';

export interface ReportsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  settings: Settings;
  onOpenPrintReport: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  categories,
  accounts,
  settings,
  onOpenPrintReport,
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'categories' | 'year'>('trends');
  const [trendRangeMonths, setTrendRangeMonths] = useState<number>(6);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const now = new Date();

  // --- 1. Compute Monthly Trend Data (Income vs Expense) ---
  const trendMonthsData: {
    year: number;
    month: number;
    label: string;
    incomeMinor: number;
    expenseMinor: number;
    savingsRate: number;
  }[] = [];

  for (let i = trendRangeMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const start = new Date(y, m, 1).getTime();
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999).getTime();

    const monthTxs = transactions.filter((t) => t.date >= start && t.date <= end);
    let inc = 0;
    let exp = 0;
    monthTxs.forEach((t) => {
      if (t.type === 'income') inc += t.amount_minor;
      else if (t.type === 'expense') exp += t.amount_minor;
    });

    const net = inc - exp;
    const rate = inc > 0 ? Math.max(0, Math.round((net / inc) * 100)) : 0;

    trendMonthsData.push({
      year: y,
      month: m,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      incomeMinor: inc,
      expenseMinor: exp,
      savingsRate: rate,
    });
  }

  const maxTrendMinor = Math.max(
    ...trendMonthsData.map((d) => Math.max(d.incomeMinor, d.expenseMinor)),
    100000
  );

  // --- 2. Compute Category Breakdown ---
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();

  const currentMonthTxs = transactions.filter(
    (t) => t.date >= currentMonthStart && t.date <= currentMonthEnd && t.type === 'expense'
  );

  const categoryTotals = new Map<string, number>();
  let totalExpenseThisMonthMinor = 0;

  currentMonthTxs.forEach((t) => {
    const catId = t.category_id || 'other';
    const cur = categoryTotals.get(catId) || 0;
    categoryTotals.set(catId, cur + t.amount_minor);
    totalExpenseThisMonthMinor += t.amount_minor;
  });

  const categoryBreakdownList: {
    id: string;
    name: string;
    color: string;
    icon: string;
    amountMinor: number;
    percent: number;
  }[] = [];

  categoryTotals.forEach((amt, catId) => {
    const cat = categoryMap.get(catId);
    const pct = totalExpenseThisMonthMinor > 0 ? Math.round((amt / totalExpenseThisMonthMinor) * 100) : 0;
    categoryBreakdownList.push({
      id: catId,
      name: cat?.name || 'Uncategorized',
      color: cat?.color || '#8B93A1',
      icon: cat?.icon || 'MoreHorizontal',
      amountMinor: amt,
      percent: pct,
    });
  });

  categoryBreakdownList.sort((a, b) => b.amountMinor - a.amountMinor);

  // --- 3. Dynamic Insight Generation ---
  // Compare this month vs previous month for top spending category
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

  const prevMonthExpenses = transactions.filter(
    (t) => t.date >= prevMonthStart && t.date <= prevMonthEnd && t.type === 'expense'
  );

  const prevCategoryTotals = new Map<string, number>();
  let prevTotalExpenseMinor = 0;
  prevMonthExpenses.forEach((t) => {
    const catId = t.category_id || 'other';
    prevCategoryTotals.set(catId, (prevCategoryTotals.get(catId) || 0) + t.amount_minor);
    prevTotalExpenseMinor += t.amount_minor;
  });

  const insights: string[] = [];

  if (categoryBreakdownList[0]) {
    const topCat = categoryBreakdownList[0];
    const prevCatAmount = prevCategoryTotals.get(topCat.id) || 0;
    if (prevCatAmount > 0) {
      const diffPct = Math.round(
        ((topCat.amountMinor - prevCatAmount) / prevCatAmount) * 100
      );
      if (diffPct > 0) {
        insights.push(
          `You spent ${diffPct}% more on ${topCat.name} this month compared to last month.`
        );
      } else if (diffPct < 0) {
        insights.push(
          `Great job! You reduced spending on ${topCat.name} by ${Math.abs(diffPct)}% compared to last month.`
        );
      }
    } else {
      insights.push(
        `${topCat.name} is your largest expense this month (${topCat.percent}% of total spending).`
      );
    }
  }

  const latestMonthData = trendMonthsData[trendMonthsData.length - 1];
  if (latestMonthData && latestMonthData.savingsRate > 20) {
    insights.push(
      `Your current month savings rate is healthy at ${latestMonthData.savingsRate}% of gross income.`
    );
  }

  // --- 4. Year in Review Statistics ---
  const currentYearStart = new Date(now.getFullYear(), 0, 1).getTime();
  const yearTxs = transactions.filter((t) => t.date >= currentYearStart);

  let yearIncomeMinor = 0;
  let yearExpenseMinor = 0;
  const yearCategorySpending = new Map<string, number>();

  yearTxs.forEach((t) => {
    if (t.type === 'income') {
      yearIncomeMinor += t.amount_minor;
    } else if (t.type === 'expense') {
      yearExpenseMinor += t.amount_minor;
      if (t.category_id) {
        yearCategorySpending.set(
          t.category_id,
          (yearCategorySpending.get(t.category_id) || 0) + t.amount_minor
        );
      }
    }
  });

  const expenseYearTxs = yearTxs.filter((t) => t.type === 'expense');
  const biggestPurchase: Transaction | null =
    expenseYearTxs.length > 0
      ? expenseYearTxs.reduce((prev, curr) => (curr.amount_minor > prev.amount_minor ? curr : prev))
      : null;

  let topYearCategoryId = '';
  let topYearCategoryAmt = 0;
  yearCategorySpending.forEach((amt, id) => {
    if (amt > topYearCategoryAmt) {
      topYearCategoryAmt = amt;
      topYearCategoryId = id;
    }
  });
  const topYearCategory = categoryMap.get(topYearCategoryId);
  const yearSavingsRate =
    yearIncomeMinor > 0 ? Math.round(((yearIncomeMinor - yearExpenseMinor) / yearIncomeMinor) * 100) : 0;

  // Handle CSV export download
  const handleDownloadCSV = () => {
    const catsObj: Record<string, string> = {};
    categories.forEach((c) => (catsObj[c.id] = c.name));
    const accsObj: Record<string, string> = {};
    accounts.forEach((a) => (accsObj[a.id] = a.name));

    const csvData = exportTransactionsToCSV(transactions, catsObj, accsObj, settings.base_currency);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paisatrack-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Controls & Export Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl max-w-sm">
          <button
            onClick={() => setActiveTab('trends')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'trends'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'categories'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('year')}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'year'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Year in Review
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
            title="Download CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <Button onClick={onOpenPrintReport} variant="secondary" size="sm">
            <Printer size={14} className="mr-1.5" />
            PDF Report
          </Button>
        </div>
      </div>

      {/* 1. TRENDS VIEW */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card padding="md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Income vs Expense Trends
                </h3>
                <p className="text-xs text-slate-400">Monthly cash flow and savings trajectory</p>
              </div>

              {/* Range Selector */}
              <div className="flex gap-1 text-xs">
                {[3, 6, 12].map((m) => (
                  <button
                    key={m}
                    onClick={() => setTrendRangeMonths(m)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      trendRangeMonths === m
                        ? 'bg-[#2E5EAA] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m}M
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Chart Container with horizontal scroll on small viewports */}
            <div className="overflow-x-auto pb-2">
              <div className="min-w-[440px] h-60 flex items-end justify-between gap-4 pt-4 px-2">
                {trendMonthsData.map((d, idx) => {
                  const incomeHeight = Math.max(
                    Math.round((d.incomeMinor / maxTrendMinor) * 180),
                    4
                  );
                  const expenseHeight = Math.max(
                    Math.round((d.expenseMinor / maxTrendMinor) * 180),
                    4
                  );

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-mono text-center mb-1 bg-slate-900 text-white px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
                        +{formatMoney(d.incomeMinor, settings.base_currency, { hideDecimalsIfWhole: true })}
                        <br />
                        -{formatMoney(d.expenseMinor, settings.base_currency, { hideDecimalsIfWhole: true })}
                      </div>

                      {/* Bar Pair */}
                      <div className="flex items-end gap-1.5 w-full justify-center">
                        {/* Income Bar */}
                        <div
                          className="w-3 sm:w-4 rounded-t-md bg-[#1F9D55] dark:bg-[#3DD671] transition-all duration-300"
                          style={{ height: `${incomeHeight}px` }}
                          title={`Income: ${formatMoney(d.incomeMinor, settings.base_currency)}`}
                        />
                        {/* Expense Bar */}
                        <div
                          className="w-3 sm:w-4 rounded-t-md bg-[#D64545] dark:bg-[#F0685E] transition-all duration-300"
                          style={{ height: `${expenseHeight}px` }}
                          title={`Expense: ${formatMoney(d.expenseMinor, settings.base_currency)}`}
                        />
                      </div>

                      {/* Month Label */}
                      <span className="text-[11px] font-medium text-slate-500 mt-2">
                        {d.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#1F9D55]" />
                <span className="text-slate-700 dark:text-slate-300">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#D64545]" />
                <span className="text-slate-700 dark:text-slate-300">Expense</span>
              </div>
            </div>
          </Card>

          {/* Dynamic Insight Sentences */}
          {insights.length > 0 && (
            <Card padding="md" className="border-l-4 border-l-[#2E5EAA] dark:border-l-[#5B8DEF]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2E5EAA]/10 text-[#2E5EAA] dark:text-[#5B8DEF] flex items-center justify-center shrink-0">
                  <Sparkles size={17} />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Smart Insights (Calculated from Real Data)
                  </h4>
                  {insights.map((ins, i) => (
                    <p key={i} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      • {ins}
                    </p>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* 2. CATEGORIES BREAKDOWN VIEW */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <Card padding="md">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Spending Breakdown by Category (This Month)
            </h3>

            {categoryBreakdownList.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">
                No expense transactions recorded this month.
              </p>
            ) : (
              <div className="space-y-3">
                {/* Horizontal Category Stack Bar */}
                <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  {categoryBreakdownList.map((cat) => (
                    <div
                      key={cat.id}
                      style={{
                        width: `${cat.percent}%`,
                        backgroundColor: cat.color,
                      }}
                      className="h-full transition-all duration-300"
                      title={`${cat.name}: ${cat.percent}%`}
                    />
                  ))}
                </div>

                {/* Category List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80 pt-2">
                  {categoryBreakdownList.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CategoryIconBadge
                          iconName={cat.icon}
                          color={cat.color}
                          size={32}
                        />
                        <div>
                          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {cat.name}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            {cat.percent}% of monthly budget
                          </p>
                        </div>
                      </div>

                      <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {formatMoney(cat.amountMinor, settings.base_currency)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* 3. YEAR IN REVIEW STORY LAYOUT */}
      {activeTab === 'year' && (
        <div className="space-y-4">
          <div className="px-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {now.getFullYear()} Financial Year in Review
            </h3>
            <p className="text-xs text-slate-500">
              Your overall annual milestones and spending habits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Total Spent */}
            <Card padding="lg" className="border-l-4 border-l-[#D64545]">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Total Expenses This Year
              </span>
              <div className="my-2">
                <MoneyText
                  amountMinor={yearExpenseMinor}
                  currency={settings.base_currency}
                  size="hero"
                  type="expense"
                />
              </div>
              <p className="text-xs text-slate-500">Across all categories and accounts</p>
            </Card>

            {/* 2. Savings Rate */}
            <Card padding="lg" className="border-l-4 border-l-[#1F9D55]">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Annual Savings Rate
              </span>
              <div className="my-2 font-mono text-3xl sm:text-4xl font-extrabold text-[#1F9D55] dark:text-[#3DD671]">
                {yearSavingsRate}%
              </div>
              <p className="text-xs text-slate-500">
                Net income retained:{' '}
                <strong className="font-mono font-semibold">
                  {formatMoney(yearIncomeMinor - yearExpenseMinor, settings.base_currency)}
                </strong>
              </p>
            </Card>

            {/* 3. Top Category */}
            <Card padding="lg" className="border-l-4 border-l-[#9B6BFF]">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Biggest Spending Category
              </span>
              <div className="my-2 flex items-center gap-2">
                {topYearCategory && (
                  <CategoryIconBadge
                    iconName={topYearCategory.icon}
                    color={topYearCategory.color}
                    size={36}
                  />
                )}
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {topYearCategory?.name || 'None'}
                  </h4>
                  <span className="text-sm font-mono text-slate-500 font-semibold">
                    {formatMoney(topYearCategoryAmt, settings.base_currency)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">Leading expense category this calendar year</p>
            </Card>

            {/* 4. Biggest Single Purchase */}
            <Card padding="lg" className="border-l-4 border-l-[#FF8A5B]">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Largest Single Expense
              </span>
              {biggestPurchase ? (
                <div className="my-2">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                    {biggestPurchase.note || 'Expense'}
                  </h4>
                  <span className="text-2xl font-mono font-bold text-[#D64545] dark:text-[#F0685E]">
                    {formatMoney(biggestPurchase.amount_minor, settings.base_currency)}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Recorded on {new Date(biggestPurchase.date).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-3">No expenses recorded yet</p>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
