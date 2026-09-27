import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Scale,
  ShieldCheck,
  CreditCard,
  Banknote,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MoneyText } from '../../components/ui/MoneyText';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatMoney } from '../../lib/money';
import { ACCOUNT_COLORS } from '../../theme/tokens';
import { db } from '../../db/storage';
import { Account, Settings } from '../../types';

export interface AccountsViewProps {
  accounts: Account[];
  settings: Settings;
  onOpenAddAccount: () => void;
  onEditAccount: (acc: Account) => void;
  onDeleteAccount: (id: string) => void;
  onOpenReconcile: (acc: Account) => void;
  onSelectAccountTransactions: (accountId: string) => void;
  netWorth: { assetsMinor: number; liabilitiesMinor: number; netWorthMinor: number };
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  settings,
  onOpenAddAccount,
  onEditAccount,
  onDeleteAccount,
  onOpenReconcile,
  onSelectAccountTransactions,
  netWorth,
}) => {
  const [showArchived, setShowArchived] = useState(false);

  const displayedAccounts = accounts.filter((a) => showArchived || !a.is_archived);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return Landmark;
      case 'savings':
        return ShieldCheck;
      case 'credit_card':
        return CreditCard;
      case 'cash':
        return Banknote;
      case 'investment':
        return TrendingUp;
      default:
        return Landmark;
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. NET WORTH SUMMARY CARD */}
      <Card padding="lg" className="border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
            Total Net Worth
          </span>
          <Button onClick={onOpenAddAccount} size="sm">
            <Plus size={15} className="mr-1" />
            Add Account
          </Button>
        </div>

        <div className="my-2">
          <MoneyText
            amountMinor={netWorth.netWorthMinor}
            currency={settings.base_currency}
            size="hero"
          />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Assets: </span>
            <span className="font-mono font-semibold text-[#1F9D55] dark:text-[#3DD671]">
              {formatMoney(netWorth.assetsMinor, settings.base_currency)}
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Liabilities: </span>
            <span className="font-mono font-semibold text-[#D64545] dark:text-[#F0685E]">
              {formatMoney(netWorth.liabilitiesMinor, settings.base_currency)}
            </span>
          </div>
        </div>
      </Card>

      {/* 2. ACCOUNTS GRID */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
            Accounts ({displayedAccounts.length})
          </h3>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs text-[#2E5EAA] dark:text-[#5B8DEF] font-medium hover:underline cursor-pointer"
          >
            {showArchived ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>

        {displayedAccounts.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            message="Add checking, savings, cash, or credit card accounts to track your balances."
            actionLabel="Add Account"
            onAction={onOpenAddAccount}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {displayedAccounts.map((acc) => {
              const balance = db.getAccountBalance(acc.id);
              const Icon = getAccountIcon(acc.type);
              const color = acc.color || ACCOUNT_COLORS[acc.type] || '#2E5EAA';
              const isLiability = acc.type === 'credit_card' || acc.type === 'loan';

              return (
                <Card
                  key={acc.id}
                  padding="md"
                  className="relative overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-750 transition-all cursor-pointer group"
                  onClick={() => onSelectAccountTransactions(acc.id)}
                >
                  {/* Colored Left Edge Bar matching account type */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: color }}
                  />

                  <div>
                    <div className="flex items-start justify-between mb-2 pl-1">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          <Icon size={17} strokeWidth={2.2} />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#2E5EAA] dark:group-hover:text-[#5B8DEF] transition-colors">
                            {acc.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                            {acc.type.replace('_', ' ')}
                            {acc.is_archived && ' · Archived'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onOpenReconcile(acc)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Reconcile with bank statement"
                        >
                          <Scale size={14} />
                        </button>
                        <button
                          onClick={() => onEditAccount(acc)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit account"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDeleteAccount(acc.id)}
                          className="p-1.5 text-slate-400 hover:text-[#D64545] rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pl-1">
                      <span className="text-[11px] text-slate-400 block mb-0.5">
                        {isLiability ? 'Current Balance Owed' : 'Available Balance'}
                      </span>
                      <MoneyText
                        amountMinor={balance}
                        currency={acc.currency || settings.base_currency}
                        type={isLiability ? 'expense' : 'neutral'}
                        size="xl"
                      />
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] pl-1 text-slate-400">
                    <span>Currency: {acc.currency || settings.base_currency}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReconcile(acc);
                      }}
                      className="text-[#2E5EAA] dark:text-[#5B8DEF] font-medium hover:underline flex items-center gap-1"
                    >
                      <CheckCircle2 size={12} />
                      Reconcile
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
