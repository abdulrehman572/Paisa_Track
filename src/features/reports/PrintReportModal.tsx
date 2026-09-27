import React from 'react';
import { Printer, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { formatMoney } from '../../lib/money';
import { formatDateShort } from '../../lib/dates';
import { Transaction, Category, Account, Settings } from '../../types';

export interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  settings: Settings;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  accounts,
  settings,
}) => {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  const handlePrint = () => {
    window.print();
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount_minor, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount_minor, 0);

  const netSavings = totalIncome - totalExpense;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Statement Report"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500">
            Preview formatted statement below. Click &quot;Print / Save PDF&quot; to print or download as PDF.
          </p>
          <Button onClick={handlePrint} size="sm">
            <Printer size={15} className="mr-1.5" />
            Print / Save PDF
          </Button>
        </div>

        {/* Printable Paper View */}
        <div
          id="printable-report"
          className="bg-white text-slate-900 p-6 rounded-xl border border-slate-200 text-xs space-y-5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#2E5EAA]">PaisaTrack</h2>
              <p className="text-[11px] text-slate-500">Personal Financial Statement</p>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              <p>Generated: {new Date().toLocaleDateString()}</p>
              <p>Currency: {settings.base_currency}</p>
            </div>
          </div>

          {/* Summary KPI Grid */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-center font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Total Income</span>
              <strong className="text-sm text-[#1F9D55]">
                {formatMoney(totalIncome, settings.base_currency)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Total Expenses</span>
              <strong className="text-sm text-[#D64545]">
                {formatMoney(totalExpense, settings.base_currency)}
              </strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Net Savings</span>
              <strong className="text-sm text-slate-900">
                {formatMoney(netSavings, settings.base_currency)}
              </strong>
            </div>
          </div>

          {/* Recent Transactions Table */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">
              Transaction Ledger ({transactions.length} items)
            </h4>
            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400">
                  <th className="pb-1.5">Date</th>
                  <th className="pb-1.5">Account</th>
                  <th className="pb-1.5">Category</th>
                  <th className="pb-1.5">Note</th>
                  <th className="pb-1.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 30).map((t) => {
                  const cat = t.category_id ? categoryMap.get(t.category_id) : undefined;
                  const acc = accountMap.get(t.account_id);

                  return (
                    <tr key={t.id}>
                      <td className="py-1.5 text-slate-600">{formatDateShort(t.date)}</td>
                      <td className="py-1.5 text-slate-600">{acc?.name || 'Account'}</td>
                      <td className="py-1.5 text-slate-600">{cat?.name || 'Transfer'}</td>
                      <td className="py-1.5 font-sans font-medium text-slate-900 max-w-[180px] truncate">
                        {t.note || '-'}
                      </td>
                      <td
                        className={`py-1.5 text-right font-bold ${
                          t.type === 'income'
                            ? 'text-[#1F9D55]'
                            : t.type === 'expense'
                            ? 'text-[#D64545]'
                            : 'text-slate-700'
                        }`}
                      >
                        {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                        {formatMoney(t.amount_minor, t.currency || settings.base_currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t text-[10px] text-slate-400 flex items-center justify-between">
            <span>PaisaTrack · Confidential & Private Financial Document</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
