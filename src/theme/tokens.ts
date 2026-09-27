export const THEME_COLORS = {
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    primary: '#2E5EAA',
    primaryPressed: '#1E3F73',
    income: '#1F9D55',
    expense: '#D64545',
    warning: '#E0A526',
    textPrimary: '#1A1D23',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
  },
  dark: {
    background: '#0F1115',
    surface: '#1A1D23',
    primary: '#5B8DEF',
    primaryPressed: '#4A7CD8',
    income: '#3DD671',
    expense: '#F0685E',
    warning: '#F0B94B',
    textPrimary: '#F3F4F6',
    textSecondary: '#9CA3AF',
    border: '#2A2E37',
  },
};

export const CATEGORY_PALETTE: Record<string, { color: string; label: string }> = {
  Food: { color: '#FF8A5B', label: 'Food & Dining' },
  Transport: { color: '#4EA8DE', label: 'Transport & Travel' },
  Bills: { color: '#9B6BFF', label: 'Bills & Utilities' },
  Shopping: { color: '#FF6B9E', label: 'Shopping' },
  Health: { color: '#38C6A5', label: 'Health & Wellness' },
  Entertainment: { color: '#FFC24B', label: 'Entertainment' },
  Rent: { color: '#5B7CFA', label: 'Rent & Housing' },
  Income: { color: '#1F9D55', label: 'Income & Salary' },
  Gifts: { color: '#E85D9C', label: 'Gifts & Donations' },
  Education: { color: '#3B82F6', label: 'Education' },
  Investments: { color: '#10B981', label: 'Investments' },
  Other: { color: '#8B93A1', label: 'Other & Miscellaneous' },
};

export const ACCOUNT_COLORS: Record<string, string> = {
  cash: '#1F9D55',
  checking: '#2E5EAA',
  savings: '#10B981',
  credit_card: '#E85D9C',
  investment: '#9B6BFF',
  loan: '#D64545',
};
