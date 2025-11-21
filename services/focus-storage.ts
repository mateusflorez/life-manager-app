import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FocusEntry,
  FocusTimerState,
  getDefaultTimerState,
} from '@/types/focus';

const STORAGE_KEYS = {
  ENTRIES: '@life_manager_focus_entries',
  TIMER_STATE: '@life_manager_focus_timer_state',
};

// Entries
export async function loadFocusEntries(): Promise<FocusEntry[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Failed to load focus entries:', error);
    return [];
  }
}

export async function saveFocusEntries(entries: FocusEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  } catch (error) {
    console.error('Failed to save focus entries:', error);
    throw error;
  }
}

export async function addFocusEntry(entry: FocusEntry): Promise<FocusEntry[]> {
  const entries = await loadFocusEntries();
  const updated = [entry, ...entries];
  await saveFocusEntries(updated);
  return updated;
}

export async function deleteFocusEntry(id: string): Promise<FocusEntry[]> {
  const entries = await loadFocusEntries();
  const updated = entries.filter((e) => e.id !== id);
  await saveFocusEntries(updated);
  return updated;
}

// Timer State (for persistence across app restarts)
export async function loadTimerState(): Promise<FocusTimerState> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TIMER_STATE);
    if (data) {
      const state = JSON.parse(data);
      // Validate and merge with defaults for any missing fields
      return { ...getDefaultTimerState(), ...state };
    }
    return getDefaultTimerState();
  } catch (error) {
    console.error('Failed to load timer state:', error);
    return getDefaultTimerState();
  }
}

export async function saveTimerState(state: FocusTimerState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save timer state:', error);
  }
}

export async function clearTimerState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
  } catch (error) {
    console.error('Failed to clear timer state:', error);
  }
}
