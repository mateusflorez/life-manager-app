import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Investment,
  InvestmentMovement,
  InvestmentWithTotal,
  generateId,
  getTodayKey,
  calculatePercentChange,
  INVESTMENT_COLORS,
} from '@/types/investment';

// Storage keys
const KEYS = {
  INVESTMENTS: '@life_manager_investments',
  MOVEMENTS: '@life_manager_investment_movements',
};

// ============ Investments ============

export async function getInvestments(accountId: string): Promise<Investment[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.INVESTMENTS);
    if (!data) return [];
    const investments: Investment[] = JSON.parse(data);
    return investments.filter((i) => i.accountId === accountId);
  } catch (error) {
    console.error('Error getting investments:', error);
    return [];
  }
}

export async function getInvestment(investmentId: string): Promise<Investment | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.INVESTMENTS);
    if (!data) return null;
    const investments: Investment[] = JSON.parse(data);
    return investments.find((i) => i.id === investmentId) || null;
  } catch (error) {
    console.error('Error getting investment:', error);
    return null;
  }
}

export async function saveInvestment(
  accountId: string,
  name: string,
  description?: string,
  initialValue?: number
): Promise<Investment> {
  const now = new Date().toISOString();

  // Get existing investments to determine color
  const existing = await getInvestments(accountId);
  const colorIndex = existing.length % INVESTMENT_COLORS.length;

  const newInvestment: Investment = {
    id: generateId(),
    accountId,
    name,
    description,
    color: INVESTMENT_COLORS[colorIndex],
    createdAt: now,
    updatedAt: now,
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.INVESTMENTS);
    const investments: Investment[] = data ? JSON.parse(data) : [];
    investments.push(newInvestment);
    await AsyncStorage.setItem(KEYS.INVESTMENTS, JSON.stringify(investments));

    // Add initial movement if provided
    if (initialValue && initialValue > 0) {
      await saveMovement(newInvestment.id, initialValue, getTodayKey(), ['initial']);
    }

    return newInvestment;
  } catch (error) {
    console.error('Error saving investment:', error);
    throw error;
  }
}

export async function updateInvestment(investment: Investment): Promise<Investment> {
  try {
    const data = await AsyncStorage.getItem(KEYS.INVESTMENTS);
    const investments: Investment[] = data ? JSON.parse(data) : [];
    const index = investments.findIndex((i) => i.id === investment.id);
    if (index === -1) throw new Error('Investment not found');

    investments[index] = { ...investment, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.INVESTMENTS, JSON.stringify(investments));
    return investments[index];
  } catch (error) {
    console.error('Error updating investment:', error);
    throw error;
  }
}

export async function deleteInvestment(investmentId: string): Promise<void> {
  try {
    // Delete the investment
    const data = await AsyncStorage.getItem(KEYS.INVESTMENTS);
    const investments: Investment[] = data ? JSON.parse(data) : [];
    const filtered = investments.filter((i) => i.id !== investmentId);
    await AsyncStorage.setItem(KEYS.INVESTMENTS, JSON.stringify(filtered));

    // Delete related movements
    await deleteMovementsByInvestment(investmentId);
  } catch (error) {
    console.error('Error deleting investment:', error);
    throw error;
  }
}

export async function deleteInvestmentsByAccount(accountId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.INVESTMENTS);
    const investments: Investment[] = data ? JSON.parse(data) : [];
    const toDelete = investments.filter((i) => i.accountId === accountId);
    const filtered = investments.filter((i) => i.accountId !== accountId);
    await AsyncStorage.setItem(KEYS.INVESTMENTS, JSON.stringify(filtered));

    // Delete movements for each investment
    for (const inv of toDelete) {
      await deleteMovementsByInvestment(inv.id);
    }
  } catch (error) {
    console.error('Error deleting investments by account:', error);
  }
}

// ============ Movements ============

export async function getMovements(investmentId: string): Promise<InvestmentMovement[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MOVEMENTS);
    if (!data) return [];
    const movements: InvestmentMovement[] = JSON.parse(data);
    return movements
      .filter((m) => m.investmentId === investmentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error getting movements:', error);
    return [];
  }
}

export async function getAllMovementsByAccount(
  accountId: string
): Promise<InvestmentMovement[]> {
  try {
    const investments = await getInvestments(accountId);
    const investmentIds = new Set(investments.map((i) => i.id));

    const data = await AsyncStorage.getItem(KEYS.MOVEMENTS);
    if (!data) return [];

    const movements: InvestmentMovement[] = JSON.parse(data);
    return movements
      .filter((m) => investmentIds.has(m.investmentId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error getting all movements by account:', error);
    return [];
  }
}

export async function saveMovement(
  investmentId: string,
  amount: number,
  date: string,
  tags: string[] = []
): Promise<InvestmentMovement> {
  const newMovement: InvestmentMovement = {
    id: generateId(),
    investmentId,
    amount,
    date,
    tags,
    createdAt: new Date().toISOString(),
  };

  try {
    const data = await AsyncStorage.getItem(KEYS.MOVEMENTS);
    const movements: InvestmentMovement[] = data ? JSON.parse(data) : [];
    movements.push(newMovement);
    await AsyncStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(movements));
    return newMovement;
  } catch (error) {
    console.error('Error saving movement:', error);
    throw error;
  }
}

export async function deleteMovement(movementId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MOVEMENTS);
    const movements: InvestmentMovement[] = data ? JSON.parse(data) : [];
    const filtered = movements.filter((m) => m.id !== movementId);
    await AsyncStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting movement:', error);
    throw error;
  }
}

async function deleteMovementsByInvestment(investmentId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MOVEMENTS);
    const movements: InvestmentMovement[] = data ? JSON.parse(data) : [];
    const filtered = movements.filter((m) => m.investmentId !== investmentId);
    await AsyncStorage.setItem(KEYS.MOVEMENTS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting movements by investment:', error);
  }
}

// ============ Combined Queries ============

export async function getInvestmentWithTotal(
  investmentId: string
): Promise<InvestmentWithTotal | null> {
  try {
    const investment = await getInvestment(investmentId);
    if (!investment) return null;

    const movements = await getMovements(investmentId);
    const total = movements.reduce((sum, m) => sum + m.amount, 0);

    // Calculate last movement with percent change
    let lastMovement: InvestmentWithTotal['lastMovement'] = undefined;
    if (movements.length > 0) {
      const sorted = [...movements].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const last = sorted[0];

      // Calculate previous total (total - last movement)
      const previousTotal = total - last.amount;
      const percentChange = calculatePercentChange(last.amount, previousTotal);

      lastMovement = { ...last, percentChange };
    }

    return {
      ...investment,
      total,
      movements,
      lastMovement,
    };
  } catch (error) {
    console.error('Error getting investment with total:', error);
    return null;
  }
}

export async function getInvestmentsWithTotals(
  accountId: string
): Promise<InvestmentWithTotal[]> {
  try {
    const investments = await getInvestments(accountId);
    const result: InvestmentWithTotal[] = [];

    for (const investment of investments) {
      const withTotal = await getInvestmentWithTotal(investment.id);
      if (withTotal) {
        result.push(withTotal);
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting investments with totals:', error);
    return [];
  }
}

export async function getPortfolioTotal(accountId: string): Promise<number> {
  try {
    const investments = await getInvestmentsWithTotals(accountId);
    return investments.reduce((sum, inv) => sum + inv.total, 0);
  } catch (error) {
    console.error('Error getting portfolio total:', error);
    return 0;
  }
}

export async function getMonthlyChange(accountId: string): Promise<{
  amount: number;
  percentChange: number | null;
}> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

    const movements = await getAllMovementsByAccount(accountId);
    // Filter: this month AND exclude movements with "initial" tag
    const thisMonthMovements = movements.filter(
      (m) => m.date >= startOfMonthStr && !m.tags.includes('initial')
    );
    const amount = thisMonthMovements.reduce((sum, m) => sum + m.amount, 0);

    // Calculate previous total (total at start of month, excluding this month's non-initial movements)
    const investments = await getInvestmentsWithTotals(accountId);
    const currentTotal = investments.reduce((sum, inv) => sum + inv.total, 0);
    const previousTotal = currentTotal - amount;
    const percentChange = calculatePercentChange(amount, previousTotal);

    return { amount, percentChange };
  } catch (error) {
    console.error('Error getting monthly change:', error);
    return { amount: 0, percentChange: null };
  }
}

// ============ Add Contribution (by new total) ============

export async function addContributionByTotal(
  investmentId: string,
  newTotal: number,
  tag?: string
): Promise<InvestmentMovement> {
  try {
    const movements = await getMovements(investmentId);
    const currentTotal = movements.reduce((sum, m) => sum + m.amount, 0);
    const delta = Number((newTotal - currentTotal).toFixed(2));

    if (Math.abs(delta) < 0.01) {
      throw new Error('VALUE_MATCHES_CURRENT');
    }

    const tags: string[] = [];
    if (tag && tag.trim()) {
      tags.push(tag.trim().toLowerCase().replace(/\s+/g, '-'));
    }

    return await saveMovement(investmentId, delta, getTodayKey(), tags);
  } catch (error) {
    console.error('Error adding contribution by total:', error);
    throw error;
  }
}
