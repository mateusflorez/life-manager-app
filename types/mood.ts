export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type MoodEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  mood: MoodScore;
  note?: string;
  createdAt: string; // ISO timestamp
};

export const MOOD_FACES: Record<MoodScore, string> = {
  1: '😞',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
};

export const MOOD_XP = 10;
export const CHART_DAYS = 60;
export const RECENT_LIMIT = 6;

export const generateId = (): string => {
  return `mood_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
};

export const getTodayKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const formatDate = (dateStr: string, language: 'en' | 'pt'): string => {
  const date = new Date(dateStr + 'T00:00:00');
  if (language === 'pt') {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatShortDate = (dateStr: string, language: 'en' | 'pt'): string => {
  const date = new Date(dateStr + 'T00:00:00');
  if (language === 'pt') {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const getMoodFace = (mood: number): string => {
  const score = Math.min(5, Math.max(1, Math.round(mood))) as MoodScore;
  return MOOD_FACES[score] || '🙂';
};

export const calculateStreak = (entries: MoodEntry[]): number => {
  if (entries.length === 0) return 0;

  const sorted = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const uniqueDates = [...new Set(sorted.map((e) => e.date))];
  if (uniqueDates.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDates.length; i++) {
    const entryDate = new Date(uniqueDates[i] + 'T00:00:00');
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0) {
      // Check if yesterday (no entry today yet)
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      if (entryDate.getTime() === yesterday.getTime()) {
        streak++;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
};

export const calculateAverageMood = (entries: MoodEntry[], days: number = 7): number | null => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const recentEntries = entries.filter((e) => new Date(e.date + 'T00:00:00') >= cutoff);
  if (recentEntries.length === 0) return null;

  const sum = recentEntries.reduce((acc, e) => acc + e.mood, 0);
  return Number((sum / recentEntries.length).toFixed(1));
};

export const buildChartData = (
  entries: MoodEntry[],
  days: number = CHART_DAYS,
  language: 'en' | 'pt'
): { labels: string[]; values: (number | null)[] } => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group entries by date
  const grouped: Record<string, number[]> = {};
  entries.forEach((entry) => {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry.mood);
  });

  const labels: string[] = [];
  const values: (number | null)[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

    const label =
      language === 'pt'
        ? `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`
        : day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    labels.push(label);

    const dayValues = grouped[key];
    if (dayValues && dayValues.length > 0) {
      const avg = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
      values.push(Number(avg.toFixed(2)));
    } else {
      values.push(null);
    }
  }

  return { labels, values };
};

export const groupEntriesByMonth = (
  entries: MoodEntry[],
  language: 'en' | 'pt'
): { month: string; entries: MoodEntry[] }[] => {
  const grouped: Record<string, MoodEntry[]> = {};

  entries.forEach((entry) => {
    const date = new Date(entry.date + 'T00:00:00');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(entry);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName =
      language === 'pt'
        ? date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return {
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      entries: grouped[key].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    };
  });
};
