// Focus module types and helpers
// Designed to support multiple focus modes

export type Language = 'en' | 'pt';

// Focus modes - extensible for future modes
// pomodoro: focus + break cycles (traditional pomodoro technique)
// countdown: simple timer with target duration (no breaks)
// countup: stopwatch style, track time without limits
export type FocusMode = 'pomodoro' | 'countdown' | 'countup';

// Session entry stored in history
export type FocusEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO timestamp
  endedAt: string; // ISO timestamp
  mode: FocusMode;
  durationMinutes: number; // actual focus time
  // Countdown-specific fields
  targetMinutes?: number; // planned focus time (countdown mode)
  breakMinutes?: number; // break duration (countdown mode)
  cyclesCompleted?: number; // cycles done (countdown mode)
  // Tags for categorization
  tag?: string;
};

// Timer phases
export type FocusPhase = 'idle' | 'focus' | 'break';

// Active timer state (persisted for app restart recovery)
export type FocusTimerState = {
  running: boolean;
  mode: FocusMode;
  phase: FocusPhase;
  // Countdown mode
  targetMinutes: number;
  breakMinutes: number;
  cyclesTarget: number;
  cyclesCompleted: number;
  endsAt: number | null; // timestamp when current phase ends
  // Countup mode
  startedAt: number | null; // timestamp when counting started
  // Common
  currentSessionStartISO: string | null;
  pausedDuration: number; // accumulated pause time in ms
  pausedAt: number | null; // timestamp when paused
};

// Stats summary
export type FocusStats = {
  totalMinutes: number;
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
  lastEntry: FocusEntry | null;
};

// Constants
export const FOCUS_XP_PER_MINUTE = 1;
export const DEFAULT_TARGET_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;
export const DEFAULT_CYCLES = 4;
export const RECENT_LIMIT = 8;

// ID generation
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Date helpers
export function getTodayKey(): string {
  const now = new Date();
  return formatDateKey(now);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  return new Date(now.setDate(diff));
}

export function formatDate(dateStr: string, language: Language): string {
  const date = new Date(dateStr + 'T00:00:00');
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(isoString: string, language: Language): string {
  const date = new Date(isoString);
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(isoString: string, language: Language): string {
  const date = new Date(isoString);
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Timer display formatting
export function formatTimerDisplay(ms: number): string {
  const safeMs = Math.max(0, Math.abs(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Stats calculations
export function calculateTotalMinutes(entries: FocusEntry[]): number {
  return entries.reduce((sum, entry) => sum + entry.durationMinutes, 0);
}

export function calculateTodayMinutes(entries: FocusEntry[]): number {
  const today = getTodayKey();
  return entries
    .filter((entry) => entry.date === today)
    .reduce((sum, entry) => sum + entry.durationMinutes, 0);
}

export function calculateWeekMinutes(entries: FocusEntry[]): number {
  const weekStart = getWeekStart();
  const weekStartKey = formatDateKey(weekStart);
  return entries
    .filter((entry) => entry.date >= weekStartKey)
    .reduce((sum, entry) => sum + entry.durationMinutes, 0);
}

export function calculateStreak(entries: FocusEntry[]): number {
  if (entries.length === 0) return 0;

  const uniqueDates = [...new Set(entries.map((e) => e.date))].sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  // Streak must include today or yesterday
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterdayKey) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const current = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const previous = new Date(uniqueDates[i] + 'T00:00:00');
    const diffDays = Math.round(
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function calculateStats(entries: FocusEntry[]): FocusStats {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return {
    totalMinutes: calculateTotalMinutes(entries),
    todayMinutes: calculateTodayMinutes(entries),
    weekMinutes: calculateWeekMinutes(entries),
    streak: calculateStreak(entries),
    lastEntry: sortedEntries[0] || null,
  };
}

// Group entries by month for history view
export function groupEntriesByMonth(
  entries: FocusEntry[],
  language: Language
): { month: string; entries: FocusEntry[] }[] {
  const groups: Record<string, FocusEntry[]> = {};

  entries.forEach((entry) => {
    const date = new Date(entry.date + 'T00:00:00');
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[monthKey]) {
      groups[monthKey] = [];
    }
    groups[monthKey].push(entry);
  });

  const sortedKeys = Object.keys(groups).sort().reverse();
  const locale = language === 'pt' ? 'pt-BR' : 'en-US';

  return sortedKeys.map((key) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });

    return {
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      entries: groups[key].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      ),
    };
  });
}

// Default timer state
export function getDefaultTimerState(): FocusTimerState {
  return {
    running: false,
    mode: 'pomodoro',
    phase: 'idle',
    targetMinutes: DEFAULT_TARGET_MINUTES,
    breakMinutes: DEFAULT_BREAK_MINUTES,
    cyclesTarget: DEFAULT_CYCLES,
    cyclesCompleted: 0,
    endsAt: null,
    startedAt: null,
    currentSessionStartISO: null,
    pausedDuration: 0,
    pausedAt: null,
  };
}

// Mode display helpers
export function getModeIcon(mode: FocusMode): string {
  switch (mode) {
    case 'pomodoro':
      return 'clock.badge.checkmark';
    case 'countdown':
      return 'timer';
    case 'countup':
      return 'stopwatch';
    default:
      return 'clock';
  }
}

// Translations
const translations = {
  en: {
    focus: 'Focus',
    focusStats: 'Focus Stats',
    total: 'Total',
    today: 'Today',
    thisWeek: 'This week',
    lastSession: 'Last session',
    noSessions: 'No sessions yet',
    timer: 'Timer',
    timerDescription: 'Set your focus and break intervals',
    targetMin: 'Focus (min)',
    breakMin: 'Break (min)',
    cycles: 'Cycles',
    start: 'Start',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    finish: 'Finish',
    idle: 'Ready',
    focusPhase: 'Focus',
    breakPhase: 'Break',
    recentSessions: 'Recent Sessions',
    noHistory: 'No sessions logged yet',
    viewAll: 'View All History',
    history: 'History',
    search: 'Search...',
    delete: 'Delete',
    deleteConfirm: 'Delete this session?',
    cancel: 'Cancel',
    focusDone: 'Focus finished! Time for a break.',
    breakDone: 'Break finished! Back to focus.',
    allCyclesDone: 'All cycles completed. Great work!',
    invalidTarget: 'Enter at least 1 minute for focus.',
    invalidBreak: 'Enter at least 1 minute for break.',
    invalidCycles: 'Enter at least 1 cycle.',
    streak: 'Streak',
    days: 'days',
    day: 'day',
    quickStart: 'Quick Start',
    min: 'min',
    mode: 'Mode',
    pomodoro: 'Pomodoro',
    countdown: 'Countdown',
    countup: 'Stopwatch',
    pomodoroDesc: 'Focus and break cycles',
    countdownDesc: 'Simple timer with target',
    countupDesc: 'Track time without limits',
    selectMode: 'Select Mode',
    sessionSaved: 'Session saved!',
    minLogged: 'min logged',
    duration: 'Duration (min)',
  },
  pt: {
    focus: 'Foco',
    focusStats: 'Estatísticas de Foco',
    total: 'Total',
    today: 'Hoje',
    thisWeek: 'Esta semana',
    lastSession: 'Última sessão',
    noSessions: 'Nenhuma sessão ainda',
    timer: 'Timer',
    timerDescription: 'Configure seus intervalos de foco e descanso',
    targetMin: 'Foco (min)',
    breakMin: 'Descanso (min)',
    cycles: 'Ciclos',
    start: 'Iniciar',
    stop: 'Parar',
    pause: 'Pausar',
    resume: 'Continuar',
    finish: 'Finalizar',
    idle: 'Pronto',
    focusPhase: 'Foco',
    breakPhase: 'Descanso',
    recentSessions: 'Sessões Recentes',
    noHistory: 'Nenhuma sessão registrada',
    viewAll: 'Ver Todo Histórico',
    history: 'Histórico',
    search: 'Buscar...',
    delete: 'Excluir',
    deleteConfirm: 'Excluir esta sessão?',
    cancel: 'Cancelar',
    focusDone: 'Foco concluído! Hora do descanso.',
    breakDone: 'Descanso concluído! Voltar ao foco.',
    allCyclesDone: 'Todos os ciclos finalizados. Ótimo trabalho!',
    invalidTarget: 'Informe pelo menos 1 minuto de foco.',
    invalidBreak: 'Informe pelo menos 1 minuto de descanso.',
    invalidCycles: 'Informe pelo menos 1 ciclo.',
    streak: 'Sequência',
    days: 'dias',
    day: 'dia',
    quickStart: 'Início Rápido',
    min: 'min',
    mode: 'Modo',
    pomodoro: 'Pomodoro',
    countdown: 'Contagem Regressiva',
    countup: 'Cronômetro',
    pomodoroDesc: 'Ciclos de foco e descanso',
    countdownDesc: 'Timer simples com duração',
    countupDesc: 'Rastreie tempo sem limites',
    selectMode: 'Selecionar Modo',
    sessionSaved: 'Sessão salva!',
    minLogged: 'min registrados',
    duration: 'Duração (min)',
  },
};

export function t(key: keyof typeof translations.en, language: Language): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}
