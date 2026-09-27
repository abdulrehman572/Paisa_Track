import {
  Account,
  Category,
  Transaction,
  RecurringRule,
  Budget,
  Goal,
  GoalContribution,
  Debt,
  MerchantRule,
  Settings,
  NotificationItem,
} from '../types';
import { INITIAL_CATEGORIES, INITIAL_SETTINGS } from './defaults';
import { calculateNextOccurrence } from '../lib/dates';

const STORAGE_KEYS = {
  SETTINGS: 'paisatrack_settings_v1',
  ACCOUNTS: 'paisatrack_accounts_v1',
  CATEGORIES: 'paisatrack_categories_v1',
  TRANSACTIONS: 'paisatrack_transactions_v1',
  BUDGETS: 'paisatrack_budgets_v1',
  RECURRING: 'paisatrack_recurring_v1',
  GOALS: 'paisatrack_goals_v1',
  GOAL_CONTRIBUTIONS: 'paisatrack_goal_contributions_v1',
  DEBTS: 'paisatrack_debts_v1',
  MERCHANT_RULES: 'paisatrack_merchant_rules_v1',
  NOTIFICATIONS: 'paisatrack_notifications_v1',
  DEMO_DATA_CLEANUP: 'paisatrack_demo_data_cleanup_v1',
};

const DEMO_IDS = {
  accounts: new Set(['acc-main-checking', 'acc-emergency-savings', 'acc-cash-wallet', 'acc-credit-card']),
  transactions: new Set(['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7', 'tx-8']),
  recurringTransactions: ['rec-gen-rec-rent-', 'rec-gen-rec-netflix-', 'rec-gen-rec-salary-'],
  budgets: new Set(['bgt-food', 'bgt-transport', 'bgt-bills', 'bgt-shopping', 'bgt-entertainment']),
  recurring: new Set(['rec-rent', 'rec-netflix', 'rec-salary']),
  goals: new Set(['goal-emergency', 'goal-vacation']),
  debts: new Set(['debt-credit-card', 'debt-student-loan']),
  merchantRules: new Set(['mr-1', 'mr-2', 'mr-3', 'mr-4', 'mr-5', 'mr-6', 'mr-7']),
};

type Listener = () => void;

class LocalDatabase {
  private listeners: Set<Listener> = new Set();
  public undoQueue: { transaction: Transaction; timeoutId: number }[] = [];

  constructor() {
    this.initializeDefaults();
    this.runCatchUpJob();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('LocalDatabase storage quota or write error:', e);
    }
  }

  private initializeDefaults() {
    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      this.setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACCOUNTS)) {
      this.setItem(STORAGE_KEYS.ACCOUNTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.setItem(STORAGE_KEYS.TRANSACTIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
      this.setItem(STORAGE_KEYS.BUDGETS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECURRING)) {
      this.setItem(STORAGE_KEYS.RECURRING, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GOALS)) {
      this.setItem(STORAGE_KEYS.GOALS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEBTS)) {
      this.setItem(STORAGE_KEYS.DEBTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MERCHANT_RULES)) {
      this.setItem(STORAGE_KEYS.MERCHANT_RULES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.GOAL_CONTRIBUTIONS)) {
      this.setItem(STORAGE_KEYS.GOAL_CONTRIBUTIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, []);
    }
    this.removeDemoData();
  }

  private removeDemoData() {
    if (localStorage.getItem(STORAGE_KEYS.DEMO_DATA_CLEANUP)) return;

    const removeById = (key: string, demoIds: Set<string>) => {
      const records = this.getItem<{ id: string }[]>(key, []);
      this.setItem(key, records.filter((record) => !demoIds.has(record.id)));
    };

    removeById(STORAGE_KEYS.ACCOUNTS, DEMO_IDS.accounts);
    const transactions = this.getItem<{ id: string }[]>(STORAGE_KEYS.TRANSACTIONS, []);
    this.setItem(
      STORAGE_KEYS.TRANSACTIONS,
      transactions.filter(
        ({ id }) =>
          !DEMO_IDS.transactions.has(id) &&
          !DEMO_IDS.recurringTransactions.some((prefix) => id.startsWith(prefix)),
      ),
    );
    removeById(STORAGE_KEYS.BUDGETS, DEMO_IDS.budgets);
    removeById(STORAGE_KEYS.RECURRING, DEMO_IDS.recurring);
    removeById(STORAGE_KEYS.GOALS, DEMO_IDS.goals);
    removeById(STORAGE_KEYS.DEBTS, DEMO_IDS.debts);
    removeById(STORAGE_KEYS.MERCHANT_RULES, DEMO_IDS.merchantRules);
    localStorage.setItem(STORAGE_KEYS.DEMO_DATA_CLEANUP, 'complete');
  }

  // --- Catch-Up Job for Recurring Rules ---
  public runCatchUpJob() {
    try {
      const rules = this.getRecurringRules().filter((r) => r.is_active);
      const now = Date.now();
      let modified = false;

      rules.forEach((rule) => {
        let nextRun = rule.next_run_at;
        const maxCatchups = 12; // Safety limit per rule
        let catchups = 0;

        while (nextRun <= now && catchups < maxCatchups) {
          catchups++;
          // Generate transaction
          const newTx: Transaction = {
            id: `rec-gen-${rule.id}-${nextRun}`,
            type: rule.type,
            amount_minor: rule.amount_minor,
            currency: 'USD',
            account_id: rule.account_id,
            category_id: rule.category_id,
            note: `${rule.name} (Recurring)`,
            date: nextRun,
            is_reconciled: rule.autopay,
            tags: ['recurring', rule.is_subscription ? 'subscription' : 'bill'],
            created_at: now,
            updated_at: now,
          };
          this.addTransaction(newTx, false);

          rule.last_run_at = nextRun;
          nextRun = calculateNextOccurrence(nextRun, rule.frequency, rule.interval);
          rule.next_run_at = nextRun;
          modified = true;
        }

        if (catchups > 0) {
          this.updateRecurringRule(rule, false);
        }
      });

      if (modified) {
        this.notify();
      }
    } catch (e) {
      console.error('Error running recurring catch-up job:', e);
    }
  }

  // --- Settings ---
  public getSettings(): Settings {
    return this.getItem<Settings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public updateSettings(updates: Partial<Settings>) {
    const current = this.getSettings();
    const updated = { ...current, ...updates };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);
    this.notify();
  }

  // --- Accounts ---
  public getAccounts(includeArchived = false): Account[] {
    const accounts = this.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    return accounts
      .filter((a) => !a.deleted_at && (includeArchived || !a.is_archived))
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public getAccount(id: string): Account | undefined {
    return this.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []).find((a) => a.id === id);
  }

  public saveAccount(account: Account) {
    const accounts = this.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    const index = accounts.findIndex((a) => a.id === account.id);
    if (index >= 0) {
      accounts[index] = { ...account, updated_at: Date.now() };
    } else {
      accounts.push({ ...account, created_at: Date.now(), updated_at: Date.now() });
    }
    this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
    this.notify();
  }

  public deleteAccount(id: string) {
    const accounts = this.getItem<Account[]>(STORAGE_KEYS.ACCOUNTS, []);
    const index = accounts.findIndex((a) => a.id === id);
    if (index >= 0) {
      accounts[index].deleted_at = Date.now();
      this.setItem(STORAGE_KEYS.ACCOUNTS, accounts);
      this.notify();
    }
  }

  // Computes real live balance for an account
  public getAccountBalance(accountId: string): number {
    const account = this.getAccount(accountId);
    if (!account) return 0;

    const txs = this.getTransactions({ accountId, includeSoftDeleted: false });
    let balance = account.opening_balance_minor;

    txs.forEach((tx) => {
      if (tx.type === 'income') {
        balance += tx.amount_minor;
      } else if (tx.type === 'expense') {
        balance -= tx.amount_minor;
      } else if (tx.type === 'transfer') {
        if (tx.account_id === accountId) {
          balance -= tx.amount_minor;
        } else if (tx.counter_account_id === accountId) {
          balance += tx.amount_minor;
        }
      }
    });

    return balance;
  }

  // Net worth calculation
  public getNetWorth(): { assetsMinor: number; liabilitiesMinor: number; netWorthMinor: number } {
    const accounts = this.getAccounts(true);
    let assetsMinor = 0;
    let liabilitiesMinor = 0;

    accounts.forEach((acc) => {
      const bal = this.getAccountBalance(acc.id);
      if (acc.type === 'credit_card' || acc.type === 'loan') {
        liabilitiesMinor += Math.max(0, bal);
      } else {
        assetsMinor += bal;
      }
    });

    return {
      assetsMinor,
      liabilitiesMinor,
      netWorthMinor: assetsMinor - liabilitiesMinor,
    };
  }

  // --- Categories ---
  public getCategories(includeArchived = false): Category[] {
    const cats = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    return cats
      .filter((c) => includeArchived || !c.is_archived)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  public saveCategory(category: Category) {
    const cats = this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
    const idx = cats.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      cats[idx] = { ...category, updated_at: Date.now() };
    } else {
      cats.push({ ...category, created_at: Date.now(), updated_at: Date.now() });
    }
    this.setItem(STORAGE_KEYS.CATEGORIES, cats);
    this.notify();
  }

  // --- Transactions ---
  public getTransactions(filter?: {
    accountId?: string;
    categoryId?: string;
    type?: string;
    search?: string;
    startDate?: number;
    endDate?: number;
    includeSoftDeleted?: boolean;
    tag?: string;
  }): Transaction[] {
    let txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);

    if (!filter?.includeSoftDeleted) {
      txs = txs.filter((t) => !t.deleted_at);
    }

    if (filter?.accountId) {
      txs = txs.filter((t) => t.account_id === filter.accountId || t.counter_account_id === filter.accountId);
    }

    if (filter?.categoryId) {
      txs = txs.filter((t) => t.category_id === filter.categoryId);
    }

    if (filter?.type && filter.type !== 'all') {
      txs = txs.filter((t) => t.type === filter.type);
    }

    if (filter?.startDate) {
      txs = txs.filter((t) => t.date >= filter.startDate!);
    }

    if (filter?.endDate) {
      txs = txs.filter((t) => t.date <= filter.endDate!);
    }

    if (filter?.tag) {
      txs = txs.filter((t) => t.tags && t.tags.includes(filter.tag!));
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      txs = txs.filter(
        (t) =>
          t.note.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // Sort descending by date
    return txs.sort((a, b) => b.date - a.date || b.created_at - a.created_at);
  }

  public getTransaction(id: string): Transaction | undefined {
    return this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []).find((t) => t.id === id);
  }

  public addTransaction(transaction: Transaction, notify = true) {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    txs.push({
      ...transaction,
      created_at: transaction.created_at || Date.now(),
      updated_at: Date.now(),
    });
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
    if (notify) this.notify();
  }

  public updateTransaction(transaction: Transaction) {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const idx = txs.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) {
      txs[idx] = { ...transaction, updated_at: Date.now() };
      this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
      this.notify();
    }
  }

  /**
   * Soft-delete with 5-second undo window.
   */
  public softDeleteTransaction(id: string, onUndoExpired?: () => void): () => void {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const target = txs.find((t) => t.id === id);
    if (!target) return () => {};

    target.deleted_at = Date.now();
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
    this.notify();

    // 5-second window before permanent or finalization
    const timeoutId = window.setTimeout(() => {
      this.undoQueue = this.undoQueue.filter((item) => item.transaction.id !== id);
      if (onUndoExpired) onUndoExpired();
    }, 5000);

    const undoItem = { transaction: target, timeoutId };
    this.undoQueue.push(undoItem);

    // Return undo callback
    return () => {
      clearTimeout(timeoutId);
      this.undoQueue = this.undoQueue.filter((item) => item.transaction.id !== id);
      this.restoreTransaction(id);
    };
  }

  public restoreTransaction(id: string) {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const target = txs.find((t) => t.id === id);
    if (target) {
      target.deleted_at = null;
      this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
      this.notify();
    }
  }

  public bulkDeleteTransactions(ids: string[]) {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const idSet = new Set(ids);
    txs.forEach((t) => {
      if (idSet.has(t.id)) {
        t.deleted_at = Date.now();
      }
    });
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
    this.notify();
  }

  public bulkUpdateCategory(ids: string[], categoryId: string) {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const idSet = new Set(ids);
    txs.forEach((t) => {
      if (idSet.has(t.id)) {
        t.category_id = categoryId;
        t.updated_at = Date.now();
      }
    });
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
    this.notify();
  }

  public bulkUpdateAccount(ids: string[], accountId: string) {
    const txs = this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    const idSet = new Set(ids);
    txs.forEach((t) => {
      if (idSet.has(t.id)) {
        t.account_id = accountId;
        t.updated_at = Date.now();
      }
    });
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txs);
    this.notify();
  }

  // --- Budgets ---
  public getBudgets(): Budget[] {
    return this.getItem<Budget[]>(STORAGE_KEYS.BUDGETS, []);
  }

  public saveBudget(budget: Budget) {
    const budgets = this.getBudgets();
    const idx = budgets.findIndex((b) => b.id === budget.id);
    if (idx >= 0) {
      budgets[idx] = { ...budget, updated_at: Date.now() };
    } else {
      budgets.push({ ...budget, created_at: Date.now(), updated_at: Date.now() });
    }
    this.setItem(STORAGE_KEYS.BUDGETS, budgets);
    this.notify();
  }

  public deleteBudget(id: string) {
    const budgets = this.getBudgets().filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BUDGETS, budgets);
    this.notify();
  }

  // --- Recurring Rules ---
  public getRecurringRules(): RecurringRule[] {
    return this.getItem<RecurringRule[]>(STORAGE_KEYS.RECURRING, []);
  }

  public saveRecurringRule(rule: RecurringRule) {
    const rules = this.getRecurringRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = { ...rule, updated_at: Date.now() };
    } else {
      rules.push({ ...rule, created_at: Date.now(), updated_at: Date.now() });
    }
    this.setItem(STORAGE_KEYS.RECURRING, rules);
    this.notify();
  }

  public updateRecurringRule(rule: RecurringRule, notify = true) {
    const rules = this.getRecurringRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = { ...rule, updated_at: Date.now() };
      this.setItem(STORAGE_KEYS.RECURRING, rules);
      if (notify) this.notify();
    }
  }

  public deleteRecurringRule(id: string) {
    const rules = this.getRecurringRules().filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.RECURRING, rules);
    this.notify();
  }

  // --- Goals ---
  public getGoals(): Goal[] {
    return this.getItem<Goal[]>(STORAGE_KEYS.GOALS, []);
  }

  public saveGoal(goal: Goal) {
    const goals = this.getGoals();
    const idx = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      goals[idx] = { ...goal, updated_at: Date.now() };
    } else {
      goals.push({ ...goal, created_at: Date.now(), updated_at: Date.now() });
    }
    this.setItem(STORAGE_KEYS.GOALS, goals);
    this.notify();
  }

  public deleteGoal(id: string) {
    const goals = this.getGoals().filter((g) => g.id !== id);
    this.setItem(STORAGE_KEYS.GOALS, goals);
    this.notify();
  }

  public addGoalContribution(contribution: GoalContribution) {
    const contribs = this.getItem<GoalContribution[]>(STORAGE_KEYS.GOAL_CONTRIBUTIONS, []);
    contribs.push(contribution);
    this.setItem(STORAGE_KEYS.GOAL_CONTRIBUTIONS, contribs);

    // Update goal saved amount
    const goals = this.getGoals();
    const target = goals.find((g) => g.id === contribution.goal_id);
    if (target) {
      target.saved_minor += contribution.amount_minor;
      target.updated_at = Date.now();
      this.setItem(STORAGE_KEYS.GOALS, goals);
    }
    this.notify();
  }

  public getGoalContributions(goalId: string): GoalContribution[] {
    const contribs = this.getItem<GoalContribution[]>(STORAGE_KEYS.GOAL_CONTRIBUTIONS, []);
    return contribs.filter((c) => c.goal_id === goalId).sort((a, b) => b.date - a.date);
  }

  // --- Debts ---
  public getDebts(): Debt[] {
    return this.getItem<Debt[]>(STORAGE_KEYS.DEBTS, []);
  }

  public saveDebt(debt: Debt) {
    const debts = this.getDebts();
    const idx = debts.findIndex((d) => d.id === debt.id);
    if (idx >= 0) {
      debts[idx] = { ...debt, updated_at: Date.now() };
    } else {
      debts.push({ ...debt, created_at: Date.now(), updated_at: Date.now() });
    }
    this.setItem(STORAGE_KEYS.DEBTS, debts);
    this.notify();
  }

  public deleteDebt(id: string) {
    const debts = this.getDebts().filter((d) => d.id !== id);
    this.setItem(STORAGE_KEYS.DEBTS, debts);
    this.notify();
  }

  // --- Merchant Rules & Auto-categorization ---
  public getMerchantRules(): MerchantRule[] {
    return this.getItem<MerchantRule[]>(STORAGE_KEYS.MERCHANT_RULES, []).sort(
      (a, b) => b.priority - a.priority
    );
  }

  public saveMerchantRule(rule: MerchantRule) {
    const rules = this.getMerchantRules();
    const idx = rules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      rules[idx] = rule;
    } else {
      rules.push(rule);
    }
    this.setItem(STORAGE_KEYS.MERCHANT_RULES, rules);
    this.notify();
  }

  public deleteMerchantRule(id: string) {
    const rules = this.getMerchantRules().filter((r) => r.id !== id);
    this.setItem(STORAGE_KEYS.MERCHANT_RULES, rules);
    this.notify();
  }

  /**
   * Evaluates input note against merchant rules.
   * Returns suggested category and cleaned merchant name if matched.
   */
  public matchMerchant(note: string): { suggestedCategoryId?: string; cleanName?: string } | null {
    if (!note || note.trim().length === 0) return null;
    const lower = note.toLowerCase().trim();
    const rules = this.getMerchantRules();

    for (const rule of rules) {
      const pat = rule.pattern.toLowerCase();
      let matched = false;
      if (rule.match_type === 'contains' && lower.includes(pat)) {
        matched = true;
      } else if (rule.match_type === 'starts_with' && lower.startsWith(pat)) {
        matched = true;
      } else if (rule.match_type === 'regex') {
        try {
          const reg = new RegExp(rule.pattern, 'i');
          matched = reg.test(note);
        } catch {
          matched = false;
        }
      }

      if (matched) {
        return {
          suggestedCategoryId: rule.category_id || undefined,
          cleanName: rule.clean_name || undefined,
        };
      }
    }
    return null;
  }

  // --- Notifications & Alerts ---
  public getNotifications(): NotificationItem[] {
    return this.getItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  public addNotification(notification: NotificationItem) {
    const notifs = this.getNotifications();
    notifs.unshift(notification);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs.slice(0, 50));
    this.notify();
  }

  public markNotificationAsRead(id: string) {
    const notifs = this.getNotifications();
    const target = notifs.find((n) => n.id === id);
    if (target) {
      target.read = true;
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
      this.notify();
    }
  }

  public clearNotifications() {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, []);
    this.notify();
  }

  // --- Full Backup & Restore ---
  public generateBackupJSON(): string {
    const backup = {
      version: 1,
      exported_at: Date.now(),
      settings: this.getSettings(),
      accounts: this.getAccounts(true),
      categories: this.getCategories(true),
      transactions: this.getTransactions({ includeSoftDeleted: true }),
      budgets: this.getBudgets(),
      recurring: this.getRecurringRules(),
      goals: this.getGoals(),
      goal_contributions: this.getItem<GoalContribution[]>(STORAGE_KEYS.GOAL_CONTRIBUTIONS, []),
      debts: this.getDebts(),
      merchant_rules: this.getMerchantRules(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public restoreFromJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !data.transactions || !data.accounts) {
        throw new Error('Invalid backup structure');
      }

      if (data.settings) this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.accounts) this.setItem(STORAGE_KEYS.ACCOUNTS, data.accounts);
      if (data.categories) this.setItem(STORAGE_KEYS.CATEGORIES, data.categories);
      if (data.transactions) this.setItem(STORAGE_KEYS.TRANSACTIONS, data.transactions);
      if (data.budgets) this.setItem(STORAGE_KEYS.BUDGETS, data.budgets);
      if (data.recurring) this.setItem(STORAGE_KEYS.RECURRING, data.recurring);
      if (data.goals) this.setItem(STORAGE_KEYS.GOALS, data.goals);
      if (data.goal_contributions) this.setItem(STORAGE_KEYS.GOAL_CONTRIBUTIONS, data.goal_contributions);
      if (data.debts) this.setItem(STORAGE_KEYS.DEBTS, data.debts);
      if (data.merchant_rules) this.setItem(STORAGE_KEYS.MERCHANT_RULES, data.merchant_rules);

      this.notify();
      return true;
    } catch (e) {
      console.error('Failed to restore backup:', e);
      return false;
    }
  }

  public wipeAllData() {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.initializeDefaults();
    this.notify();
  }
}

export const db = new LocalDatabase();
