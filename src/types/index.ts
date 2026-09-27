export type AccountType = 'cash' | 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  opening_balance_minor: number; // Stored in minor units (cents/paisa)
  icon: string;
  color: string;
  is_archived: boolean;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at?: number | null;
  sync_state?: 'local' | 'synced' | 'dirty';
}

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parent_id?: string | null;
  icon: string;
  color: string;
  is_system: boolean;
  is_archived: boolean;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface SplitItem {
  id: string;
  category_id: string;
  amount_minor: number;
  note?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount_minor: number; // Always positive integer in minor units; type carries sign
  currency: string;
  account_id: string;
  counter_account_id?: string | null; // For transfers
  transfer_group_id?: string | null; // Links both legs of a transfer
  category_id?: string | null;
  note: string;
  date: number; // UTC epoch ms (normalised to local midnight)
  is_reconciled: boolean;
  receipt_path?: string | null; // Local Data URL or stored file ref
  parent_transaction_id?: string | null; // For splits
  splits?: SplitItem[];
  tags: string[];
  created_at: number;
  updated_at: number;
  deleted_at?: number | null; // Soft delete
  sync_state?: 'local' | 'synced' | 'dirty';
}

export type FrequencyType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
  name: string;
  type: TransactionType;
  amount_minor: number;
  account_id: string;
  category_id?: string | null;
  note: string;
  frequency: FrequencyType;
  interval: number;
  next_run_at: number;
  end_at?: number | null;
  is_active: boolean;
  is_subscription: boolean;
  autopay: boolean;
  reminder_days_before?: number | null;
  last_run_at?: number | null;
  created_at: number;
  updated_at: number;
}

export type BudgetPeriodType = 'weekly' | 'biweekly' | 'monthly' | 'per_paycheck' | 'custom';
export type BudgetMode = 'standard' | 'envelope';

export interface Budget {
  id: string;
  category_id: string;
  amount_minor: number;
  period_type: BudgetPeriodType;
  period_start: number;
  period_end: number;
  rollover: boolean;
  mode: BudgetMode;
  created_at: number;
  updated_at: number;
}

export type GoalType = 'general' | 'emergency_fund';

export interface Goal {
  id: string;
  name: string;
  target_minor: number;
  saved_minor: number;
  deadline?: number | null;
  linked_account_id?: string | null;
  type: GoalType;
  icon: string;
  color: string;
  created_at: number;
  updated_at: number;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  amount_minor: number;
  date: number;
  transaction_id?: string | null;
  note?: string;
  created_at: number;
}

export interface Debt {
  id: string;
  name: string;
  balance_minor: number;
  apr_bps: number; // e.g. 1850 = 18.50%
  min_payment_minor: number;
  due_day: number; // 1-31
  created_at: number;
  updated_at: number;
}

export interface MerchantRule {
  id: string;
  pattern: string;
  match_type: 'contains' | 'starts_with' | 'regex';
  clean_name?: string | null;
  category_id?: string | null;
  priority: number;
  created_at: number;
}

export interface Settings {
  base_currency: string;
  theme: 'light' | 'dark' | 'system';
  first_run_complete: boolean;
  budget_mode: BudgetMode;
  pin_enabled: boolean;
  pin_code?: string;
  biometric_enabled: boolean;
  auto_lock_seconds: number; // 0, 30, 60, 300, -1
  notifications_enabled: boolean;
  reminder_days: number;
  budget_alerts_enabled: boolean;
  low_balance_alerts_enabled: boolean;
  low_balance_threshold_minor: number;
  show_privacy_blur: boolean;
  last_backup_at?: number | null;
  date_format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'bill_due' | 'budget_warning' | 'budget_exceeded' | 'low_balance' | 'info';
  date: number;
  read: boolean;
  action_url?: string;
}
