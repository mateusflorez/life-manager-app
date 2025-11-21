import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MoodEntry } from '@/types/mood';

const STORAGE_KEY = '@life_manager_mood_entries';

export const loadEntries = async (): Promise<MoodEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading mood entries:', error);
    return [];
  }
};

export const saveEntries = async (entries: MoodEntry[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving mood entries:', error);
    throw error;
  }
};

export const saveEntry = async (entry: MoodEntry): Promise<void> => {
  const entries = await loadEntries();
  const index = entries.findIndex((e) => e.id === entry.id);
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  await saveEntries(entries);
};

export const deleteEntry = async (entryId: string): Promise<void> => {
  const entries = await loadEntries();
  const filtered = entries.filter((e) => e.id !== entryId);
  await saveEntries(filtered);
};
