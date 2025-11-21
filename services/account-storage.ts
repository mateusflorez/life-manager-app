import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Account } from '@/types/account';

const ACCOUNTS_KEY = '@life_manager_accounts';
const ACTIVE_ACCOUNT_KEY = '@life_manager_active_account';

export const accountStorage = {
  async getAccounts(): Promise<Account[]> {
    try {
      const data = await AsyncStorage.getItem(ACCOUNTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading accounts:', error);
      return [];
    }
  },

  async saveAccount(name: string): Promise<Account> {
    try {
      const accounts = await this.getAccounts();
      const newAccount: Account = {
        id: Date.now().toString(),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        xp: 0,
        completedTasks: 0,
      };

      accounts.push(newAccount);
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

      return newAccount;
    } catch (error) {
      console.error('Error saving account:', error);
      throw error;
    }
  },

  async updateAccount(account: Account): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const index = accounts.findIndex(acc => acc.id === account.id);

      if (index !== -1) {
        accounts[index] = account;
        await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      }
    } catch (error) {
      console.error('Error updating account:', error);
      throw error;
    }
  },

  async deleteAccount(accountId: string): Promise<void> {
    try {
      const accounts = await this.getAccounts();
      const filteredAccounts = accounts.filter(acc => acc.id !== accountId);
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(filteredAccounts));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  async setActiveAccount(account: Account): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_ACCOUNT_KEY, JSON.stringify(account));
    } catch (error) {
      console.error('Error setting active account:', error);
      throw error;
    }
  },

  async getActiveAccount(): Promise<Account | null> {
    try {
      const data = await AsyncStorage.getItem(ACTIVE_ACCOUNT_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading active account:', error);
      return null;
    }
  },

  async clearActiveAccount(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVE_ACCOUNT_KEY);
    } catch (error) {
      console.error('Error clearing active account:', error);
      throw error;
    }
  },
};
