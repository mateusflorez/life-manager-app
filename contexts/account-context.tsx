import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type Account } from '@/types/account';
import { accountStorage } from '@/services/account-storage';

type AccountContextType = {
  account: Account | null;
  setAccount: (account: Account | null) => Promise<void>;
  updateAccount: (updates: Partial<Account>) => Promise<void>;
  clearAccount: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  loading: boolean;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccountState] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveAccount();
  }, []);

  const loadActiveAccount = async () => {
    try {
      const activeAccount = await accountStorage.getActiveAccount();
      setAccountState(activeAccount);
    } catch (error) {
      console.error('Failed to load active account:', error);
    } finally {
      setLoading(false);
    }
  };

  const setAccount = async (newAccount: Account | null) => {
    try {
      if (newAccount) {
        await accountStorage.setActiveAccount(newAccount);
      } else {
        await accountStorage.clearActiveAccount();
      }
      setAccountState(newAccount);
    } catch (error) {
      console.error('Failed to set active account:', error);
      throw error;
    }
  };

  const updateAccount = async (updates: Partial<Account>) => {
    if (!account) return;

    try {
      const updatedAccount = { ...account, ...updates };
      await accountStorage.updateAccount(updatedAccount);
      await accountStorage.setActiveAccount(updatedAccount);
      setAccountState(updatedAccount);
    } catch (error) {
      console.error('Failed to update account:', error);
      throw error;
    }
  };

  const clearAccount = async () => {
    try {
      await accountStorage.clearActiveAccount();
      setAccountState(null);
    } catch (error) {
      console.error('Failed to clear account:', error);
      throw error;
    }
  };

  const addXp = async (amount: number) => {
    if (!account) return;

    try {
      const newXp = (account.xp || 0) + amount;
      const updatedAccount = { ...account, xp: newXp };
      await accountStorage.updateAccount(updatedAccount);
      await accountStorage.setActiveAccount(updatedAccount);
      setAccountState(updatedAccount);
    } catch (error) {
      console.error('Failed to add XP:', error);
      throw error;
    }
  };

  return (
    <AccountContext.Provider
      value={{
        account,
        setAccount,
        updateAccount,
        clearAccount,
        addXp,
        loading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
}
