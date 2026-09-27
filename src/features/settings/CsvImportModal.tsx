import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parseCSVString } from '../../lib/csv';
import { parseMoneyToMinor } from '../../lib/money';
import { parseDateInput } from '../../lib/dates';
import { Transaction, Category, Account, Settings } from '../../types';

export interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  existingTransactions: Transaction[];
  settings: Settings;
  onImportComplete: (imported: Transaction[]) => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  existingTransactions,
  settings,
  onImportComplete,
}) => {
  const [csvRaw, setCsvRaw] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [allRows, setAllRows] = useState<string[][]>([]);

  // Column mapping
  const [dateColIdx, setDateColIdx] = useState<number>(-1);
  const [amountColIdx, setAmountColIdx] = useState<number>(-1);
  const [noteColIdx, setNoteColIdx] = useState<number>(-1);
  const [typeColIdx, setTypeColIdx] = useState<number>(-1);

  // Target account for imports
  const [targetAccountId, setTargetAccountId] = useState(accounts[0]?.id || '');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [parsedTxs, setParsedTxs] = useState<Transaction[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRaw(content);
      const parsed = parseCSVString(content);
      setHeaders(parsed.headers);
      setAllRows(parsed.rows);
      setPreviewRows(parsed.rows.slice(0, 5));

      // Auto-detect headers heuristically
      parsed.headers.forEach((h, idx) => {
        const lower = h.toLowerCase();
        if (lower.includes('date')) setDateColIdx(idx);
        else if (lower.includes('amount') || lower.includes('debit') || lower.includes('cost')) setAmountColIdx(idx);
        else if (lower.includes('note') || lower.includes('desc') || lower.includes('memo') || lower.includes('payee')) setNoteColIdx(idx);
        else if (lower.includes('type')) setTypeColIdx(idx);
      });

      setStep('mapping');
    };
    reader.readAsText(file);
  };

  const handleProcessMapping = () => {
    if (dateColIdx === -1 || amountColIdx === -1) {
      alert('Please select which columns correspond to Date and Amount.');
      return;
    }

    const newTxs: Transaction[] = [];
    let duplicates = 0;

    allRows.forEach((row, i) => {
      const rawDate = row[dateColIdx];
      const rawAmount = row[amountColIdx];
      const rawNote = noteColIdx >= 0 ? row[noteColIdx] : '';

      if (!rawDate || !rawAmount) return;

      const dateEpoch = parseDateInput(rawDate);
      const amountMinor = Math.abs(parseMoneyToMinor(rawAmount, settings.base_currency));
      const note = rawNote || 'Imported Transaction';

      // Detect duplicates based on date, amount, account, and note
      const isDuplicate = existingTransactions.some(
        (ex) =>
          Math.abs(ex.date - dateEpoch) < 86400000 &&
          ex.amount_minor === amountMinor &&
          ex.account_id === targetAccountId
      );

      if (isDuplicate) {
        duplicates++;
        if (skipDuplicates) return;
      }

      newTxs.push({
        id: `tx-import-${Date.now()}-${i}`,
        type: 'expense',
        amount_minor: amountMinor,
        currency: settings.base_currency,
        account_id: targetAccountId,
        category_id: categories[0]?.id || null,
        note,
        date: dateEpoch,
        is_reconciled: true,
        tags: ['imported'],
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    });

    setParsedTxs(newTxs);
    setDuplicateCount(duplicates);
    setStep('preview');
  };

  const handleConfirmImport = () => {
    onImportComplete(parsedTxs);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Bank CSV File" maxWidth="lg">
      <div className="space-y-4">
        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="text-center py-8">
            <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#2E5EAA] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/50">
              <FileSpreadsheet size={36} className="text-slate-400 mb-3" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Choose CSV statement from your computer
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Standard format from Chase, Wells Fargo, Bank of America, etc.
              </span>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* STEP 2: COLUMN MAPPING */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Match the columns from your CSV with PaisaTrack fields:
            </p>

            {/* Target Account */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Import Into Account
              </label>
              <select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date Column *
                </label>
                <select
                  value={dateColIdx}
                  onChange={(e) => setDateColIdx(parseInt(e.target.value))}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                >
                  <option value={-1}>-- Select Column --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Column *
                </label>
                <select
                  value={amountColIdx}
                  onChange={(e) => setAmountColIdx(parseInt(e.target.value))}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                >
                  <option value={-1}>-- Select Column --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note / Description Column
                </label>
                <select
                  value={noteColIdx}
                  onChange={(e) => setNoteColIdx(parseInt(e.target.value))}
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                >
                  <option value={-1}>-- Optional --</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center pt-5">
                <input
                  type="checkbox"
                  id="skip-dup"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded text-[#2E5EAA] focus:ring-[#2E5EAA] cursor-pointer"
                />
                <label
                  htmlFor="skip-dup"
                  className="text-xs text-slate-700 dark:text-slate-300 ml-2 cursor-pointer"
                >
                  Skip possible duplicate transactions
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button size="sm" onClick={handleProcessMapping}>
                Preview Parsed Rows
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & CONFIRM */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-500/10 text-[#1F9D55] rounded-xl text-xs flex items-center justify-between">
              <span>Ready to import {parsedTxs.length} transactions.</span>
              {duplicateCount > 0 && <span>({duplicateCount} duplicates skipped)</span>}
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                  <tr className="border-b">
                    <th className="p-2">Date</th>
                    <th className="p-2">Note</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {parsedTxs.slice(0, 15).map((t, idx) => (
                    <tr key={idx}>
                      <td className="p-2">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="p-2 truncate max-w-[200px]">{t.note}</td>
                      <td className="p-2 text-right">${(t.amount_minor / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>
                Back
              </Button>
              <Button size="sm" onClick={handleConfirmImport}>
                Confirm Import ({parsedTxs.length})
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
