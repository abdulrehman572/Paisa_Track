import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from './db/storage';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { UndoSnackbar } from './components/ui/UndoSnackbar';
import { NotificationModal } from './components/NotificationModal';

// Features
import { DashboardView } from './features/dashboard/DashboardView';
import { TransactionsView } from './features/transactions/TransactionsView';
import { TransactionModal } from './features/transactions/TransactionModal';
import { AccountsView } from './features/accounts/AccountsView';
import { AccountModal } from './features/accounts/AccountModal';
import { ReconciliationModal } from './features/accounts/ReconciliationModal';
import { BudgetsView } from './features/budgets/BudgetsView';
import { BudgetModal } from './features/budgets/BudgetModal';
import { GoalsView } from './features/goals/GoalsView';
import { GoalModal } from './features/goals/GoalModal';
import { DebtModal } from './features/goals/DebtModal';
import { ContributionModal } from './features/goals/ContributionModal';
import { BillsView } from './features/bills/BillsView';
import { RecurringModal } from './features/bills/RecurringModal';
import { ReportsView } from './features/reports/ReportsView';
import { PrintReportModal } from './features/reports/PrintReportModal';
import { SettingsView } from './features/settings/SettingsView';
import { CsvImportModal } from './features/settings/CsvImportModal';
import { LockScreen } from './features/security/LockScreen';
import { OnboardingModal } from './features/onboarding/OnboardingModal';

import {
  Transaction,
  Account,
  Budget,
  Category,
  Goal,
  Debt,
  RecurringRule,
  Settings,
  NotificationItem,
} from './types';

export default function App() {
  // Database version/tick for reactive updates
  const [, setDbTick] = useState(0);

  // Read initial data from local DB
  const [settings, setSettings] = useState<Settings>(() => db.getSettings());
  const [accounts, setAccounts] = useState<Account[]>(() => db.getAccounts(true));
  const [categories, setCategories] = useState<Category[]>(() => db.getCategories(true));
  const [transactions, setTransactions] = useState<Transaction[]>(() => db.getTransactions());
  const [budgets, setBudgets] = useState<Budget[]>(() => db.getBudgets());
  const [goals, setGoals] = useState<Goal[]>(() => db.getGoals());
  const [debts, setDebts] = useState<Debt[]>(() => db.getDebts());
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>(() => db.getRecurringRules());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => db.getNotifications());

  // Subscribe to DB mutations
  useEffect(() => {
    const unsubscribe = db.subscribe(() => {
      setSettings(db.getSettings());
      setAccounts(db.getAccounts(true));
      setCategories(db.getCategories(true));
      setTransactions(db.getTransactions());
      setBudgets(db.getBudgets());
      setGoals(db.getGoals());
      setDebts(db.getDebts());
      setRecurringRules(db.getRecurringRules());
      setNotifications(db.getNotifications());
      setDbTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<TabId>('home');

  // Month navigation state
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());

  // Security App Lock State
  const [isLocked, setIsLocked] = useState(() => settings.pin_enabled);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);

  // Undo Snackbar State
  const [undoState, setUndoState] = useState<{
    isOpen: boolean;
    message: string;
    undoCallback: () => void;
  }>({
    isOpen: false,
    message: '',
    undoCallback: () => {},
  });

  // Modal Visibility States
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);

  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [accountToReconcile, setAccountToReconcile] = useState<Account | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [goalForContribution, setGoalForContribution] = useState<Goal | null>(null);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [recurringToEdit, setRecurringToEdit] = useState<RecurringRule | null>(null);

  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Ensure light mode is consistently applied
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Window Focus / Blur privacy listener
  useEffect(() => {
    if (!settings.show_privacy_blur) return;
    const handleBlur = () => setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [settings.show_privacy_blur]);

  // Net worth calculation
  const netWorth = useMemo(() => db.getNetWorth(), [accounts, transactions]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetMonth = () => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth());
  };

  // Soft delete with undo snackbar
  const handleDeleteTransaction = useCallback((id: string) => {
    const undoCallback = db.softDeleteTransaction(id, () => {
      setUndoState((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    });

    setUndoState({
      isOpen: true,
      message: 'Transaction deleted',
      undoCallback,
    });
  }, []);

  const handleBulkDeleteTransactions = useCallback((ids: string[]) => {
    db.bulkDeleteTransactions(ids);
  }, []);

  const handleBulkUpdateCategory = useCallback((ids: string[], categoryId: string) => {
    db.bulkUpdateCategory(ids, categoryId);
  }, []);

  // Onboarding finished
  const handleFinishOnboarding = (chosenCurrency: string) => {
    db.updateSettings({
      base_currency: chosenCurrency,
      first_run_complete: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-[#0F1115] text-[#1A1D23] dark:text-[#F3F4F6] flex">
      {/* Privacy Blur Layer when tab inactive */}
      {isWindowBlurred && settings.show_privacy_blur && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xl flex items-center justify-center text-white text-sm font-semibold">
          PaisaTrack (Protected)
        </div>
      )}

      {/* PIN App Lock Screen */}
      {isLocked && settings.pin_enabled && (
        <LockScreen
          correctPin={settings.pin_code}
          biometricEnabled={settings.biometric_enabled}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Onboarding Carousel for First Run */}
      <OnboardingModal
        isOpen={!settings.first_run_complete}
        onFinish={handleFinishOnboarding}
      />

      {/* Sidebar Navigation for Desktop & Tablet */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddTransaction={() => {
          setTransactionToEdit(null);
          setIsTransactionModalOpen(true);
        }}
        totalNetWorthMinor={netWorth.netWorthMinor}
        currency={settings.base_currency}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          currentYear={currentYear}
          currentMonth={currentMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onResetMonth={handleResetMonth}
          settings={settings}
          onLockApp={() => setIsLocked(true)}
          notifications={notifications}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        {/* View Router */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
          {activeTab === 'home' && (
            <DashboardView
              currentYear={currentYear}
              currentMonth={currentMonth}
              transactions={transactions}
              budgets={budgets}
              categories={categories}
              accounts={accounts}
              settings={settings}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onNavigateToBudgets={() => setActiveTab('budgets')}
              onNavigateToAccounts={() => setActiveTab('accounts')}
              onOpenAddTransaction={() => {
                setTransactionToEdit(null);
                setIsTransactionModalOpen(true);
              }}
              onSelectTransaction={(tx) => {
                setTransactionToEdit(tx);
                setIsTransactionModalOpen(true);
              }}
              netWorth={netWorth}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              settings={settings}
              onEditTransaction={(tx) => {
                setTransactionToEdit(tx);
                setIsTransactionModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onBulkDelete={handleBulkDeleteTransactions}
              onBulkUpdateCategory={handleBulkUpdateCategory}
              onOpenAddTransaction={() => {
                setTransactionToEdit(null);
                setIsTransactionModalOpen(true);
              }}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView
              accounts={accounts}
              settings={settings}
              onOpenAddAccount={() => {
                setAccountToEdit(null);
                setIsAccountModalOpen(true);
              }}
              onEditAccount={(acc) => {
                setAccountToEdit(acc);
                setIsAccountModalOpen(true);
              }}
              onDeleteAccount={(id) => db.deleteAccount(id)}
              onOpenReconcile={(acc) => {
                setAccountToReconcile(acc);
                setIsReconcileModalOpen(true);
              }}
              onSelectAccountTransactions={() => setActiveTab('transactions')}
              netWorth={netWorth}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              currentYear={currentYear}
              currentMonth={currentMonth}
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              settings={settings}
              onOpenAddBudget={() => {
                setBudgetToEdit(null);
                setIsBudgetModalOpen(true);
              }}
              onEditBudget={(b) => {
                setBudgetToEdit(b);
                setIsBudgetModalOpen(true);
              }}
              onDeleteBudget={(id) => db.deleteBudget(id)}
              onUpdateBudgetMode={(mode) => db.updateSettings({ budget_mode: mode })}
            />
          )}

          {activeTab === 'goals' && (
            <GoalsView
              goals={goals}
              debts={debts}
              transactions={transactions}
              accounts={accounts}
              settings={settings}
              onOpenAddGoal={() => {
                setGoalToEdit(null);
                setIsGoalModalOpen(true);
              }}
              onEditGoal={(g) => {
                setGoalToEdit(g);
                setIsGoalModalOpen(true);
              }}
              onDeleteGoal={(id) => db.deleteGoal(id)}
              onOpenContribution={(g) => {
                setGoalForContribution(g);
                setIsContributionModalOpen(true);
              }}
              onOpenAddDebt={() => {
                setDebtToEdit(null);
                setIsDebtModalOpen(true);
              }}
              onEditDebt={(d) => {
                setDebtToEdit(d);
                setIsDebtModalOpen(true);
              }}
              onDeleteDebt={(id) => db.deleteDebt(id)}
            />
          )}

          {activeTab === 'bills' && (
            <BillsView
              currentYear={currentYear}
              currentMonth={currentMonth}
              recurringRules={recurringRules}
              categories={categories}
              accounts={accounts}
              settings={settings}
              onOpenAddRecurring={() => {
                setRecurringToEdit(null);
                setIsRecurringModalOpen(true);
              }}
              onEditRecurring={(r) => {
                setRecurringToEdit(r);
                setIsRecurringModalOpen(true);
              }}
              onDeleteRecurring={(id) => db.deleteRecurringRule(id)}
              onRunCatchUp={() => db.runCatchUpJob()}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              settings={settings}
              onOpenPrintReport={() => setIsPrintReportOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              categories={categories}
              accounts={accounts}
              onUpdateSettings={(updates) => db.updateSettings(updates)}
              onOpenCsvImport={() => setIsCsvImportOpen(true)}
              onWipeData={() => db.wipeAllData()}
              onLockAppNow={() => setIsLocked(true)}
            />
          )}
        </main>
      </div>

      {/* Floating 5-Second Soft-Delete Undo Snackbar */}
      <UndoSnackbar
        isOpen={undoState.isOpen}
        message={undoState.message}
        onUndo={() => {
          undoState.undoCallback();
          setUndoState((prev) => ({ ...prev, isOpen: false }));
        }}
        onDismiss={() => setUndoState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* MODALS */}
      {/* 1. Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false);
          setTransactionToEdit(null);
        }}
        transactionToEdit={transactionToEdit}
        categories={categories}
        accounts={accounts}
        settings={settings}
        onSave={(tx) => {
          if (transactionToEdit) {
            db.updateTransaction(tx);
          } else {
            db.addTransaction(tx);
          }
        }}
      />

      {/* 2. Add / Edit Account Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setAccountToEdit(null);
        }}
        accountToEdit={accountToEdit}
        settings={settings}
        onSave={(acc) => db.saveAccount(acc)}
      />

      {/* 3. Account Reconciliation Modal */}
      <ReconciliationModal
        isOpen={isReconcileModalOpen}
        onClose={() => {
          setIsReconcileModalOpen(false);
          setAccountToReconcile(null);
        }}
        account={accountToReconcile}
        settings={settings}
        onReconciled={() => {}}
      />

      {/* 4. Add / Edit Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetToEdit(null);
        }}
        budgetToEdit={budgetToEdit}
        categories={categories}
        settings={settings}
        onSave={(b) => db.saveBudget(b)}
      />

      {/* 5. Add / Edit Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
        accounts={accounts}
        settings={settings}
        onSave={(g) => db.saveGoal(g)}
      />

      {/* 6. Add / Edit Debt Modal */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => {
          setIsDebtModalOpen(false);
          setDebtToEdit(null);
        }}
        debtToEdit={debtToEdit}
        settings={settings}
        onSave={(d) => db.saveDebt(d)}
      />

      {/* 7. Goal Contribution Modal */}
      <ContributionModal
        isOpen={isContributionModalOpen}
        onClose={() => {
          setIsContributionModalOpen(false);
          setGoalForContribution(null);
        }}
        goal={goalForContribution}
        accounts={accounts}
        settings={settings}
        onSaveContribution={(contrib, tx) => {
          if (tx) db.addTransaction(tx);
          db.addGoalContribution(contrib);
        }}
      />

      {/* 8. Add / Edit Recurring Rule Modal */}
      <RecurringModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setRecurringToEdit(null);
        }}
        ruleToEdit={recurringToEdit}
        categories={categories}
        accounts={accounts}
        settings={settings}
        onSave={(rule) => db.saveRecurringRule(rule)}
      />

      {/* 9. CSV Import Modal */}
      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        categories={categories}
        accounts={accounts}
        existingTransactions={transactions}
        settings={settings}
        onImportComplete={(importedTxs) => {
          importedTxs.forEach((t) => db.addTransaction(t, false));
          db.runCatchUpJob();
        }}
      />

      {/* 10. Printable Statement PDF Report Modal */}
      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        settings={settings}
      />

      {/* 11. Alerts & Notifications Modal */}
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onClear={() => db.clearNotifications()}
        onMarkAsRead={(id) => db.markNotificationAsRead(id)}
      />
    </div>
  );
}
