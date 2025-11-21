import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Settings, DEFAULT_SETTINGS } from '@/types/settings';

const SETTINGS_KEY = '@life_manager_settings';

export const settingsStorage = {
  async getSettings(): Promise<Settings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  async updateLanguage(language: Settings['language']): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.language = language;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  },

  async updateCurrency(currency: Settings['currency']): Promise<void> {
    try {
      const settings = await this.getSettings();
      settings.currency = currency;
      await this.saveSettings(settings);
    } catch (error) {
      console.error('Error updating currency:', error);
      throw error;
    }
  },
};
