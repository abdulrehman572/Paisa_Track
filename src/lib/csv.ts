import { Transaction } from '../types';
import { formatMoney, parseMoneyToMinor } from './money';

export function exportTransactionsToCSV(
  transactions: Transaction[],
  categoriesMap: Record<string, string>,
  accountsMap: Record<string, string>,
  currency = 'USD'
): string {
  const headers = ['Date', 'Type', 'Account', 'Category', 'Note', 'Amount', 'Currency', 'Tags', 'Reconciled'];
  
  const rows = transactions.map((t) => {
    const dateStr = new Date(t.date).toISOString().split('T')[0];
    const categoryName = t.category_id ? (categoriesMap[t.category_id] || 'Uncategorized') : 'Uncategorized';
    const accountName = accountsMap[t.account_id] || 'Unknown';
    const formattedAmt = formatMoney(t.amount_minor, t.currency || currency, { hideDecimalsIfWhole: false });
    const tagsStr = (t.tags || []).join(';');
    const noteEscaped = `"${(t.note || '').replace(/"/g, '""')}"`;

    return [
      dateStr,
      t.type,
      `"${accountName.replace(/"/g, '""')}"`,
      `"${categoryName.replace(/"/g, '""')}"`,
      noteEscaped,
      formattedAmt,
      t.currency || currency,
      `"${tagsStr}"`,
      t.is_reconciled ? 'Yes' : 'No',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export interface ParsedCsvRow {
  date: string;
  amount: string;
  type: string;
  category?: string;
  account?: string;
  note?: string;
  tags?: string;
  raw: Record<string, string>;
}

export function parseCSVString(csvContent: string): { headers: string[]; rows: string[][] } {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  return { headers, rows };
}
