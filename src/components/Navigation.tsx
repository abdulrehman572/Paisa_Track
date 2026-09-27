import React, { useState } from 'react';
import {
  Home,
  Receipt,
  Plus,
  PieChart,
  BarChart3,
  Landmark,
  Target,
  CalendarDays,
  Settings as SettingsIcon,
  MoreHorizontal,
  X,
  Wallet,
} from 'lucide-react';

export type TabId =
  | 'home'
  | 'transactions'
  | 'budgets'
  | 'reports'
  | 'accounts'
  | 'goals'
  | 'bills'
  | 'settings';

export interface NavigationProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenAddTransaction: () => void;
  totalNetWorthMinor: number;
  currency: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddTransaction,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const mainNavItems = [
    { id: 'home' as TabId, label: 'Home', icon: Home },
    { id: 'transactions' as TabId, label: 'Transactions', icon: Receipt },
    { id: 'budgets' as TabId, label: 'Budgets', icon: PieChart },
    { id: 'reports' as TabId, label: 'Reports', icon: BarChart3 },
  ];

  const secondaryNavItems = [
    { id: 'accounts' as TabId, label: 'Accounts', icon: Landmark },
    { id: 'goals' as TabId, label: 'Goals & Debt', icon: Target },
    { id: 'bills' as TabId, label: 'Bills & Recurring', icon: CalendarDays },
    { id: 'settings' as TabId, label: 'Settings', icon: SettingsIcon },
  ];

  const allNavItems = [
    { id: 'home' as TabId, label: 'Dashboard', icon: Home },
    { id: 'transactions' as TabId, label: 'Transactions', icon: Receipt },
    { id: 'accounts' as TabId, label: 'Accounts', icon: Landmark },
    { id: 'budgets' as TabId, label: 'Budgets', icon: PieChart },
    { id: 'goals' as TabId, label: 'Goals & Debt', icon: Target },
    { id: 'bills' as TabId, label: 'Bills & Recurring', icon: CalendarDays },
    { id: 'reports' as TabId, label: 'Reports', icon: BarChart3 },
    { id: 'settings' as TabId, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* DESKTOP / TABLET SIDEBAR (Hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-[#1A1D23] border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 px-4 py-5 select-none">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-[#2E5EAA] dark:bg-[#5B8DEF] text-white dark:text-slate-950 flex items-center justify-center shadow-sm">
            <Wallet size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              PaisaTrack
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Local & Private Finance</p>
          </div>
        </div>

        {/* Quick Add Action Button */}
        <button
          onClick={onOpenAddTransaction}
          className="w-full h-11 mb-6 px-4 bg-[#2E5EAA] hover:bg-[#1E3F73] dark:bg-[#5B8DEF] dark:hover:bg-[#4A7CD8] text-white dark:text-slate-950 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer active:scale-[0.98]"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Transaction
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-[#2E5EAA]/10 text-[#2E5EAA] dark:bg-[#5B8DEF]/15 dark:text-[#5B8DEF] font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Offline Badge */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 px-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1F9D55]" />
            100% On-Device
          </span>
          <span>v1.0</span>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible on screens < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 px-2 pb-safe select-none">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto relative">
          {/* Home */}
          <button
            onClick={() => onSelectTab('home')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px] ${
              activeTab === 'home'
                ? 'text-[#2E5EAA] dark:text-[#5B8DEF]'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Home size={21} strokeWidth={activeTab === 'home' ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium tracking-tight mt-1">Home</span>
          </button>

          {/* Transactions */}
          <button
            onClick={() => onSelectTab('transactions')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px] ${
              activeTab === 'transactions'
                ? 'text-[#2E5EAA] dark:text-[#5B8DEF]'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <Receipt size={21} strokeWidth={activeTab === 'transactions' ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium tracking-tight mt-1">Activity</span>
          </button>

          {/* Elevated Centre + Add Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              onClick={onOpenAddTransaction}
              className="w-13 h-13 rounded-full bg-[#2E5EAA] dark:bg-[#5B8DEF] text-white dark:text-slate-950 flex items-center justify-center shadow-lg shadow-[#2E5EAA]/25 dark:shadow-none active:scale-95 transition-transform cursor-pointer"
              aria-label="Add transaction"
            >
              <Plus size={24} strokeWidth={2.8} />
            </button>
          </div>

          {/* Budgets */}
          <button
            onClick={() => onSelectTab('budgets')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px] ${
              activeTab === 'budgets'
                ? 'text-[#2E5EAA] dark:text-[#5B8DEF]'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <PieChart size={21} strokeWidth={activeTab === 'budgets' ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium tracking-tight mt-1">Budgets</span>
          </button>

          {/* More menu drawer trigger */}
          <button
            onClick={() => setShowMoreMenu(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[44px] ${
              ['accounts', 'goals', 'bills', 'reports', 'settings'].includes(activeTab)
                ? 'text-[#2E5EAA] dark:text-[#5B8DEF]'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <MoreHorizontal size={21} strokeWidth={1.8} />
            <span className="text-[10px] font-medium tracking-tight mt-1">More</span>
          </button>
        </div>
      </nav>

      {/* MOBILE MORE MENU DRAWER */}
      {showMoreMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setShowMoreMenu(false)}
          />
          <div className="relative w-full bg-white dark:bg-[#1A1D23] rounded-t-3xl p-5 z-10 border-t border-slate-200/80 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                More Features
              </h3>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-6">
              {[
                { id: 'accounts' as TabId, label: 'Accounts', desc: 'Net worth & bank accounts', icon: Landmark },
                { id: 'reports' as TabId, label: 'Reports', desc: 'Trends, categories & export', icon: BarChart3 },
                { id: 'goals' as TabId, label: 'Goals & Debt', desc: 'Savings & payoff planner', icon: Target },
                { id: 'bills' as TabId, label: 'Bills & Recurring', desc: 'Subscriptions & calendar', icon: CalendarDays },
                { id: 'settings' as TabId, label: 'Settings', desc: 'Backup, lock, preferences', icon: SettingsIcon },
              ].map((item) => {
                const Icon = item.icon;
                const isCurrent = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setShowMoreMenu(false);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-colors flex flex-col gap-1.5 ${
                      isCurrent
                        ? 'border-[#2E5EAA] bg-[#2E5EAA]/5 dark:border-[#5B8DEF] dark:bg-[#5B8DEF]/10'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={isCurrent ? 'text-[#2E5EAA] dark:text-[#5B8DEF]' : 'text-slate-500'}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
