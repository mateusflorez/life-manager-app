import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  BankAccount,
  CreditCard,
  CardCharge,
  RecurringExpense,
  FinanceMonth,
  FinanceEntry,
  FinanceCategories,
  getCurrentMonthKey,
} from '@/types/finance';
import * as FinanceStorage from '@/services/finance-storage';
import { useAccount } from './account-context';

type FinanceContextType = {
  // Bank Account
  bankAccounts: BankAccount[];
  activeBankAccount: BankAccount | null;
  setActiveBankAccount: (account: BankAccount | null) => Promise<void>;
  createBankAccount: (name: string, description?: string) => Promise<BankAccount>;
  updateBankAccount: (account: BankAccount) => Promise<void>;
  deleteBankAccount: (accountId: string) => Promise<void>;

  // Credit Cards
  creditCards: CreditCard[];
  createCreditCard: (
    name: string,
    limit: number,
    closeDay: number,
    dueDay: number
  ) => Promise<CreditCard>;
  updateCreditCard: (card: CreditCard) => Promise<void>;
  deleteCreditCard: (cardId: string) => Promise<void>;

  // Card Charges
  getCardCharges: (cardId: string) => Promise<CardCharge[]>;
  createCardCharge: (
    cardId: string,
    amount: number,
    category: string,
    statementMonth: string,
    note?: string
  ) => Promise<CardCharge>;
  deleteCardCharge: (chargeId: string) => Promise<void>;
  getCardSummary: (
    cardId: string
  ) => Promise<{ totalUsed: number; charges: CardCharge[] }>;

  // Recurring Expenses
  recurringExpenses: RecurringExpense[];
  createRecurringExpense: (
    title: string,
    category: string,
    amount: number,
    startMonth: string,
    note?: string,
    endMonth?: string
  ) => Promise<RecurringExpense>;
  updateRecurringExpense: (expense: RecurringExpense) => Promise<void>;
  toggleRecurringExpense: (expenseId: string) => Promise<void>;
  deleteRecurringExpense: (expenseId: string) => Promise<void>;

  // Finance Months
  financeMonths: FinanceMonth[];
  getFinanceMonth: (year: number, month: number) => Promise<FinanceMonth | null>;
  ensureMonth: (
    year: number,
    month: number
  ) => Promise<{ financeMonth: FinanceMonth; entriesAdded: number }>;
  getMonthsByYear: (year: number) => Promise<FinanceMonth[]>;

  // Finance Entries
  getFinanceEntries: (monthId: string) => Promise<FinanceEntry[]>;
  createFinanceEntry: (
    monthId: string,
    type: 'income' | 'expense',
    category: string,
    amount: number,
    tag?: string
  ) => Promise<FinanceEntry>;
  deleteFinanceEntry: (entryId: string) => Promise<void>;
  getMonthSummary: (
    monthId: string
  ) => Promise<{ income: number; expenses: number; balance: number }>;
  getYearSummary: (year: number) => Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalBalance: number;
    months: Array<{
      month: number;
      income: number;
      expenses: number;
      balance: number;
    }>;
  }>;

  // Categories
  categories: FinanceCategories;
  updateCategories: (categories: FinanceCategories) => Promise<void>;

  // State
  loading: boolean;
  refreshData: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { account } = useAccount();
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [activeBankAccount, setActiveBankAccountState] =
    useState<BankAccount | null>(null);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(
    []
  );
  const [financeMonths, setFinanceMonths] = useState<FinanceMonth[]>([]);
  const [categories, setCategories] = useState<FinanceCategories>({
    incomeCategories: [],
    expenseCategories: [],
  });

  // Load initial data
  const loadData = useCallback(async () => {
    if (!account) {
      setBankAccounts([]);
      setActiveBankAccountState(null);
      setCreditCards([]);
      setRecurringExpenses([]);
      setFinanceMonths([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load bank accounts
      const accounts = await FinanceStorage.getBankAccounts(account.id);
      setBankAccounts(accounts);

      // Load active bank account
      const active = await FinanceStorage.getActiveBankAccount();
      if (active && accounts.some((a) => a.id === active.id)) {
        setActiveBankAccountState(active);
      } else if (accounts.length > 0) {
        setActiveBankAccountState(accounts[0]);
        await FinanceStorage.setActiveBankAccount(accounts[0]);
      } else {
        setActiveBankAccountState(null);
      }

      // Load categories
      const cats = await FinanceStorage.getFinanceCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [account]);

  // Load data for active bank account
  const loadBankAccountData = useCallback(async () => {
    if (!activeBankAccount) {
      setCreditCards([]);
      setRecurringExpenses([]);
      setFinanceMonths([]);
      return;
    }

    try {
      const [cards, recurring, months] = await Promise.all([
        FinanceStorage.getCreditCards(activeBankAccount.id),
        FinanceStorage.getRecurringExpenses(activeBankAccount.id),
        FinanceStorage.getFinanceMonths(activeBankAccount.id),
      ]);

      setCreditCards(cards);
      setRecurringExpenses(recurring);
      setFinanceMonths(months);
    } catch (error) {
      console.error('Error loading bank account data:', error);
    }
  }, [activeBankAccount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadBankAccountData();
  }, [loadBankAccountData]);

  // Bank Account operations
  const setActiveBankAccount = async (
    bankAccount: BankAccount | null
  ): Promise<void> => {
    await FinanceStorage.setActiveBankAccount(bankAccount);
    setActiveBankAccountState(bankAccount);
  };

  const createBankAccount = async (
    name: string,
    description?: string
  ): Promise<BankAccount> => {
    if (!account) throw new Error('No account selected');
    const newAccount = await FinanceStorage.saveBankAccount(
      account.id,
      name,
      description
    );
    setBankAccounts((prev) => [...prev, newAccount]);
    if (!activeBankAccount) {
      await setActiveBankAccount(newAccount);
    }
    return newAccount;
  };

  const updateBankAccount = async (bankAccount: BankAccount): Promise<void> => {
    const updated = await FinanceStorage.updateBankAccount(bankAccount);
    setBankAccounts((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    if (activeBankAccount?.id === updated.id) {
      setActiveBankAccountState(updated);
    }
  };

  const deleteBankAccount = async (accountId: string): Promise<void> => {
    await FinanceStorage.deleteBankAccount(accountId);
    setBankAccounts((prev) => prev.filter((a) => a.id !== accountId));
    if (activeBankAccount?.id === accountId) {
      const remaining = bankAccounts.filter((a) => a.id !== accountId);
      await setActiveBankAccount(remaining[0] || null);
    }
  };

  // Credit Card operations
  const createCreditCard = async (
    name: string,
    limit: number,
    closeDay: number,
    dueDay: number
  ): Promise<CreditCard> => {
    if (!activeBankAccount) throw new Error('No bank account selected');
    const newCard = await FinanceStorage.saveCreditCard(
      activeBankAccount.id,
      name,
      limit,
      closeDay,
      dueDay
    );
    setCreditCards((prev) => [...prev, newCard]);
    return newCard;
  };

  const updateCreditCard = async (card: CreditCard): Promise<void> => {
    const updated = await FinanceStorage.updateCreditCard(card);
    setCreditCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const deleteCreditCard = async (cardId: string): Promise<void> => {
    await FinanceStorage.deleteCreditCard(cardId);
    setCreditCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  // Card Charge operations
  const getCardCharges = async (cardId: string): Promise<CardCharge[]> => {
    return FinanceStorage.getCardCharges(cardId);
  };

  const createCardCharge = async (
    cardId: string,
    amount: number,
    category: string,
    statementMonth: string,
    note?: string
  ): Promise<CardCharge> => {
    const charge = await FinanceStorage.saveCardCharge(
      cardId,
      amount,
      category,
      statementMonth,
      note
    );

    // Auto-add to current month's entries if charge is for current month
    const currentMonth = getCurrentMonthKey();
    if (statementMonth === currentMonth && activeBankAccount) {
      const [year, month] = currentMonth.split('-').map(Number);
      const financeMonth = await FinanceStorage.getFinanceMonth(
        activeBankAccount.id,
        year,
        month
      );

      if (financeMonth) {
        // Get card name for the tag
        const card = creditCards.find((c) => c.id === cardId);
        const cardName = card?.name || 'Card';

        // Check if entry already exists (to avoid duplicates)
        const existingEntries = await FinanceStorage.getFinanceEntries(financeMonth.id);
        const alreadyExists = existingEntries.some(
          (e) => e.source === 'card' && e.sourceId === charge.id
        );

        if (!alreadyExists) {
          await FinanceStorage.saveFinanceEntry(
            financeMonth.id,
            'expense',
            category,
            amount,
            'card',
            cardName,
            charge.id
          );
        }
      }
    }

    return charge;
  };

  const deleteCardCharge = async (chargeId: string): Promise<void> => {
    await FinanceStorage.deleteCardCharge(chargeId);
  };

  const getCardSummary = async (
    cardId: string
  ): Promise<{ totalUsed: number; charges: CardCharge[] }> => {
    return FinanceStorage.getCardSummary(cardId);
  };

  // Recurring Expense operations
  const createRecurringExpense = async (
    title: string,
    category: string,
    amount: number,
    startMonth: string,
    note?: string,
    endMonth?: string
  ): Promise<RecurringExpense> => {
    if (!activeBankAccount) throw new Error('No bank account selected');
    const newExpense = await FinanceStorage.saveRecurringExpense(
      activeBankAccount.id,
      title,
      category,
      amount,
      startMonth,
      note,
      endMonth
    );
    setRecurringExpenses((prev) => [...prev, newExpense]);

    // Auto-add to current month's entries if expense starts in current month
    const currentMonth = getCurrentMonthKey();
    if (startMonth === currentMonth) {
      const [year, month] = currentMonth.split('-').map(Number);
      const financeMonth = await FinanceStorage.getFinanceMonth(
        activeBankAccount.id,
        year,
        month
      );

      if (financeMonth) {
        // Check if entry already exists (to avoid duplicates)
        const existingEntries = await FinanceStorage.getFinanceEntries(financeMonth.id);
        const alreadyExists = existingEntries.some(
          (e) => e.source === 'recurring' && e.sourceId === newExpense.id
        );

        if (!alreadyExists) {
          await FinanceStorage.saveFinanceEntry(
            financeMonth.id,
            'expense',
            category,
            amount,
            'recurring',
            title,
            newExpense.id
          );
        }
      }
    }

    return newExpense;
  };

  const updateRecurringExpense = async (
    expense: RecurringExpense
  ): Promise<void> => {
    const updated = await FinanceStorage.updateRecurringExpense(expense);
    setRecurringExpenses((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  };

  const toggleRecurringExpense = async (expenseId: string): Promise<void> => {
    const updated = await FinanceStorage.toggleRecurringExpense(expenseId);
    setRecurringExpenses((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  };

  const deleteRecurringExpense = async (expenseId: string): Promise<void> => {
    await FinanceStorage.deleteRecurringExpense(expenseId);
    setRecurringExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  // Finance Month operations
  const getFinanceMonth = async (
    year: number,
    month: number
  ): Promise<FinanceMonth | null> => {
    if (!activeBankAccount) return null;
    return FinanceStorage.getFinanceMonth(activeBankAccount.id, year, month);
  };

  const ensureMonth = async (
    year: number,
    month: number
  ): Promise<{ financeMonth: FinanceMonth; entriesAdded: number }> => {
    if (!activeBankAccount) throw new Error('No bank account selected');
    const result = await FinanceStorage.ensureMonthWithAutoPopulate(
      activeBankAccount.id,
      year,
      month,
      account?.salary
    );

    // Update local state
    setFinanceMonths((prev) => {
      const exists = prev.some((m) => m.id === result.financeMonth.id);
      if (exists) return prev;
      return [...prev, result.financeMonth].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    });

    return result;
  };

  const getMonthsByYear = async (year: number): Promise<FinanceMonth[]> => {
    if (!activeBankAccount) return [];
    return FinanceStorage.getFinanceMonthsByYear(activeBankAccount.id, year);
  };

  // Finance Entry operations
  const getFinanceEntries = async (monthId: string): Promise<FinanceEntry[]> => {
    return FinanceStorage.getFinanceEntries(monthId);
  };

  const createFinanceEntry = async (
    monthId: string,
    type: 'income' | 'expense',
    category: string,
    amount: number,
    tag?: string
  ): Promise<FinanceEntry> => {
    return FinanceStorage.saveFinanceEntry(
      monthId,
      type,
      category,
      amount,
      'manual',
      tag
    );
  };

  const deleteFinanceEntry = async (entryId: string): Promise<void> => {
    await FinanceStorage.deleteFinanceEntry(entryId);
  };

  const getMonthSummary = async (
    monthId: string
  ): Promise<{ income: number; expenses: number; balance: number }> => {
    return FinanceStorage.getMonthSummary(monthId);
  };

  const getYearSummary = async (year: number) => {
    if (!activeBankAccount) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        totalBalance: 0,
        months: [],
      };
    }
    return FinanceStorage.getYearSummary(activeBankAccount.id, year);
  };

  // Category operations
  const updateCategories = async (
    newCategories: FinanceCategories
  ): Promise<void> => {
    await FinanceStorage.saveFinanceCategories(newCategories);
    setCategories(newCategories);
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
    await loadBankAccountData();
  };

  return (
    <FinanceContext.Provider
      value={{
        bankAccounts,
        activeBankAccount,
        setActiveBankAccount,
        createBankAccount,
        updateBankAccount,
        deleteBankAccount,
        creditCards,
        createCreditCard,
        updateCreditCard,
        deleteCreditCard,
        getCardCharges,
        createCardCharge,
        deleteCardCharge,
        getCardSummary,
        recurringExpenses,
        createRecurringExpense,
        updateRecurringExpense,
        toggleRecurringExpense,
        deleteRecurringExpense,
        financeMonths,
        getFinanceMonth,
        ensureMonth,
        getMonthsByYear,
        getFinanceEntries,
        createFinanceEntry,
        deleteFinanceEntry,
        getMonthSummary,
        getYearSummary,
        categories,
        updateCategories,
        loading,
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
