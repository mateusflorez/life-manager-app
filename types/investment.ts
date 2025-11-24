// Investment module types

export type Investment = {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
};

export type MovementType = 'deposit' | 'dividend';

export type InvestmentMovement = {
  id: string;
  investmentId: string;
  amount: number; // Delta amount (can be negative for withdrawals)
  date: string; // YYYY-MM-DD
  tags: string[]; // Optional tags like "bonus", "initial"
  movementType: MovementType; // 'deposit' for contributions, 'dividend' for earnings
  createdAt: string;
};

// Chart data point for investment trends
export type InvestmentChartPoint = {
  month: string; // "MMM YYYY"
  monthKey: string; // "YYYY-MM"
  total: number;
};

// Investment with calculated totals
export type InvestmentWithTotal = Investment & {
  total: number;
  movements: InvestmentMovement[];
  lastMovement?: InvestmentMovement & { percentChange: number | null };
};

// Palette for chart colors
export const INVESTMENT_COLORS = [
  '#36A2EB',
  '#FF6384',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#60A917',
  '#E64A19',
];

// Helper to generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Helper to get today's date as YYYY-MM-DD
export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get current month key (YYYY-MM)
export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Helper to format date for display (DD/MM/YYYY)
export function formatDate(dateStr: string, language: 'en' | 'pt'): string {
  const [year, month, day] = dateStr.split('-');
  if (language === 'pt') {
    return `${day}/${month}/${year}`;
  }
  return `${month}/${day}/${year}`;
}

// Helper to format month key for display
export function formatMonthKey(monthKey: string, language: 'en' | 'pt'): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', {
    month: 'short',
    year: 'numeric',
  });
}

// Helper to calculate percentage change
export function calculatePercentChange(
  amount: number,
  previousTotal: number
): number | null {
  if (Math.abs(previousTotal) < 0.00001) return null;
  return (amount / previousTotal) * 100;
}

// Helper to format percentage change
export function formatPercentChange(percent: number | null): string {
  if (percent === null) return '';
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

// Helper to generate tag slug from text
export function generateTagSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper to get last N months for chart
export function getLast12Months(): { monthKey: string; label: string }[] {
  const months: { monthKey: string; label: string }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}-${month}`;
    const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    months.push({ monthKey, label });
  }

  return months;
}

// Calculate running totals for movements
export function calculateMovementTotals(
  movements: InvestmentMovement[]
): (InvestmentMovement & { previousTotal: number; newTotal: number })[] {
  // Sort by date
  const sorted = [...movements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningTotal = 0;
  return sorted.map((movement) => {
    const previousTotal = runningTotal;
    runningTotal += movement.amount;
    return {
      ...movement,
      previousTotal,
      newTotal: runningTotal,
    };
  });
}

// Calculate chart data for investments (last 12 months trend)
export function calculateChartData(
  investments: InvestmentWithTotal[]
): { labels: string[]; datasets: { name: string; data: number[]; color: string }[] } {
  const months = getLast12Months();
  const labels = months.map((m) => m.label);

  const datasets = investments.map((inv, idx) => {
    const movementsWithTotals = calculateMovementTotals(inv.movements);

    // For each month, find the running total at end of that month
    const data = months.map((month) => {
      const endOfMonth = `${month.monthKey}-31`;
      let total = 0;

      for (const m of movementsWithTotals) {
        if (m.date <= endOfMonth) {
          total = m.newTotal;
        }
      }

      return Number(total.toFixed(2));
    });

    return {
      name: inv.name,
      data,
      color: inv.color || INVESTMENT_COLORS[idx % INVESTMENT_COLORS.length],
    };
  });

  return { labels, datasets };
}

// Investment translations
export const INVESTMENT_TRANSLATIONS = {
  en: {
    investments: 'Investments',
    newInvestment: 'New Investment',
    totalPortfolio: 'Total Portfolio',
    totalInvested: 'Total Invested',
    lastContribution: 'Last contribution',
    addContribution: 'Add Contribution',
    newTotalValue: 'New total value',
    optionalTag: 'Tag (optional)',
    contributionTrend: 'Contribution Trend (12 months)',
    noInvestments: 'No investments yet',
    createFirstInvestment: 'Create your first investment to start tracking',
    investmentName: 'Investment name',
    description: 'Description (optional)',
    initialValue: 'Initial value (optional)',
    create: 'Create',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    movements: 'Movements',
    noMovements: 'No movements yet',
    on: 'on',
    vsLastTotal: 'vs last total',
    enterNewTotal: 'Enter the new total value',
    valueMatchesCurrent: 'Value matches current total',
    saving: 'Saving...',
    contributionAdded: 'Contribution added!',
    errorSaving: 'Error saving contribution',
    confirmDelete: 'Are you sure you want to delete this investment?',
    thisMonth: 'this month',
    investment: 'investment',
    investmentsCount: 'investments',
    movementType: 'Type',
    deposit: 'Deposit',
    dividend: 'Dividend',
    editMovement: 'Edit Movement',
    amount: 'Amount',
    date: 'Date',
    save: 'Save',
    movementUpdated: 'Movement updated!',
    errorUpdating: 'Error updating movement',
    editInvestment: 'Edit Investment',
    color: 'Color',
    investmentUpdated: 'Investment updated!',
    errorUpdatingInvestment: 'Error updating investment',
  },
  pt: {
    investments: 'Investimentos',
    newInvestment: 'Novo Investimento',
    totalPortfolio: 'Portfólio Total',
    totalInvested: 'Total Investido',
    lastContribution: 'Último aporte',
    addContribution: 'Adicionar Aporte',
    newTotalValue: 'Novo valor total',
    optionalTag: 'Tag (opcional)',
    contributionTrend: 'Tendência de Aportes (12 meses)',
    noInvestments: 'Nenhum investimento ainda',
    createFirstInvestment: 'Crie seu primeiro investimento para começar a acompanhar',
    investmentName: 'Nome do investimento',
    description: 'Descrição (opcional)',
    initialValue: 'Valor inicial (opcional)',
    create: 'Criar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    edit: 'Editar',
    movements: 'Movimentações',
    noMovements: 'Nenhuma movimentação ainda',
    on: 'em',
    vsLastTotal: 'em relação ao total anterior',
    enterNewTotal: 'Informe o novo valor total',
    valueMatchesCurrent: 'O valor já corresponde ao total atual',
    saving: 'Salvando...',
    contributionAdded: 'Aporte registrado!',
    errorSaving: 'Erro ao salvar aporte',
    confirmDelete: 'Tem certeza que deseja excluir este investimento?',
    thisMonth: 'este mês',
    investment: 'investimento',
    investmentsCount: 'investimentos',
    movementType: 'Tipo',
    deposit: 'Depósito',
    dividend: 'Provento',
    editMovement: 'Editar Movimentação',
    amount: 'Valor',
    date: 'Data',
    save: 'Salvar',
    movementUpdated: 'Movimentação atualizada!',
    errorUpdating: 'Erro ao atualizar movimentação',
    editInvestment: 'Editar Investimento',
    color: 'Cor',
    investmentUpdated: 'Investimento atualizado!',
    errorUpdatingInvestment: 'Erro ao atualizar investimento',
  },
};

export type InvestmentTranslationKey = keyof typeof INVESTMENT_TRANSLATIONS.en;

export function t(key: InvestmentTranslationKey, language: 'en' | 'pt'): string {
  return INVESTMENT_TRANSLATIONS[language][key] || INVESTMENT_TRANSLATIONS.en[key] || key;
}
