# Mood Module Proposal

## Overview

The Mood module provides daily mood tracking with a 1-5 scale (sad to happy), optional notes, and visualization of mood trends over the last 60 days. Users can log how their day felt and track emotional patterns over time.

---

## Data Models

### Mood Entry

```typescript
type MoodScore = 1 | 2 | 3 | 4 | 5;

type MoodEntry = {
  id: string;
  date: string;       // YYYY-MM-DD format
  mood: MoodScore;    // 1 = sad, 5 = happy
  note?: string;      // Optional note about the day
  createdAt: string;  // ISO timestamp
};

// Mood score to emoji mapping
const MOOD_FACES: Record<MoodScore, string> = {
  1: '😞',  // Very sad
  2: '😕',  // Sad
  3: '😐',  // Neutral
  4: '🙂',  // Happy
  5: '😄',  // Very happy
};
```

---

## Storage Structure

```
AsyncStorage Keys:
├── @life_manager_mood_entries    # All mood entries
└── @life_manager_account         # XP and stats (existing)
```

### Mood Storage

```typescript
type MoodStorage = {
  entries: MoodEntry[];
};
```

---

## Constants

```typescript
const MOOD_XP = 10;           // XP awarded per mood log
const CHART_DAYS = 60;        // Days shown in trend chart
const RECENT_LIMIT = 6;       // Number of recent entries to display
```

---

## UI Components

### 1. Mood Overview Screen (`app/mood/index.tsx`)

Main view with info card, trend chart, log button, and recent entries in vertical layout.

```
┌────────────────────────────────────────┐
│ ← Mood Tracker                         │
├────────────────────────────────────────┤
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ ℹ️ Mood tracker                   │   │
│ │ Follow the last 60 days and jot  │   │
│ │ optional notes to remember how   │   │
│ │ each day felt.                   │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ Mood trend (last 60 days)        │   │
│ │                                  │   │
│ │ 5 ─┐      ╱╲                     │   │
│ │ 4 ─┤  ╱╲ ╱  ╲  ╱╲               │   │
│ │ 3 ─┤ ╱  ╲    ╲╱  ╲              │   │
│ │ 2 ─┤╱              ╲             │   │
│ │ 1 ─┴────────────────────────     │   │
│ │   Jan 1  Jan 15  Feb 1  ...      │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │         😊 Log today's mood       │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ Recent entries         View all →│   │
│ ├──────────────────────────────────┤   │
│ │ ┌────────────┐ ┌────────────┐    │   │
│ │ │ Jan 21     │ │ Jan 20     │    │   │
│ │ │ 🙂 4/5     │ │ 😄 5/5     │    │   │
│ │ │ Good day   │ │ Great!     │    │   │
│ │ └────────────┘ └────────────┘    │   │
│ │ ┌────────────┐ ┌────────────┐    │   │
│ │ │ Jan 19     │ │ Jan 18     │    │   │
│ │ │ 😐 3/5     │ │ 😕 2/5     │    │   │
│ │ │            │ │ Tough day  │    │   │
│ │ └────────────┘ └────────────┘    │   │
│ └──────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

### 2. Log Mood Modal (`app/mood/log.tsx`)

Modal screen for logging mood entry.

```
┌────────────────────────────────────────┐
│ ← Log Mood                             │
├────────────────────────────────────────┤
│                                        │
│ Log today's mood                       │
│ Choose how the day went                │
│ (1 = sad, 5 = happy)                  │
│                                        │
│ Entry date                             │
│ ┌──────────────────────────────────┐   │
│ │ 📅 2025-01-21                    │   │
│ └──────────────────────────────────┘   │
│                                        │
│ Mood score                             │
│ 😞 1 ─────────────○─────────────── 5 😄│
│                                        │
│ 🙂 Mood: 4/5                          │
│                                        │
│ Note (optional)                        │
│ ┌──────────────────────────────────┐   │
│ │ Optional note about today...     │   │
│ │                                  │   │
│ │                                  │   │
│ └──────────────────────────────────┘   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │           Save mood              │   │
│ └──────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

### 3. History Screen (`app/mood/history.tsx`)

Full list of all past mood entries with filtering options.

```
┌────────────────────────────────────────┐
│ ← Mood History                         │
├────────────────────────────────────────┤
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 🔍 Search notes...               │   │
│ └──────────────────────────────────┘   │
│                                        │
│ January 2025                           │
│ ┌──────────────────────────────────┐   │
│ │ Jan 21, 2025             🙂 4/5 │   │
│ │ Had a productive day at work     │   │
│ │ and enjoyed dinner with friends. │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ Jan 20, 2025             😄 5/5 │   │
│ │ Great day! Everything went well. │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ Jan 19, 2025             😐 3/5 │   │
│ │                                  │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │
│ │ Jan 18, 2025             😕 2/5 │   │
│ │ Tough day at work.               │   │
│ └──────────────────────────────────┘   │
│                                        │
│ December 2024                          │
│ ┌──────────────────────────────────┐   │
│ │ Dec 31, 2024             😄 5/5 │   │
│ │ New Year's Eve! Amazing party.   │   │
│ └──────────────────────────────────┘   │
│ ...                                    │
│                                        │
└────────────────────────────────────────┘
```

### 4. Mood Entry Card Component

```
┌──────────────────────────────────┐
│ Jan 21, 2025           🙂 4/5   │
├──────────────────────────────────┤
│ Note: Had a productive day at   │
│ work and enjoyed dinner with    │
│ friends.                        │
└──────────────────────────────────┘
```

### 5. Mood Trend Chart

Line chart showing daily mood averages over the last 60 days.

Features:
- Y-axis: 1-5 scale (mood scores)
- X-axis: Dates (show every 3rd label to avoid crowding)
- Line color: Yellow/gold (`#FACC15`)
- Fill area: Semi-transparent yellow
- Smooth line with tension
- Gaps for missing days

---

## Context API

```typescript
type MoodContextValue = {
  // Data
  entries: MoodEntry[];
  loading: boolean;

  // Actions
  addEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;

  // Computed
  getRecentEntries: (limit?: number) => MoodEntry[];
  getChartData: () => { labels: string[]; values: (number | null)[] };
  getAverageMood: (days?: number) => number | null;
  getTodayEntry: () => MoodEntry | null;
};
```

---

## Home Screen Integration

### Quick Stats Card

```
┌────────────────────────────────────────┐
│ 😊 Mood                     View All → │
├────────────────────────────────────────┤
│                                        │
│  Average mood (7 days)                 │
│  🙂 3.8/5                              │
│                                        │
│  Today: 😄 5/5                         │
│  Streak: 12 days                       │
│                                        │
└────────────────────────────────────────┘
```

### Module Toggle

Add `mood` to `ModulesConfig`:

```typescript
type ModulesConfig = {
  finance: boolean;
  investments: boolean;
  tasks: boolean;
  books: boolean;
  mood: boolean; // NEW
};
```

---

## File Structure

```
app/
├── mood/
│   ├── _layout.tsx            # Mood stack layout
│   ├── index.tsx              # Mood overview screen
│   ├── log.tsx                # Log mood modal screen
│   └── history.tsx            # Full history screen

components/
├── mood/
│   ├── mood-chart.tsx         # 60-day trend chart
│   ├── mood-entry-card.tsx    # Single entry display
│   └── mood-home-card.tsx     # Home screen card

contexts/
└── mood-context.tsx           # Mood state management

services/
└── mood-storage.ts            # AsyncStorage operations

types/
└── mood.ts                    # Type definitions + helpers
```

---

## Translations

```typescript
const translations = {
  en: {
    moodTracker: 'Mood tracker',
    calloutBody: 'Follow the last 60 days and jot optional notes to remember how each day felt.',
    entryDate: 'Entry date',
    dateInvalid: 'Pick a valid date.',
    recentEntries: 'Recent entries',
    noRecentEntries: 'No recent notes yet.',
    note: 'Note',
    noteOptional: 'Note (optional)',
    chartTitle: 'Mood trend (last 60 days)',
    noEntries: 'No mood entries yet.',
    logMood: "Log today's mood",
    logDescription: 'Choose how the day went (1 = sad, 5 = happy) and leave an optional note.',
    moodScore: 'Mood score',
    moodValue: (value: number, face: string) => `${face} Mood: ${value}/5`,
    notePlaceholder: 'Optional note about today',
    saveMood: 'Save mood',
    saving: 'Saving...',
    saved: 'Mood saved!',
    saveError: 'Could not save mood.',
    averageMood: 'Average mood',
    today: 'Today',
    streak: 'Streak',
    days: 'days',
    viewAll: 'View all',
    moodHistory: 'Mood History',
    searchNotes: 'Search notes...',
    noHistory: 'No mood entries recorded yet.',
  },
  pt: {
    moodTracker: 'Rastreador de humor',
    calloutBody: 'Acompanhe os últimos 60 dias e escreva notas opcionais para lembrar como cada dia foi.',
    entryDate: 'Data do registro',
    dateInvalid: 'Escolha uma data válida.',
    recentEntries: 'Últimos registros',
    noRecentEntries: 'Nenhuma nota recente.',
    note: 'Nota',
    noteOptional: 'Nota (opcional)',
    chartTitle: 'Humor (últimos 60 dias)',
    noEntries: 'Nenhum registro de humor ainda.',
    logMood: 'Registrar humor de hoje',
    logDescription: 'Escolha como o dia foi (1 = triste, 5 = feliz) e escreva uma nota opcional.',
    moodScore: 'Nota do humor',
    moodValue: (value: number, face: string) => `${face} Humor: ${value}/5`,
    notePlaceholder: 'Nota opcional sobre o dia',
    saveMood: 'Salvar humor',
    saving: 'Salvando...',
    saved: 'Humor registrado!',
    saveError: 'Não foi possível salvar o humor.',
    averageMood: 'Humor médio',
    today: 'Hoje',
    streak: 'Sequência',
    days: 'dias',
    viewAll: 'Ver tudo',
    moodHistory: 'Histórico de Humor',
    searchNotes: 'Buscar notas...',
    noHistory: 'Nenhum registro de humor ainda.',
  },
};
```

---

## Helper Functions

```typescript
// types/mood.ts

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

export const getMoodFace = (mood: MoodScore): string => {
  return MOOD_FACES[mood] || '🙂';
};

export const calculateStreak = (entries: MoodEntry[]): number => {
  if (entries.length === 0) return 0;

  const sorted = [...entries].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sorted.length; i++) {
    const entryDate = new Date(sorted[i].date + 'T00:00:00');
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else if (i === 0 && entryDate.getTime() === expectedDate.getTime() - 86400000) {
      // Allow for yesterday if no entry today yet
      continue;
    } else {
      break;
    }
  }

  return streak;
};

export const calculateAverageMood = (entries: MoodEntry[], days: number = 7): number | null => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const recentEntries = entries.filter(e => new Date(e.date) >= cutoff);
  if (recentEntries.length === 0) return null;

  const sum = recentEntries.reduce((acc, e) => acc + e.mood, 0);
  return Number((sum / recentEntries.length).toFixed(1));
};

export const buildChartData = (entries: MoodEntry[], days: number = 60, language: 'en' | 'pt') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group entries by date
  const grouped: Record<string, number[]> = {};
  entries.forEach(entry => {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry.mood);
  });

  const labels: string[] = [];
  const values: (number | null)[] = [];

  for (let offset = days - 1; offset >= 0; offset--) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;

    const label = language === 'pt'
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
```

---

## XP and Stats Integration

On mood entry save:
1. Award +10 XP to account
2. Optionally update streak counter in account stats

```typescript
const saveMoodEntry = async (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => {
  const newEntry: MoodEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  // 1. Save entry
  await addEntry(newEntry);

  // 2. Award XP
  await accountContext.addXp(MOOD_XP);
};
```

---

## Implementation Priority

1. **Phase 1**: Core data models and storage
   - Types definition (`types/mood.ts`)
   - Storage service (`services/mood-storage.ts`)
   - Context provider (`contexts/mood-context.tsx`)

2. **Phase 2**: Basic UI
   - Mood overview screen (`app/mood/index.tsx`)
   - Log mood modal screen (`app/mood/log.tsx`)
   - Mood entry card component
   - Recent entries display

3. **Phase 3**: Chart and History
   - 60-day trend line chart (react-native-chart-kit)
   - History screen (`app/mood/history.tsx`)
   - Search/filter functionality

4. **Phase 4**: Polish
   - Home screen card with stats
   - Module toggle in settings
   - Streak calculation
   - Animations and feedback

---

## Design Notes

### Color Scheme
- Chart line: Yellow/gold (`#FACC15`)
- Chart fill: Semi-transparent yellow (`rgba(250, 204, 21, 0.15)`)
- Positive mood indicators: Use mood emojis for visual feedback

### Layout
- Use grid layout with two columns on larger screens
- Chart and form side by side
- Recent entries span full width below

### Accessibility
- Slider for mood selection (1-5)
- Clear labels for each mood level
- Visual + emoji feedback for selected mood

---

## Notes

- Multiple entries per day are allowed (averaged in chart)
- Notes are sanitized (newlines converted to spaces)
- Date picker defaults to today but allows past dates
- Chart shows null/gap for days without entries (spanGaps: true)
- Streak counts consecutive days with at least one entry
