import React from 'react';
import { Bell, AlertTriangle, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { Modal } from './ui/Modal';
import { NotificationItem } from '../types';
import { formatDateShort } from '../lib/dates';

export interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onClear: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClear,
  onMarkAsRead,
}) => {
  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'bill_due':
        return <Clock size={16} className="text-[#9B6BFF]" />;
      case 'budget_exceeded':
        return <AlertCircle size={16} className="text-[#D64545]" />;
      case 'budget_warning':
      case 'low_balance':
        return <AlertTriangle size={16} className="text-[#E0A526]" />;
      default:
        return <Bell size={16} className="text-[#2E5EAA]" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alerts & Reminders" maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500">
            {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
          </span>
          {notifications.length > 0 && (
            <button
              onClick={onClear}
              className="text-xs text-[#D64545] font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} />
              Clear all
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No active alerts. All budgets and balances are within healthy parameters!
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkAsRead(n.id)}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                  n.read
                    ? 'border-slate-200/60 dark:border-slate-800/60 opacity-60'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                }`}
              >
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-2xs shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {n.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateShort(n.date)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {n.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
