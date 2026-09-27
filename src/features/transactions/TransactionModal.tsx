import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Sparkles,
  Layers,
  Trash2,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { CategoryIconBadge } from '../../components/ui/CategoryIconBadge';
import { parseMoneyToMinor, minorToMajor, formatMoney } from '../../lib/money';
import { formatDateInput, parseDateInput } from '../../lib/dates';
import { db } from '../../db/storage';
import {
  Transaction,
  TransactionType,
  Category,
  Account,
  SplitItem,
  Settings,
} from '../../types';

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
  categories: Category[];
  accounts: Account[];
  settings: Settings;
  onSave: (tx: Transaction) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactionToEdit,
  categories,
  accounts,
  settings,
  onSave,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState('');
  const [counterAccountId, setCounterAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState(formatDateInput(Date.now()));
  const [tagsStr, setTagsStr] = useState('');
  const [receiptDataUrl, setReceiptDataUrl] = useState<string | null>(null);

  // Suggested category from merchant rule
  const [suggestedCategory, setSuggestedCategory] = useState<{ id: string; name: string } | null>(
    null
  );

  // Split transaction state
  const [isSplit, setIsSplit] = useState(false);
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Populate form on open / edit
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmountStr(minorToMajor(transactionToEdit.amount_minor, settings.base_currency).toString());
      setAccountId(transactionToEdit.account_id);
      setCounterAccountId(transactionToEdit.counter_account_id || '');
      setCategoryId(transactionToEdit.category_id || '');
      setNote(transactionToEdit.note);
      setDateStr(formatDateInput(transactionToEdit.date));
      setTagsStr((transactionToEdit.tags || []).join(', '));
      setReceiptDataUrl(transactionToEdit.receipt_path || null);
      if (transactionToEdit.splits && transactionToEdit.splits.length > 0) {
        setIsSplit(true);
        setSplits(transactionToEdit.splits);
      } else {
        setIsSplit(false);
        setSplits([]);
      }
    } else {
      // Defaults
      setType('expense');
      setAmountStr('');
      setAccountId(accounts[0]?.id || '');
      setCounterAccountId(accounts[1]?.id || '');
      setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
      setNote('');
      setDateStr(formatDateInput(Date.now()));
      setTagsStr('');
      setReceiptDataUrl(null);
      setIsSplit(false);
      setSplits([]);
    }
    setError(null);
    setSuggestedCategory(null);
  }, [transactionToEdit, isOpen, accounts, categories, settings.base_currency]);

  // Handle note change and check auto-categorisation / merchant rules
  const handleNoteChange = (text: string) => {
    setNote(text);
    if (type !== 'transfer' && text.length > 2) {
      const match = db.matchMerchant(text);
      if (match?.suggestedCategoryId) {
        const cat = categories.find((c) => c.id === match.suggestedCategoryId);
        if (cat && cat.id !== categoryId) {
          setSuggestedCategory({ id: cat.id, name: cat.name });
        }
      } else {
        setSuggestedCategory(null);
      }
    } else {
      setSuggestedCategory(null);
    }
  };

  // Image file upload & compression
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        // Compress using canvas to max 1200px width
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setReceiptDataUrl(compressedDataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Split management
  const addSplitItem = () => {
    setSplits((prev) => [
      ...prev,
      {
        id: `split-${Date.now()}-${prev.length}`,
        category_id: categories[0]?.id || '',
        amount_minor: 0,
        note: '',
      },
    ]);
  };

  const removeSplitItem = (index: number) => {
    setSplits((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateSplitItem = (index: number, updates: Partial<SplitItem>) => {
    setSplits((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Validate and submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountMinor = parseMoneyToMinor(amountStr, settings.base_currency);
    if (amountMinor <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!accountId) {
      setError('Please select an account.');
      return;
    }

    if (type === 'transfer') {
      if (!counterAccountId) {
        setError('Please select a destination account for the transfer.');
        return;
      }
      if (accountId === counterAccountId) {
        setError('Source and destination accounts must be different.');
        return;
      }
    }

    // Split validation
    if (isSplit) {
      if (splits.length < 2) {
        setError('A split transaction requires at least 2 split rows.');
        return;
      }
      const sumSplitsMinor = splits.reduce((acc, s) => acc + s.amount_minor, 0);
      if (sumSplitsMinor !== amountMinor) {
        const diff = Math.abs(sumSplitsMinor - amountMinor);
        setError(
          `Split amounts do not equal total. Difference: ${formatMoney(diff, settings.base_currency)}`
        );
        return;
      }
    }

    const tags = tagsStr
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const tx: Transaction = {
      id: transactionToEdit ? transactionToEdit.id : `tx-${Date.now()}`,
      type,
      amount_minor: amountMinor,
      currency: settings.base_currency,
      account_id: accountId,
      counter_account_id: type === 'transfer' ? counterAccountId : null,
      transfer_group_id:
        type === 'transfer'
          ? transactionToEdit?.transfer_group_id || `tg-${Date.now()}`
          : null,
      category_id: type === 'transfer' ? null : categoryId || null,
      note: note.trim(),
      date: parseDateInput(dateStr),
      is_reconciled: transactionToEdit ? transactionToEdit.is_reconciled : false,
      receipt_path: receiptDataUrl,
      splits: isSplit ? splits : undefined,
      tags,
      created_at: transactionToEdit ? transactionToEdit.created_at : Date.now(),
      updated_at: Date.now(),
    };

    onSave(tx);
    onClose();
  };

  const activeCategories = categories.filter((c) =>
    type === 'income' ? c.type === 'income' : c.type === 'expense'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? 'Edit Transaction' : 'New Transaction'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Segmented Control */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setIsSplit(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-[#D64545] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setIsSplit(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-[#1F9D55] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => {
              setType('transfer');
              setIsSplit(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'transfer'
                ? 'bg-[#2E5EAA] dark:bg-[#5B8DEF] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Transfer
          </button>
        </div>

        {/* Large Amount Input */}
        <div className="text-center py-2">
          <label className="block text-xs font-medium text-slate-400 mb-1">Amount</label>
          <div className="relative inline-flex items-center justify-center">
            <input
              type="number"
              step="any"
              placeholder="0.00"
              autoFocus={!transactionToEdit}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="text-3xl sm:text-4xl font-mono tabular-nums font-extrabold text-center bg-transparent border-b-2 border-slate-200 dark:border-slate-800 focus:border-[#2E5EAA] dark:focus:border-[#5B8DEF] text-slate-900 dark:text-slate-100 focus:outline-none px-2 py-1 max-w-[260px]"
            />
          </div>
        </div>

        {/* Note / Payee Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Note or Payee
          </label>
          <input
            type="text"
            placeholder="e.g. Starbucks, Uber, Monthly Salary..."
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="w-full h-11 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E5EAA]/20"
          />

          {/* Auto-categorization chip */}
          {suggestedCategory && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#2E5EAA] dark:text-[#5B8DEF]">
              <Sparkles size={13} />
              <span>Suggested category:</span>
              <button
                type="button"
                onClick={() => {
                  setCategoryId(suggestedCategory.id);
                  setSuggestedCategory(null);
                }}
                className="underline font-semibold hover:opacity-80 cursor-pointer"
              >
                {suggestedCategory.name} (Apply)
              </button>
            </div>
          )}
        </div>

        {/* Account Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatMoney(db.getAccountBalance(a.id), settings.base_currency)})
                </option>
              ))}
            </select>
          </div>

          {type === 'transfer' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                To Account
              </label>
              <select
                value={counterAccountId}
                onChange={(e) => setCounterAccountId(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatMoney(db.getAccountBalance(a.id), settings.base_currency)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
              />
            </div>
          )}
        </div>

        {/* Category Picker (if not transfer and not split) */}
        {type !== 'transfer' && !isSplit && (
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1 border border-slate-100 dark:border-slate-800/80 rounded-xl">
              {activeCategories.map((c) => {
                const isSelected = categoryId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategoryId(c.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2E5EAA]/15 text-[#2E5EAA] dark:text-[#5B8DEF] font-bold border border-[#2E5EAA]/30'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CategoryIconBadge iconName={c.icon} color={c.color} size={24} />
                    <span className="truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Split Transaction Option */}
        {type === 'expense' && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers size={14} />
                Split Across Categories
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!isSplit) {
                    setIsSplit(true);
                    if (splits.length === 0) {
                      setSplits([
                        { id: '1', category_id: categories[0]?.id || '', amount_minor: 0, note: '' },
                        { id: '2', category_id: categories[1]?.id || '', amount_minor: 0, note: '' },
                      ]);
                    }
                  } else {
                    setIsSplit(false);
                  }
                }}
                className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                  isSplit ? 'bg-[#2E5EAA] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {isSplit ? 'Split Enabled' : 'Enable Split'}
              </button>
            </div>

            {isSplit && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                {splits.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <select
                      value={s.category_id}
                      onChange={(e) => updateSplitItem(idx, { category_id: e.target.value })}
                      className="flex-1 h-9 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      {activeCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={s.amount_minor > 0 ? minorToMajor(s.amount_minor, settings.base_currency) : ''}
                      onChange={(e) =>
                        updateSplitItem(idx, {
                          amount_minor: parseMoneyToMinor(e.target.value, settings.base_currency),
                        })
                      }
                      className="w-24 h-9 px-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                    />

                    {splits.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeSplitItem(idx)}
                        className="p-1 text-slate-400 hover:text-[#D64545]"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addSplitItem}
                  className="text-xs text-[#2E5EAA] dark:text-[#5B8DEF] font-medium flex items-center gap-1 hover:underline pt-1"
                >
                  <Plus size={13} />
                  Add Sub-row
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tags & Receipt Attachment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              placeholder="groceries, work, trip"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Receipt Attachment
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800">
                <Upload size={14} />
                <span className="truncate">
                  {receiptDataUrl ? 'Receipt attached' : 'Upload photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  className="hidden"
                />
              </label>

              {receiptDataUrl && (
                <button
                  type="button"
                  onClick={() => setReceiptDataUrl(null)}
                  className="h-10 px-2 text-slate-400 hover:text-[#D64545] text-xs font-medium"
                  title="Remove receipt"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-[#D64545] dark:text-[#F0685E] font-medium bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900">
            {error}
          </p>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <Button type="submit" fullWidth size="lg">
            {transactionToEdit ? 'Save Changes' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
