import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  Investment,
  InvestmentMovement,
  InvestmentWithTotal,
  MovementType,
  calculateChartData,
} from '@/types/investment';
import * as InvestmentStorage from '@/services/investment-storage';
import { useAccount } from './account-context';

type InvestmentContextType = {
  // Investments
  investments: InvestmentWithTotal[];
  portfolioTotal: number;
  monthlyChange: { amount: number; percentChange: number | null };

  // Investment CRUD
  createInvestment: (
    name: string,
    description?: string,
    initialValue?: number
  ) => Promise<Investment>;
  updateInvestment: (investment: Investment) => Promise<void>;
  deleteInvestment: (investmentId: string) => Promise<void>;
  getInvestment: (investmentId: string) => Promise<InvestmentWithTotal | null>;

  // Movement operations
  addContribution: (
    investmentId: string,
    newTotal: number,
    tag?: string,
    movementType?: MovementType
  ) => Promise<InvestmentMovement>;
  deleteMovement: (movementId: string) => Promise<void>;

  // Chart data
  chartData: {
    labels: string[];
    datasets: { name: string; data: number[]; color: string }[];
  };

  // State
  loading: boolean;
  refreshData: () => Promise<void>;
};

const InvestmentContext = createContext<InvestmentContextType | undefined>(
  undefined
);

export function InvestmentProvider({ children }: { children: ReactNode }) {
  const { account } = useAccount();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<InvestmentWithTotal[]>([]);
  const [portfolioTotal, setPortfolioTotal] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState<{
    amount: number;
    percentChange: number | null;
  }>({ amount: 0, percentChange: null });
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: { name: string; data: number[]; color: string }[];
  }>({ labels: [], datasets: [] });

  // Load initial data
  const loadData = useCallback(async () => {
    if (!account) {
      setInvestments([]);
      setPortfolioTotal(0);
      setMonthlyChange({ amount: 0, percentChange: null });
      setChartData({ labels: [], datasets: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Load investments with totals
      const investmentsData = await InvestmentStorage.getInvestmentsWithTotals(
        account.id
      );
      setInvestments(investmentsData);

      // Calculate portfolio total
      const total = investmentsData.reduce((sum, inv) => sum + inv.total, 0);
      setPortfolioTotal(total);

      // Calculate monthly change
      const change = await InvestmentStorage.getMonthlyChange(account.id);
      setMonthlyChange(change);

      // Calculate chart data
      const chart = calculateChartData(investmentsData);
      setChartData(chart);
    } catch (error) {
      console.error('Error loading investment data:', error);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Investment operations
  const createInvestment = async (
    name: string,
    description?: string,
    initialValue?: number
  ): Promise<Investment> => {
    if (!account) throw new Error('No account selected');
    const newInvestment = await InvestmentStorage.saveInvestment(
      account.id,
      name,
      description,
      initialValue
    );
    await loadData(); // Refresh all data
    return newInvestment;
  };

  const updateInvestment = async (investment: Investment): Promise<void> => {
    await InvestmentStorage.updateInvestment(investment);
    await loadData();
  };

  const deleteInvestment = async (investmentId: string): Promise<void> => {
    await InvestmentStorage.deleteInvestment(investmentId);
    await loadData();
  };

  const getInvestment = async (
    investmentId: string
  ): Promise<InvestmentWithTotal | null> => {
    return InvestmentStorage.getInvestmentWithTotal(investmentId);
  };

  // Movement operations
  const addContribution = async (
    investmentId: string,
    newTotal: number,
    tag?: string,
    movementType: MovementType = 'deposit'
  ): Promise<InvestmentMovement> => {
    const movement = await InvestmentStorage.addContributionByTotal(
      investmentId,
      newTotal,
      tag,
      movementType
    );
    await loadData();
    return movement;
  };

  const deleteMovement = async (movementId: string): Promise<void> => {
    await InvestmentStorage.deleteMovement(movementId);
    await loadData();
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  return (
    <InvestmentContext.Provider
      value={{
        investments,
        portfolioTotal,
        monthlyChange,
        createInvestment,
        updateInvestment,
        deleteInvestment,
        getInvestment,
        addContribution,
        deleteMovement,
        chartData,
        loading,
        refreshData,
      }}
    >
      {children}
    </InvestmentContext.Provider>
  );
}

export function useInvestment() {
  const context = useContext(InvestmentContext);
  if (context === undefined) {
    throw new Error('useInvestment must be used within an InvestmentProvider');
  }
  return context;
}
