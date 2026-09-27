import React from 'react';
import { ChevronLeft, ChevronRight, Bell, Shield } from 'lucide-react';
import { getMonthYearLabel } from '../lib/dates';
import { Settings, NotificationItem } from '../types';

export interface HeaderProps {
  currentYear: number;
  currentMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetMonth: () => void;
  settings: Settings;
  onLockApp: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentYear,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onResetMonth,
  settings,
  onLockApp,
  notifications,
  onOpenNotifications,
}) => {
  const monthLabel = getMonthYearLabel(currentYear, currentMonth);
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#0F1115]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Month Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onPrevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={onResetMonth}
            className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 hover:text-[#2E5EAA] dark:hover:text-[#5B8DEF] transition-colors px-1"
            title="Jump to current month"
          >
            {monthLabel}
          </button>

          <button
            onClick={onNextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D64545] rounded-full ring-2 ring-white dark:ring-[#0F1115]" />
            )}
          </button>

          {/* Lock App */}
          {settings.pin_enabled && (
            <button
              onClick={onLockApp}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Lock App"
              aria-label="Lock App"
            >
              <Shield size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
