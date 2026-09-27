export function normalizeToMidnight(epochMs: number | Date): number {
  const d = new Date(epochMs);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatTransactionDate(epochMs: number): string {
  const target = new Date(epochMs);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();

  if (targetMidnight === today) {
    return 'Today';
  }
  if (targetMidnight === yesterday) {
    return 'Yesterday';
  }

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: target.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  };
  return target.toLocaleDateString('en-US', options);
}

export function formatDateShort(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateInput(epochMs: number): string {
  const d = new Date(epochMs);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateInput(dateStr: string): number {
  if (!dateStr) return Date.now();
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return Date.now();
  const d = new Date(year, month - 1, day);
  return d.getTime();
}

export function getMonthYearLabel(year: number, monthIndex: number): string {
  const d = new Date(year, monthIndex, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getMonthBounds(year: number, monthIndex: number): { start: number; end: number } {
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0).getTime();
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function calculateNextOccurrence(
  currentEpoch: number,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly',
  interval = 1
): number {
  const d = new Date(currentEpoch);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + interval);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7 * interval);
      break;
    case 'biweekly':
      d.setDate(d.getDate() + 14 * interval);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + interval);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + interval);
      break;
  }
  return d.getTime();
}
