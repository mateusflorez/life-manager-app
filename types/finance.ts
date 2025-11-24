// Finance module types

export type BankAccountIcon =
  | 'building.columns'
  | 'creditcard.fill'
  | 'banknote.fill'
  | 'dollarsign.circle.fill'
  | 'chart.pie.fill'
  | 'star.fill'
  | 'house.fill'
  | 'briefcase.fill';

export type BankAccountColor =
  | 'green'
  | 'blue'
  | 'purple'
  | 'orange'
  | 'pink'
  | 'cyan'
  | 'yellow'
  | 'red';

export const BANK_ACCOUNT_ICONS: BankAccountIcon[] = [
  'building.columns',
  'creditcard.fill',
  'banknote.fill',
  'dollarsign.circle.fill',
  'chart.pie.fill',
  'star.fill',
  'house.fill',
  'briefcase.fill',
];

export const BANK_ACCOUNT_COLORS: {
  key: BankAccountColor;
  gradient: [string, string];
}[] = [
  { key: 'green', gradient: ['#10B981', '#059669'] },
  { key: 'blue', gradient: ['#3B82F6', '#2563EB'] },
  { key: 'purple', gradient: ['#8B5CF6', '#7C3AED'] },
  { key: 'orange', gradient: ['#F97316', '#EA580C'] },
  { key: 'pink', gradient: ['#EC4899', '#DB2777'] },
  { key: 'cyan', gradient: ['#06B6D4', '#0891B2'] },
  { key: 'yellow', gradient: ['#F59E0B', '#D97706'] },
  { key: 'red', gradient: ['#EF4444', '#DC2626'] },
];

export function getAccountGradient(color?: BankAccountColor): [string, string] {
  const found = BANK_ACCOUNT_COLORS.find((c) => c.key === color);
  return found?.gradient || BANK_ACCOUNT_COLORS[0].gradient;
}

export type BankAccount = {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  salary?: number;
  icon?: BankAccountIcon;
  color?: BankAccountColor;
  createdAt: string;
  updatedAt: string;
};

export type CreditCard = {
  id: string;
  accountId: string;
  name: string;
  limit: number;
  closeDay: number; // 1-31
  dueDay: number; // 1-31
  createdAt: string;
  updatedAt: string;
};

export type CardCharge = {
  id: string;
  cardId: string;
  amount: number;
  category: string;
  note?: string;
  statementMonth: string; // "2025-11"
  createdAt: string;
};

export type RecurringExpense = {
  id: string;
  accountId: string;
  title: string;
  category: string;
  amount: number;
  startMonth: string; // "2025-01"
  endMonth?: string; // null = indefinite
  isActive: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceMonth = {
  id: string;
  accountId: string;
  year: number;
  month: number; // 1-12
  createdAt: string;
  updatedAt: string;
};

export type FinanceEntryType = 'income' | 'expense';
export type FinanceEntrySource = 'manual' | 'card' | 'recurring';

export type FinanceEntry = {
  id: string;
  monthId: string;
  type: FinanceEntryType;
  category: string;
  amount: number;
  tag?: string;
  source: FinanceEntrySource;
  sourceId?: string; // cardChargeId or recurringExpenseId
  createdAt: string;
};

export type FinanceCategories = {
  incomeCategories: string[];
  expenseCategories: string[];
};

// Default categories
export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Refunds',
  'Other',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Health',
  'Education',
  'Entertainment',
  'Shopping',
  'Subscriptions',
  'Bills',
  'Other',
];

// Helper to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Helper to get current month key (YYYY-MM)
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to get next month key (YYYY-MM)
export function getNextMonthKey(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const year = nextMonth.getFullYear();
  const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to generate month options for selection (from current month to N months ahead)
export function getMonthOptions(monthsAhead: number = 6): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i <= monthsAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    options.push(`${year}-${month}`);
  }
  return options;
}

// Helper to add months to a month key (YYYY-MM)
export function addMonthsToKey(monthKey: string, monthsToAdd: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1 + monthsToAdd, 1);
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  return `${newYear}-${newMonth}`;
}

// Helper to format month key to display
export function formatMonthKey(monthKey: string, language: 'en' | 'pt'): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

// Helper to get month name
export function getMonthName(month: number, language: 'en' | 'pt'): string {
  const date = new Date(2000, month - 1);
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    month: 'long',
  });
}

// Category translations
const CATEGORY_TRANSLATIONS: Record<string, { en: string; pt: string }> = {
  // Income categories
  Salary: { en: 'Salary', pt: 'Salário' },
  Freelance: { en: 'Freelance', pt: 'Freelance' },
  Investments: { en: 'Investments', pt: 'Investimentos' },
  Gifts: { en: 'Gifts', pt: 'Presentes' },
  Refunds: { en: 'Refunds', pt: 'Reembolsos' },
  // Expense categories
  Housing: { en: 'Housing', pt: 'Moradia' },
  Food: { en: 'Food', pt: 'Alimentação' },
  Transport: { en: 'Transport', pt: 'Transporte' },
  Health: { en: 'Health', pt: 'Saúde' },
  Education: { en: 'Education', pt: 'Educação' },
  Entertainment: { en: 'Entertainment', pt: 'Lazer' },
  Shopping: { en: 'Shopping', pt: 'Compras' },
  Subscriptions: { en: 'Subscriptions', pt: 'Assinaturas' },
  Bills: { en: 'Bills', pt: 'Contas' },
  Other: { en: 'Other', pt: 'Outros' },
};

// Helper to translate category
export function translateCategory(category: string, language: 'en' | 'pt'): string {
  const translation = CATEGORY_TRANSLATIONS[category];
  if (translation) {
    return translation[language];
  }
  return category;
}
