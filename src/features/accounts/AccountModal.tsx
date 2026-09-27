import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parseMoneyToMinor, minorToMajor, SUPPORTED_CURRENCIES } from '../../lib/money';
import { ACCOUNT_COLORS } from '../../theme/tokens';
import { Account, AccountType, Settings } from '../../types';

export interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: Account | null;
  settings: Settings;
  onSave: (account: Account) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
  settings,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState(settings.base_currency);
  const [openingBalanceStr, setOpeningBalanceStr] = useState('0');
  const [color, setColor] = useState('#2E5EAA');
  const [isArchived, setIsArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency || settings.base_currency);
      setOpeningBalanceStr(minorToMajor(accountToEdit.opening_balance_minor, accountToEdit.currency).toString());
      setColor(accountToEdit.color || ACCOUNT_COLORS[accountToEdit.type]);
      setIsArchived(accountToEdit.is_archived);
    } else {
      setName('');
      setType('checking');
      setCurrency(settings.base_currency);
      setOpeningBalanceStr('0');
      setColor('#2E5EAA');
      setIsArchived(false);
    }
    setError(null);
  }, [accountToEdit, isOpen, settings.base_currency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required.');
      return;
    }

    const openingMinor = parseMoneyToMinor(openingBalanceStr, currency);

    const account: Account = {
      id: accountToEdit ? accountToEdit.id : `acc-${Date.now()}`,
      name: name.trim(),
      type,
      currency,
      opening_balance_minor: openingMinor,
      icon: 'Landmark',
      color,
      is_archived: isArchived,
      sort_order: accountToEdit ? accountToEdit.sort_order : 10,
      created_at: accountToEdit ? accountToEdit.created_at : Date.now(),
      updated_at: Date.now(),
    };

    onSave(account);
    onClose();
  };

  const accountTypes: { value: AccountType; label: string }[] = [
    { value: 'checking', label: 'Checking Account' },
    { value: 'savings', label: 'Savings Account' },
    { value: 'cash', label: 'Cash Wallet' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'investment', label: 'Investment' },
    { value: 'loan', label: 'Loan / Mortgage' },
  ];

  const colorPalette = [
    '#2E5EAA',
    '#1F9D55',
    '#10B981',
    '#4EA8DE',
    '#9B6BFF',
    '#FF8A5B',
    '#FF6B9E',
    '#D64545',
    '#8B93A1',
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={accountToEdit ? 'Edit Account' : 'Add New Account'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Account Name
          </label>
          <input
            type="text"
            placeholder="e.g. Chase Total Checking"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            autoFocus
          />
        </div>

        {/* Type & Currency */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Account Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as AccountType;
                setType(newType);
                setColor(ACCOUNT_COLORS[newType] || color);
              }}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {accountTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {Object.keys(SUPPORTED_CURRENCIES).map((cur) => (
                <option key={cur} value={cur}>
                  {cur} ({SUPPORTED_CURRENCIES[cur].symbol})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opening Balance */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Opening Balance
          </label>
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={openingBalanceStr}
            onChange={(e) => setOpeningBalanceStr(e.target.value)}
            className="w-full h-11 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            The balance of this account before any recorded transactions in PaisaTrack.
          </p>
        </div>

        {/* Color Choice */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Accent Color
          </label>
          <div className="flex items-center gap-2">
            {colorPalette.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                  color === c ? 'ring-2 ring-offset-2 ring-[#2E5EAA] scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Archive toggle */}
        {accountToEdit && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="archive-acc"
              checked={isArchived}
              onChange={(e) => setIsArchived(e.target.checked)}
              className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
            />
            <label
              htmlFor="archive-acc"
              className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              Archive this account (hide from selection dropdowns)
            </label>
          </div>
        )}

        {error && <p className="text-xs text-[#D64545] font-medium">{error}</p>}

        <div className="pt-2">
          <Button type="submit" fullWidth size="lg">
            {accountToEdit ? 'Save Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
