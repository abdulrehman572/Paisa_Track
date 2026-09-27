import React, { useState } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Tag,
  ArrowLeftRight,
  FolderOpen,
  Image,
  Layers,
  X,
  Plus,
  Receipt,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { MoneyText } from '../../components/ui/MoneyText';
import { CategoryIconBadge } from '../../components/ui/CategoryIconBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatTransactionDate } from '../../lib/dates';
import { Transaction, Category, Account, Settings } from '../../types';

export interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  settings: Settings;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdateCategory: (ids: string[], categoryId: string) => void;
  onOpenAddTransaction: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  accounts,
  settings,
  onEditTransaction,
  onDeleteTransaction,
  onBulkDelete,
  onBulkUpdateCategory,
  onOpenAddTransaction,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Multi-select state
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [viewingReceiptTx, setViewingReceiptTx] = useState<Transaction | null>(null);

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Extract all unique tags
  const allTags = Array.from(
    new Set(transactions.flatMap((t) => t.tags || []).filter(Boolean))
  );

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false;
    if (selectedAccount !== 'all' && t.account_id !== selectedAccount && t.counter_account_id !== selectedAccount) return false;
    if (selectedCategory !== 'all' && t.category_id !== selectedCategory) return false;
    if (selectedTag !== 'all' && (!t.tags || !t.tags.includes(selectedTag))) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const noteMatch = (t.note || '').toLowerCase().includes(q);
      const catMatch = t.category_id ? (categoryMap.get(t.category_id)?.name || '').toLowerCase().includes(q) : false;
      const accMatch = (accountMap.get(t.account_id)?.name || '').toLowerCase().includes(q);
      const tagMatch = (t.tags || []).some((tag) => tag.toLowerCase().includes(q));
      if (!noteMatch && !catMatch && !accMatch && !tagMatch) return false;
    }

    return true;
  });

  // Group by date string
  const groupedByDate: { dateLabel: string; items: Transaction[] }[] = [];
  const dateBuckets = new Map<string, Transaction[]>();

  filteredTransactions.forEach((tx) => {
    const label = formatTransactionDate(tx.date);
    if (!dateBuckets.has(label)) {
      dateBuckets.set(label, []);
    }
    dateBuckets.get(label)!.push(tx);
  });

  dateBuckets.forEach((items, dateLabel) => {
    groupedByDate.push({ dateLabel, items });
  });

  // Multi-select helpers
  const toggleSelectTx = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTxIds(new Set(filteredTransactions.map((t) => t.id)));
  };

  const clearSelection = () => {
    setSelectedTxIds(new Set());
    setIsMultiSelect(false);
  };

  const handleBulkDelete = () => {
    if (selectedTxIds.size === 0) return;
    onBulkDelete(Array.from(selectedTxIds));
    clearSelection();
  };

  const handleApplyBulkCategory = (catId: string) => {
    if (selectedTxIds.size === 0) return;
    onBulkUpdateCategory(Array.from(selectedTxIds), catId);
    setShowBulkCategoryModal(false);
    clearSelection();
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8">
      {/* 1. STICKY SEARCH & FILTER BAR */}
      <div className="sticky top-14 z-20 bg-white/95 dark:bg-[#0F1115]/95 backdrop-blur-md pt-1 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by note, category, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-8 bg-slate-100 dark:bg-[#1A1D23] border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2E5EAA]/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
              showFilters || selectedType !== 'all' || selectedAccount !== 'all' || selectedCategory !== 'all'
                ? 'bg-[#2E5EAA] text-white border-[#2E5EAA] dark:bg-[#5B8DEF] dark:text-slate-950 dark:border-[#5B8DEF]'
                : 'bg-white dark:bg-[#1A1D23] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Filter size={15} />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Multi-select toggle */}
          <button
            onClick={() => {
              if (isMultiSelect) clearSelection();
              else setIsMultiSelect(true);
            }}
            className={`h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-colors ${
              isMultiSelect
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900'
                : 'bg-white dark:bg-[#1A1D23] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Layers size={15} />
            <span className="hidden sm:inline">Select</span>
          </button>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="mt-3 p-4 bg-white dark:bg-[#1A1D23] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Type Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['all', 'expense', 'income', 'transfer'].map((t) => (
                  <Chip
                    key={t}
                    active={selectedType === t}
                    onClick={() => setSelectedType(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Account Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Account
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                <Chip active={selectedAccount === 'all'} onClick={() => setSelectedAccount('all')}>
                  All Accounts
                </Chip>
                {accounts.map((a) => (
                  <Chip
                    key={a.id}
                    active={selectedAccount === a.id}
                    onClick={() => setSelectedAccount(a.id)}
                  >
                    {a.name}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                <Chip active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')}>
                  All Categories
                </Chip>
                {categories.map((c) => (
                  <Chip
                    key={c.id}
                    active={selectedCategory === c.id}
                    onClick={() => setSelectedCategory(c.id)}
                  >
                    {c.name}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <Chip active={selectedTag === 'all'} onClick={() => setSelectedTag('all')}>
                    All Tags
                  </Chip>
                  {allTags.map((tag) => (
                    <Chip
                      key={tag}
                      active={selectedTag === tag}
                      onClick={() => setSelectedTag(tag)}
                    >
                      #{tag}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Filters */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setSelectedType('all');
                  setSelectedAccount('all');
                  setSelectedCategory('all');
                  setSelectedTag('all');
                  setSearchQuery('');
                }}
                className="text-xs text-[#D64545] hover:underline font-medium cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}

        {/* Multi-Select Floating Bulk Action Bar */}
        {isMultiSelect && (
          <div className="mt-3 p-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl shadow-lg flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span>{selectedTxIds.size} selected</span>
              <button
                onClick={selectAll}
                className="underline text-slate-300 dark:text-slate-600 hover:text-white"
              >
                Select all ({filteredTransactions.length})
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkCategoryModal(true)}
                disabled={selectedTxIds.size === 0}
                className="px-2.5 py-1.5 bg-slate-800 dark:bg-slate-200 text-xs font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <FolderOpen size={13} />
                Set Category
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={selectedTxIds.size === 0}
                className="px-2.5 py-1.5 bg-[#D64545] text-white text-xs font-medium rounded-lg hover:bg-[#B33434] disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={13} />
                Delete
              </button>
              <button
                onClick={clearSelection}
                className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. TRANSACTIONS GROUPED LIST */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          message={
            searchQuery || selectedType !== 'all' || selectedCategory !== 'all'
              ? 'Try adjusting your search query or clear filters to see more activity.'
              : 'Record your first income, expense, or transfer to get started.'
          }
          actionLabel="Add Transaction"
          onAction={onOpenAddTransaction}
        />
      ) : (
        <div className="space-y-5">
          {groupedByDate.map((group) => (
            <div key={group.dateLabel}>
              {/* Sticky Date Header */}
              <div className="sticky top-28 z-10 py-1 px-1 mb-2 bg-[#F7F8FA]/90 dark:bg-[#0F1115]/90 backdrop-blur-xs flex items-center justify-between">
                <span className="text-xs font-bold tracking-tight text-slate-600 dark:text-slate-400 uppercase">
                  {group.dateLabel}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Transactions in this date */}
              <Card padding="none" className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {group.items.map((tx) => {
                  const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
                  const acc = accountMap.get(tx.account_id);
                  const isChecked = selectedTxIds.has(tx.id);

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Left: Checkbox (if multi-select) & Icon & Title */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {isMultiSelect && (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectTx(tx.id)}
                            className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
                          />
                        )}

                        <div
                          onClick={() => (!isMultiSelect ? onEditTransaction(tx) : toggleSelectTx(tx.id))}
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                        >
                          <CategoryIconBadge
                            iconName={tx.type === 'transfer' ? 'ArrowLeftRight' : cat?.icon}
                            color={tx.type === 'transfer' ? '#2E5EAA' : cat?.color}
                            size={36}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                {tx.note || cat?.name || (tx.type === 'transfer' ? 'Transfer' : 'Transaction')}
                              </p>
                              {tx.receipt_path && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingReceiptTx(tx);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                  title="View Receipt"
                                >
                                  <Image size={13} />
                                </button>
                              )}
                              {tx.splits && tx.splits.length > 0 && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  [{tx.splits.length} splits]
                                </span>
                              )}
                            </div>

                            {/* Metadata text without pills */}
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              <span>{acc?.name || 'Account'}</span>
                              {cat && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{cat.name}</span>
                                </>
                              )}
                              {tx.tags && tx.tags.length > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>#{tx.tags.join(', #')}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Quick Actions */}
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <div
                          onClick={() => (!isMultiSelect ? onEditTransaction(tx) : toggleSelectTx(tx.id))}
                          className="text-right cursor-pointer"
                        >
                          <MoneyText
                            amountMinor={tx.amount_minor}
                            currency={tx.currency || settings.base_currency}
                            type={tx.type === 'transfer' ? 'neutral' : tx.type}
                            size="sm"
                            showSign={tx.type === 'income'}
                          />
                        </div>

                        {/* Hover/Touch Delete button */}
                        {!isMultiSelect && (
                          <button
                            onClick={() => onDeleteTransaction(tx.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-[#D64545] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-opacity cursor-pointer"
                            title="Delete transaction"
                            aria-label="Delete transaction"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Category Modal */}
      {showBulkCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Assign Category to {selectedTxIds.size} Transactions
            </h3>
            <div className="space-y-1 max-h-60 overflow-y-auto mb-4">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleApplyBulkCategory(c.id)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  <CategoryIconBadge iconName={c.icon} color={c.color} size={24} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowBulkCategoryModal(false)}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Receipt Viewer Modal */}
      {viewingReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1A1D23] rounded-2xl p-4 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Receipt Attachment
              </h4>
              <button
                onClick={() => setViewingReceiptTx(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 max-h-[70vh] flex items-center justify-center">
              <img
                src={viewingReceiptTx.receipt_path || ''}
                alt="Receipt"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {viewingReceiptTx.note || 'Transaction Receipt'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
