import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BankAccount,
  CreditCard,
  CardCharge,
  RecurringExpense,
  FinanceMonth,
  FinanceEntry,
  FinanceCategories,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
  generateId,
  generateSlug,
} from '@/types/finance';

// Storage keys
const KEYS = {
  BANK_ACCOUNTS: '@life_manager_bank_accounts',
  ACTIVE_BANK_ACCOUNT: '@life_manager_active_bank_account',
  CREDIT_CARDS: '@life_manager_credit_cards',
  CARD_CHARGES: '@life_manager_card_charges',
  RECURRING_EXPENSES: '@life_manager_recurring_expenses',
  FINANCE_MONTHS: '@life_manager_finance_months',
  FINANCE_ENTRIES: '@life_manager_finance_entries',
  FINANCE_CATEGORIES: '@life_manager_finance_categories',
};

// ============ Bank Accounts ============

export async function getBankAccounts(userId: string): Promise<BankAccount[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.BANK_ACCOUNTS);
    if (!data) return [];
    const accounts: BankAccount[] = JSON.parse(data);
    return accounts.filter((a) => a.userId === userId);
  } catch (error) {
    console.error('Error getting bank accounts:', error);
    return [];
  }
}

export async function saveBankAccount(
  userId: string,
  name: string,
  description?: string
): Promise<BankAccount> {
  const now = new Date().toISOString();
  const newAccount: BankAccount = {
    id: generateId(),
    userId,
    name,
    slug: generateSlug(name),
    description,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.BANK_ACCOUNTS);
    const accounts: BankAccount[] = data ? JSON.parse(data) : [];
    accounts.push(newAccount);
    await AsyncStorage.setItem(KEYS.BANK_ACCOUNTS, JSON.stringify(accounts));
    return newAccount;
  } catch (error) {
    console.error('Error saving bank account:', error);
    throw error;
  }
}

export async function updateBankAccount(
  account: BankAccount
): Promise<BankAccount> {
  try {
    const data = await AsyncStorage.getItem(KEYS.BANK_ACCOUNTS);
    const accounts: BankAccount[] = data ? JSON.parse(data) : [];
    const index = accounts.findIndex((a) => a.id === account.id);
    if (index === -1) throw new Error('Account not found');

    accounts[index] = { ...account, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.BANK_ACCOUNTS, JSON.stringify(accounts));
    return accounts[index];
  } catch (error) {
    console.error('Error updating bank account:', error);
    throw error;
  }
}

export async function deleteBankAccount(accountId: string): Promise<void> {
  try {
    // Delete the account
    const data = await AsyncStorage.getItem(KEYS.BANK_ACCOUNTS);
    const accounts: BankAccount[] = data ? JSON.parse(data) : [];
    const filtered = accounts.filter((a) => a.id !== accountId);
    await AsyncStorage.setItem(KEYS.BANK_ACCOUNTS, JSON.stringify(filtered));

    // Delete related data
    await deleteCreditCardsByAccount(accountId);
    await deleteRecurringExpensesByAccount(accountId);
    await deleteFinanceMonthsByAccount(accountId);

    // Clear active if it was this account
    const active = await getActiveBankAccount();
    if (active?.id === accountId) {
      await AsyncStorage.removeItem(KEYS.ACTIVE_BANK_ACCOUNT);
    }
  } catch (error) {
    console.error('Error deleting bank account:', error);
    throw error;
  }
}

export async function getActiveBankAccount(): Promise<BankAccount | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.ACTIVE_BANK_ACCOUNT);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting active bank account:', error);
    return null;
  }
}

export async function setActiveBankAccount(
  account: BankAccount | null
): Promise<void> {
  try {
    if (account) {
      await AsyncStorage.setItem(
        KEYS.ACTIVE_BANK_ACCOUNT,
        JSON.stringify(account)
      );
    } else {
      await AsyncStorage.removeItem(KEYS.ACTIVE_BANK_ACCOUNT);
    }
  } catch (error) {
    console.error('Error setting active bank account:', error);
    throw error;
  }
}

// ============ Credit Cards ============

export async function getCreditCards(accountId: string): Promise<CreditCard[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CREDIT_CARDS);
    if (!data) return [];
    const cards: CreditCard[] = JSON.parse(data);
    return cards.filter((c) => c.accountId === accountId);
  } catch (error) {
    console.error('Error getting credit cards:', error);
    return [];
  }
}

export async function saveCreditCard(
  accountId: string,
  name: string,
  limit: number,
  closeDay: number,
  dueDay: number
): Promise<CreditCard> {
  const now = new Date().toISOString();
  const newCard: CreditCard = {
    id: generateId(),
    accountId,
    name,
    limit,
    closeDay,
    dueDay,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.CREDIT_CARDS);
    const cards: CreditCard[] = data ? JSON.parse(data) : [];
    cards.push(newCard);
    await AsyncStorage.setItem(KEYS.CREDIT_CARDS, JSON.stringify(cards));
    return newCard;
  } catch (error) {
    console.error('Error saving credit card:', error);
    throw error;
  }
}

export async function updateCreditCard(card: CreditCard): Promise<CreditCard> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CREDIT_CARDS);
    const cards: CreditCard[] = data ? JSON.parse(data) : [];
    const index = cards.findIndex((c) => c.id === card.id);
    if (index === -1) throw new Error('Card not found');

    cards[index] = { ...card, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.CREDIT_CARDS, JSON.stringify(cards));
    return cards[index];
  } catch (error) {
    console.error('Error updating credit card:', error);
    throw error;
  }
}

export async function deleteCreditCard(cardId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CREDIT_CARDS);
    const cards: CreditCard[] = data ? JSON.parse(data) : [];
    const filtered = cards.filter((c) => c.id !== cardId);
    await AsyncStorage.setItem(KEYS.CREDIT_CARDS, JSON.stringify(filtered));

    // Delete related charges
    await deleteCardChargesByCard(cardId);
  } catch (error) {
    console.error('Error deleting credit card:', error);
    throw error;
  }
}

async function deleteCreditCardsByAccount(accountId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CREDIT_CARDS);
    const cards: CreditCard[] = data ? JSON.parse(data) : [];
    const toDelete = cards.filter((c) => c.accountId === accountId);
    const filtered = cards.filter((c) => c.accountId !== accountId);
    await AsyncStorage.setItem(KEYS.CREDIT_CARDS, JSON.stringify(filtered));

    // Delete charges for each card
    for (const card of toDelete) {
      await deleteCardChargesByCard(card.id);
    }
  } catch (error) {
    console.error('Error deleting credit cards by account:', error);
  }
}

// ============ Card Charges ============

export async function getCardCharges(cardId: string): Promise<CardCharge[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CARD_CHARGES);
    if (!data) return [];
    const charges: CardCharge[] = JSON.parse(data);
    return charges.filter((c) => c.cardId === cardId);
  } catch (error) {
    console.error('Error getting card charges:', error);
    return [];
  }
}

export async function getCardChargesByMonth(
  cardId: string,
  statementMonth: string
): Promise<CardCharge[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CARD_CHARGES);
    if (!data) return [];
    const charges: CardCharge[] = JSON.parse(data);
    return charges.filter(
      (c) => c.cardId === cardId && c.statementMonth === statementMonth
    );
  } catch (error) {
    console.error('Error getting card charges by month:', error);
    return [];
  }
}

export async function getAllCardChargesByMonth(
  accountId: string,
  statementMonth: string
): Promise<(CardCharge & { cardName: string })[]> {
  try {
    const cards = await getCreditCards(accountId);
    const chargesData = await AsyncStorage.getItem(KEYS.CARD_CHARGES);
    if (!chargesData) return [];

    const charges: CardCharge[] = JSON.parse(chargesData);
    const cardIds = new Set(cards.map((c) => c.id));
    const cardMap = new Map(cards.map((c) => [c.id, c.name]));

    return charges
      .filter((c) => cardIds.has(c.cardId) && c.statementMonth === statementMonth)
      .map((c) => ({ ...c, cardName: cardMap.get(c.cardId) || 'Unknown' }));
  } catch (error) {
    console.error('Error getting all card charges by month:', error);
    return [];
  }
}

export async function saveCardCharge(
  cardId: string,
  amount: number,
  category: string,
  statementMonth: string,
  note?: string
): Promise<CardCharge> {
  const newCharge: CardCharge = {
    id: generateId(),
    cardId,
    amount,
    category,
    statementMonth,
    note,
    createdAt: new Date().toISOString(),
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.CARD_CHARGES);
    const charges: CardCharge[] = data ? JSON.parse(data) : [];
    charges.push(newCharge);
    await AsyncStorage.setItem(KEYS.CARD_CHARGES, JSON.stringify(charges));
    return newCharge;
  } catch (error) {
    console.error('Error saving card charge:', error);
    throw error;
  }
}

export async function deleteCardCharge(chargeId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CARD_CHARGES);
    const charges: CardCharge[] = data ? JSON.parse(data) : [];
    const filtered = charges.filter((c) => c.id !== chargeId);
    await AsyncStorage.setItem(KEYS.CARD_CHARGES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting card charge:', error);
    throw error;
  }
}

async function deleteCardChargesByCard(cardId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.CARD_CHARGES);
    const charges: CardCharge[] = data ? JSON.parse(data) : [];
    const filtered = charges.filter((c) => c.cardId !== cardId);
    await AsyncStorage.setItem(KEYS.CARD_CHARGES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting card charges by card:', error);
  }
}

// ============ Recurring Expenses ============

export async function getRecurringExpenses(
  accountId: string
): Promise<RecurringExpense[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECURRING_EXPENSES);
    if (!data) return [];
    const expenses: RecurringExpense[] = JSON.parse(data);
    return expenses.filter((e) => e.accountId === accountId);
  } catch (error) {
    console.error('Error getting recurring expenses:', error);
    return [];
  }
}

export async function getActiveRecurringExpenses(
  accountId: string,
  monthKey: string
): Promise<RecurringExpense[]> {
  try {
    const expenses = await getRecurringExpenses(accountId);
    return expenses.filter((e) => {
      if (!e.isActive) return false;
      if (e.startMonth > monthKey) return false;
      if (e.endMonth && e.endMonth < monthKey) return false;
      return true;
    });
  } catch (error) {
    console.error('Error getting active recurring expenses:', error);
    return [];
  }
}

export async function saveRecurringExpense(
  accountId: string,
  title: string,
  category: string,
  amount: number,
  startMonth: string,
  note?: string,
  endMonth?: string
): Promise<RecurringExpense> {
  const now = new Date().toISOString();
  const newExpense: RecurringExpense = {
    id: generateId(),
    accountId,
    title,
    category,
    amount,
    startMonth,
    endMonth,
    isActive: true,
    note,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.RECURRING_EXPENSES);
    const expenses: RecurringExpense[] = data ? JSON.parse(data) : [];
    expenses.push(newExpense);
    await AsyncStorage.setItem(
      KEYS.RECURRING_EXPENSES,
      JSON.stringify(expenses)
    );
    return newExpense;
  } catch (error) {
    console.error('Error saving recurring expense:', error);
    throw error;
  }
}

export async function updateRecurringExpense(
  expense: RecurringExpense
): Promise<RecurringExpense> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECURRING_EXPENSES);
    const expenses: RecurringExpense[] = data ? JSON.parse(data) : [];
    const index = expenses.findIndex((e) => e.id === expense.id);
    if (index === -1) throw new Error('Recurring expense not found');

    expenses[index] = { ...expense, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(
      KEYS.RECURRING_EXPENSES,
      JSON.stringify(expenses)
    );
    return expenses[index];
  } catch (error) {
    console.error('Error updating recurring expense:', error);
    throw error;
  }
}

export async function toggleRecurringExpense(
  expenseId: string
): Promise<RecurringExpense> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECURRING_EXPENSES);
    const expenses: RecurringExpense[] = data ? JSON.parse(data) : [];
    const index = expenses.findIndex((e) => e.id === expenseId);
    if (index === -1) throw new Error('Recurring expense not found');

    expenses[index].isActive = !expenses[index].isActive;
    expenses[index].updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(
      KEYS.RECURRING_EXPENSES,
      JSON.stringify(expenses)
    );
    return expenses[index];
  } catch (error) {
    console.error('Error toggling recurring expense:', error);
    throw error;
  }
}

export async function deleteRecurringExpense(expenseId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECURRING_EXPENSES);
    const expenses: RecurringExpense[] = data ? JSON.parse(data) : [];
    const filtered = expenses.filter((e) => e.id !== expenseId);
    await AsyncStorage.setItem(
      KEYS.RECURRING_EXPENSES,
      JSON.stringify(filtered)
    );
  } catch (error) {
    console.error('Error deleting recurring expense:', error);
    throw error;
  }
}

async function deleteRecurringExpensesByAccount(
  accountId: string
): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECURRING_EXPENSES);
    const expenses: RecurringExpense[] = data ? JSON.parse(data) : [];
    const filtered = expenses.filter((e) => e.accountId !== accountId);
    await AsyncStorage.setItem(
      KEYS.RECURRING_EXPENSES,
      JSON.stringify(filtered)
    );
  } catch (error) {
    console.error('Error deleting recurring expenses by account:', error);
  }
}

// ============ Finance Months ============

export async function getFinanceMonths(
  accountId: string
): Promise<FinanceMonth[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FINANCE_MONTHS);
    if (!data) return [];
    const months: FinanceMonth[] = JSON.parse(data);
    return months
      .filter((m) => m.accountId === accountId)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  } catch (error) {
    console.error('Error getting finance months:', error);
    return [];
  }
}

export async function getFinanceMonthsByYear(
  accountId: string,
  year: number
): Promise<FinanceMonth[]> {
  try {
    const months = await getFinanceMonths(accountId);
    return months.filter((m) => m.year === year);
  } catch (error) {
    console.error('Error getting finance months by year:', error);
    return [];
  }
}

export async function getFinanceMonth(
  accountId: string,
  year: number,
  month: number
): Promise<FinanceMonth | null> {
  try {
    const months = await getFinanceMonths(accountId);
    return months.find((m) => m.year === year && m.month === month) || null;
  } catch (error) {
    console.error('Error getting finance month:', error);
    return null;
  }
}

export async function createFinanceMonth(
  accountId: string,
  year: number,
  month: number
): Promise<FinanceMonth> {
  const now = new Date().toISOString();
  const newMonth: FinanceMonth = {
    id: generateId(),
    accountId,
    year,
    month,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.FINANCE_MONTHS);
    const months: FinanceMonth[] = data ? JSON.parse(data) : [];

    // Check if already exists
    const existing = months.find(
      (m) => m.accountId === accountId && m.year === year && m.month === month
    );
    if (existing) return existing;

    months.push(newMonth);
    await AsyncStorage.setItem(KEYS.FINANCE_MONTHS, JSON.stringify(months));
    return newMonth;
  } catch (error) {
    console.error('Error creating finance month:', error);
    throw error;
  }
}

async function deleteFinanceMonthsByAccount(accountId: string): Promise<void> {
  try {
    // Delete months
    const monthsData = await AsyncStorage.getItem(KEYS.FINANCE_MONTHS);
    const months: FinanceMonth[] = monthsData ? JSON.parse(monthsData) : [];
    const toDelete = months.filter((m) => m.accountId === accountId);
    const filteredMonths = months.filter((m) => m.accountId !== accountId);
    await AsyncStorage.setItem(
      KEYS.FINANCE_MONTHS,
      JSON.stringify(filteredMonths)
    );

    // Delete entries for each month
    for (const month of toDelete) {
      await deleteFinanceEntriesByMonth(month.id);
    }
  } catch (error) {
    console.error('Error deleting finance months by account:', error);
  }
}

// ============ Finance Entries ============

export async function getFinanceEntries(
  monthId: string
): Promise<FinanceEntry[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FINANCE_ENTRIES);
    if (!data) return [];
    const entries: FinanceEntry[] = JSON.parse(data);
    return entries.filter((e) => e.monthId === monthId);
  } catch (error) {
    console.error('Error getting finance entries:', error);
    return [];
  }
}

export async function getFinanceEntriesByType(
  monthId: string,
  type: 'income' | 'expense'
): Promise<FinanceEntry[]> {
  try {
    const entries = await getFinanceEntries(monthId);
    return entries.filter((e) => e.type === type);
  } catch (error) {
    console.error('Error getting finance entries by type:', error);
    return [];
  }
}

export async function saveFinanceEntry(
  monthId: string,
  type: 'income' | 'expense',
  category: string,
  amount: number,
  source: 'manual' | 'card' | 'recurring' = 'manual',
  tag?: string,
  sourceId?: string
): Promise<FinanceEntry> {
  const newEntry: FinanceEntry = {
    id: generateId(),
    monthId,
    type,
    category,
    amount,
    tag,
    source,
    sourceId,
    createdAt: new Date().toISOString(),
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.FINANCE_ENTRIES);
    const entries: FinanceEntry[] = data ? JSON.parse(data) : [];
    entries.push(newEntry);
    await AsyncStorage.setItem(KEYS.FINANCE_ENTRIES, JSON.stringify(entries));
    return newEntry;
  } catch (error) {
    console.error('Error saving finance entry:', error);
    throw error;
  }
}

export async function deleteFinanceEntry(entryId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FINANCE_ENTRIES);
    const entries: FinanceEntry[] = data ? JSON.parse(data) : [];
    const filtered = entries.filter((e) => e.id !== entryId);
    await AsyncStorage.setItem(KEYS.FINANCE_ENTRIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting finance entry:', error);
    throw error;
  }
}

async function deleteFinanceEntriesByMonth(monthId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FINANCE_ENTRIES);
    const entries: FinanceEntry[] = data ? JSON.parse(data) : [];
    const filtered = entries.filter((e) => e.monthId !== monthId);
    await AsyncStorage.setItem(KEYS.FINANCE_ENTRIES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting finance entries by month:', error);
  }
}

// ============ Categories ============

export async function getFinanceCategories(): Promise<FinanceCategories> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FINANCE_CATEGORIES);
    if (!data) {
      return {
        incomeCategories: DEFAULT_INCOME_CATEGORIES,
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting finance categories:', error);
    return {
      incomeCategories: DEFAULT_INCOME_CATEGORIES,
      expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
    };
  }
}

export async function saveFinanceCategories(
  categories: FinanceCategories
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      KEYS.FINANCE_CATEGORIES,
      JSON.stringify(categories)
    );
  } catch (error) {
    console.error('Error saving finance categories:', error);
    throw error;
  }
}

// ============ Auto-populate Month ============

export async function ensureMonthWithAutoPopulate(
  accountId: string,
  year: number,
  month: number,
  salary?: number
): Promise<{ financeMonth: FinanceMonth; entriesAdded: number }> {
  try {
    // Get or create month
    let financeMonth = await getFinanceMonth(accountId, year, month);
    const isNew = !financeMonth;

    if (!financeMonth) {
      financeMonth = await createFinanceMonth(accountId, year, month);
    }

    if (!isNew) {
      return { financeMonth, entriesAdded: 0 };
    }

    // Auto-populate for new months
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    let entriesAdded = 0;

    // Add salary as income (if set)
    if (salary && salary > 0) {
      const existingEntries = await getFinanceEntries(financeMonth.id);
      const salaryExists = existingEntries.some(
        (e) => e.source === 'recurring' && e.tag === 'salary'
      );

      if (!salaryExists) {
        await saveFinanceEntry(
          financeMonth.id,
          'income',
          'salary',
          salary,
          'recurring',
          'Salary'
        );
        entriesAdded++;
      }
    }

    // Add card charges
    const cardCharges = await getAllCardChargesByMonth(accountId, monthKey);
    for (const charge of cardCharges) {
      const existingEntries = await getFinanceEntries(financeMonth.id);
      const alreadyExists = existingEntries.some(
        (e) => e.source === 'card' && e.sourceId === charge.id
      );

      if (!alreadyExists) {
        await saveFinanceEntry(
          financeMonth.id,
          'expense',
          charge.category,
          charge.amount,
          'card',
          charge.cardName,
          charge.id
        );
        entriesAdded++;
      }
    }

    // Add recurring expenses
    const recurring = await getActiveRecurringExpenses(accountId, monthKey);
    for (const expense of recurring) {
      const existingEntries = await getFinanceEntries(financeMonth.id);
      const alreadyExists = existingEntries.some(
        (e) => e.source === 'recurring' && e.sourceId === expense.id
      );

      if (!alreadyExists) {
        await saveFinanceEntry(
          financeMonth.id,
          'expense',
          expense.category,
          expense.amount,
          'recurring',
          expense.title,
          expense.id
        );
        entriesAdded++;
      }
    }

    return { financeMonth, entriesAdded };
  } catch (error) {
    console.error('Error ensuring month with auto-populate:', error);
    throw error;
  }
}

// ============ Summary Calculations ============

export async function getMonthSummary(
  monthId: string
): Promise<{ income: number; expenses: number; balance: number }> {
  try {
    const entries = await getFinanceEntries(monthId);
    const income = entries
      .filter((e) => e.type === 'income')
      .reduce((sum, e) => sum + e.amount, 0);
    const expenses = entries
      .filter((e) => e.type === 'expense')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  } catch (error) {
    console.error('Error getting month summary:', error);
    return { income: 0, expenses: 0, balance: 0 };
  }
}

export async function getYearSummary(
  accountId: string,
  year: number
): Promise<{
  totalIncome: number;
  totalExpenses: number;
  totalBalance: number;
  months: Array<{
    month: number;
    income: number;
    expenses: number;
    balance: number;
  }>;
}> {
  try {
    const months = await getFinanceMonthsByYear(accountId, year);
    const monthSummaries = [];
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const financeMonth of months) {
      const summary = await getMonthSummary(financeMonth.id);
      monthSummaries.push({
        month: financeMonth.month,
        ...summary,
      });
      totalIncome += summary.income;
      totalExpenses += summary.expenses;
    }

    return {
      totalIncome,
      totalExpenses,
      totalBalance: totalIncome - totalExpenses,
      months: monthSummaries.sort((a, b) => a.month - b.month),
    };
  } catch (error) {
    console.error('Error getting year summary:', error);
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalBalance: 0,
      months: [],
    };
  }
}

export async function getCardSummary(
  cardId: string
): Promise<{ totalUsed: number; charges: CardCharge[] }> {
  try {
    const charges = await getCardCharges(cardId);
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Only count unpaid charges (current month and future)
    const unpaidCharges = charges.filter((c) => c.statementMonth >= currentMonthKey);
    const totalUsed = unpaidCharges.reduce((sum, c) => sum + c.amount, 0);

    return { totalUsed, charges };
  } catch (error) {
    console.error('Error getting card summary:', error);
    return { totalUsed: 0, charges: [] };
  }
}
