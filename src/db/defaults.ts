import { Category, Settings } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-income-salary', name: 'Salary & Wages', type: 'income', icon: 'Briefcase', color: '#1F9D55', is_system: true, is_archived: false, sort_order: 1, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-income-freelance', name: 'Freelance & Side Gig', type: 'income', icon: 'Laptop', color: '#3DD671', is_system: true, is_archived: false, sort_order: 2, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-income-investments', name: 'Investment Returns', type: 'income', icon: 'TrendingUp', color: '#10B981', is_system: true, is_archived: false, sort_order: 3, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#FF8A5B', is_system: true, is_archived: false, sort_order: 4, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-transport', name: 'Transport & Fuel', type: 'expense', icon: 'Car', color: '#4EA8DE', is_system: true, is_archived: false, sort_order: 5, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-bills', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#9B6BFF', is_system: true, is_archived: false, sort_order: 6, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-shopping', name: 'Shopping & Goods', type: 'expense', icon: 'ShoppingBag', color: '#FF6B9E', is_system: true, is_archived: false, sort_order: 7, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-health', name: 'Health & Medical', type: 'expense', icon: 'HeartPulse', color: '#38C6A5', is_system: true, is_archived: false, sort_order: 8, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-entertainment', name: 'Entertainment & Fun', type: 'expense', icon: 'Film', color: '#FFC24B', is_system: true, is_archived: false, sort_order: 9, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-rent', name: 'Rent & Housing', type: 'expense', icon: 'Home', color: '#5B7CFA', is_system: true, is_archived: false, sort_order: 10, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-gifts', name: 'Gifts & Charity', type: 'expense', icon: 'Gift', color: '#E85D9C', is_system: true, is_archived: false, sort_order: 11, created_at: Date.now(), updated_at: Date.now() },
  { id: 'cat-exp-other', name: 'Miscellaneous', type: 'expense', icon: 'MoreHorizontal', color: '#8B93A1', is_system: true, is_archived: false, sort_order: 12, created_at: Date.now(), updated_at: Date.now() },
];

export const INITIAL_SETTINGS: Settings = {
  base_currency: 'USD',
  theme: 'system',
  first_run_complete: false,
  budget_mode: 'standard',
  pin_enabled: false,
  pin_code: '',
  biometric_enabled: false,
  auto_lock_seconds: 300,
  notifications_enabled: true,
  reminder_days: 3,
  budget_alerts_enabled: true,
  low_balance_alerts_enabled: true,
  low_balance_threshold_minor: 10000,
  show_privacy_blur: false,
  last_backup_at: null,
  date_format: 'YYYY-MM-DD',
};