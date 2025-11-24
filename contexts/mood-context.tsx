import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { MoodEntry, MoodScore } from '@/types/mood';
import {
  generateId,
  getTodayKey,
  calculateStreak,
  calculateAverageMood,
  buildChartData,
  groupEntriesByMonth,
  MOOD_XP,
  RECENT_LIMIT,
  CHART_DAYS,
} from '@/types/mood';
import { loadEntries, saveEntry, deleteEntry as deleteEntryStorage } from '@/services/mood-storage';
import { useAccount } from '@/contexts/account-context';

type MoodContextType = {
  entries: MoodEntry[];
  loading: boolean;
  addEntry: (date: string, mood: MoodScore, note?: string) => Promise<void>;
  updateEntry: (entryId: string, mood: MoodScore, note?: string) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  getRecentEntries: (limit?: number) => MoodEntry[];
  getChartData: (language: 'en' | 'pt') => { labels: string[]; values: (number | null)[] };
  getGroupedEntries: (language: 'en' | 'pt') => { month: string; entries: MoodEntry[] }[];
  getAverageMood: (days?: number) => number | null;
  getTodayEntry: () => MoodEntry | null;
  streak: number;
};

const MoodContext = createContext<MoodContextType | null>(null);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { addXp } = useAccount();

  const loadData = useCallback(async () => {
    try {
      const data = await loadEntries();
      setEntries(data);
    } catch (error) {
      console.error('Error loading mood entries:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const streak = useMemo(() => calculateStreak(entries), [entries]);

  const addEntry = useCallback(
    async (date: string, mood: MoodScore, note?: string) => {
      const newEntry: MoodEntry = {
        id: generateId(),
        date,
        mood,
        note: note?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await saveEntry(newEntry);
      setEntries((prev) => [...prev, newEntry]);
      await addXp(MOOD_XP);
    },
    [addXp]
  );

  const updateEntry = useCallback(
    async (entryId: string, mood: MoodScore, note?: string) => {
      const existing = entries.find((e) => e.id === entryId);
      if (!existing) return;

      const updatedEntry: MoodEntry = {
        ...existing,
        mood,
        note: note?.trim() || undefined,
      };

      await saveEntry(updatedEntry);
      setEntries((prev) => prev.map((e) => (e.id === entryId ? updatedEntry : e)));
    },
    [entries]
  );

  const deleteEntry = useCallback(async (entryId: string) => {
    await deleteEntryStorage(entryId);
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, []);

  const getRecentEntries = useCallback(
    (limit: number = RECENT_LIMIT) => {
      return [...entries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
    },
    [entries]
  );

  const getChartData = useCallback(
    (language: 'en' | 'pt') => {
      return buildChartData(entries, CHART_DAYS, language);
    },
    [entries]
  );

  const getGroupedEntries = useCallback(
    (language: 'en' | 'pt') => {
      return groupEntriesByMonth(entries, language);
    },
    [entries]
  );

  const getAverageMood = useCallback(
    (days: number = 7) => {
      return calculateAverageMood(entries, days);
    },
    [entries]
  );

  const getTodayEntry = useCallback(() => {
    const today = getTodayKey();
    const todayEntries = entries.filter((e) => e.date === today);
    if (todayEntries.length === 0) return null;
    return todayEntries.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [entries]);

  const value = useMemo(
    () => ({
      entries,
      loading,
      addEntry,
      updateEntry,
      deleteEntry,
      getRecentEntries,
      getChartData,
      getGroupedEntries,
      getAverageMood,
      getTodayEntry,
      streak,
    }),
    [
      entries,
      loading,
      addEntry,
      updateEntry,
      deleteEntry,
      getRecentEntries,
      getChartData,
      getGroupedEntries,
      getAverageMood,
      getTodayEntry,
      streak,
    ]
  );

  return <MoodContext.Provider value={value}>{children}</MoodContext.Provider>;
}

export function useMood() {
  const context = useContext(MoodContext);
  if (!context) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}
