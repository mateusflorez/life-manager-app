// Achievements module types and helpers
// Tracks milestone progress across all modules

export type Language = 'en' | 'pt';

export type AchievementCategory =
  | 'levels'
  | 'chapters'
  | 'investments'
  | 'tasks'
  | 'training'
  | 'focus'
  | 'mood';

export type Achievement = {
  key: AchievementCategory;
  title: string;
  currentValue: number;
  tiers: number[];
  labelFn: (target: number) => string;
};

export type AchievementStats = {
  totalTiers: number;
  completedTiers: number;
  completionPercent: number;
  achievements: Achievement[];
};

// Tier colors for achievement cards
export const TIER_COLORS = [
  '#4b5563', // Gray - Bronze tier
  '#22c55e', // Green - Silver tier
  '#3b82f6', // Blue - Gold tier
  '#a855f7', // Purple - Platinum tier
  '#fb923c', // Orange - Diamond tier
];

// Achievement tiers by category
export const ACHIEVEMENT_TIERS: Record<AchievementCategory, number[]> = {
  levels: [10, 25, 50, 100, 500],
  chapters: [50, 100, 500, 1000, 5000],
  investments: [1000, 5000, 10000, 50000, 100000],
  tasks: [50, 100, 500, 1000, 5000],
  training: [50, 100, 500, 1000, 5000],
  focus: [60, 300, 600, 3000, 6000], // in minutes: 1h, 5h, 10h, 50h, 100h
  mood: [50, 100, 500, 1000, 5000],
};

// Helper functions
export function calculateCompletedTiers(value: number, tiers: number[]): number {
  return tiers.filter((tier) => value >= tier).length;
}

export function calculateProgress(value: number, target: number): number {
  return Math.min(100, Math.round((value / target) * 100));
}

export function formatCurrency(value: number, currency: string, language: Language): string {
  const symbol = currency === 'USD' ? '$' : 'R$';
  const formatter = new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${symbol} ${formatter.format(value)}`;
}

export function formatHours(minutes: number): string {
  const totalMinutes = Math.max(0, Number(minutes) || 0);
  const hours = totalMinutes / 60;
  const decimals = hours >= 10 ? 0 : 1;
  return `${hours.toFixed(decimals)} h`;
}

export function calculateAchievementStats(
  achievements: Achievement[]
): Omit<AchievementStats, 'achievements'> {
  const totalTiers = achievements.reduce((sum, a) => sum + a.tiers.length, 0);
  const completedTiers = achievements.reduce(
    (sum, a) => sum + calculateCompletedTiers(a.currentValue, a.tiers),
    0
  );
  const completionPercent =
    totalTiers === 0 ? 0 : Math.min(100, Math.round((completedTiers / totalTiers) * 100));

  return {
    totalTiers,
    completedTiers,
    completionPercent,
  };
}

// Translations
const translations = {
  en: {
    achievements: 'Achievements',
    overallTitle: 'Achievement Completion',
    overallLabel: (completed: number, total: number) => `${completed}/${total} milestones complete`,
    completed: 'Completed',
    progress: (current: number, target: number) => `${current} / ${target}`,
    // Category titles
    levelsTitle: 'Level Milestones',
    chaptersTitle: 'Chapters Read',
    investmentsTitle: (currency: string) => `${currency} Invested`,
    tasksTitle: 'Tasks Completed',
    trainingTitle: 'Training Sessions',
    focusTitle: 'Focused Hours',
    moodTitle: 'Mood Logs',
    // Tier labels
    levelLabel: (level: number) => `Reach level ${level}`,
    chaptersLabel: (count: number) => `${count} chapter(s) read`,
    investedLabel: (amount: string) => `${amount} invested`,
    tasksLabel: (count: number) => `${count} task(s) completed`,
    trainingLabel: (count: number) => `${count} session(s) logged`,
    focusLabel: (hours: string) => `${hours} focused`,
    moodLabel: (count: number) => `${count} mood log(s)`,
    // Empty state
    noData: 'Start using the modules to earn achievements!',
  },
  pt: {
    achievements: 'Conquistas',
    overallTitle: 'Conclusão das Conquistas',
    overallLabel: (completed: number, total: number) => `${completed}/${total} metas concluídas`,
    completed: 'Concluído',
    progress: (current: number, target: number) => `${current} / ${target}`,
    // Category titles
    levelsTitle: 'Marcos de Nível',
    chaptersTitle: 'Capítulos Lidos',
    investmentsTitle: (currency: string) => `${currency} Investidos`,
    tasksTitle: 'Tarefas Finalizadas',
    trainingTitle: 'Sessões de Treino',
    focusTitle: 'Horas Concentradas',
    moodTitle: 'Registros de Humor',
    // Tier labels
    levelLabel: (level: number) => `Chegar ao nível ${level}`,
    chaptersLabel: (count: number) => `${count} capítulo(s) lido(s)`,
    investedLabel: (amount: string) => `${amount} investidos`,
    tasksLabel: (count: number) => `${count} tarefa(s) finalizada(s)`,
    trainingLabel: (count: number) => `${count} treino(s) registrado(s)`,
    focusLabel: (hours: string) => `${hours} concentrada(s)`,
    moodLabel: (count: number) => `${count} registro(s) de humor`,
    // Empty state
    noData: 'Comece a usar os módulos para ganhar conquistas!',
  },
};

export type TranslationKey = keyof typeof translations.en;
type TranslationValue = typeof translations.en[TranslationKey];

export function t(key: TranslationKey, language: Language): TranslationValue {
  return translations[language]?.[key] ?? translations.en[key];
}

// Build achievements array with current values
export function buildAchievements(
  language: Language,
  currency: string,
  values: {
    level: number;
    chaptersRead: number;
    totalInvested: number;
    tasksCompleted: number;
    trainingSessions: number;
    focusMinutes: number;
    moodLogs: number;
  }
): Achievement[] {
  const trans = translations[language] ?? translations.en;

  return [
    {
      key: 'levels',
      title: trans.levelsTitle,
      currentValue: values.level,
      tiers: ACHIEVEMENT_TIERS.levels,
      labelFn: (target) => trans.levelLabel(target),
    },
    {
      key: 'chapters',
      title: trans.chaptersTitle,
      currentValue: values.chaptersRead,
      tiers: ACHIEVEMENT_TIERS.chapters,
      labelFn: (target) => trans.chaptersLabel(target),
    },
    {
      key: 'investments',
      title: typeof trans.investmentsTitle === 'function'
        ? trans.investmentsTitle(currency)
        : trans.investmentsTitle,
      currentValue: values.totalInvested,
      tiers: ACHIEVEMENT_TIERS.investments,
      labelFn: (target) => trans.investedLabel(formatCurrency(target, currency, language)),
    },
    {
      key: 'tasks',
      title: trans.tasksTitle,
      currentValue: values.tasksCompleted,
      tiers: ACHIEVEMENT_TIERS.tasks,
      labelFn: (target) => trans.tasksLabel(target),
    },
    {
      key: 'training',
      title: trans.trainingTitle,
      currentValue: values.trainingSessions,
      tiers: ACHIEVEMENT_TIERS.training,
      labelFn: (target) => trans.trainingLabel(target),
    },
    {
      key: 'focus',
      title: trans.focusTitle,
      currentValue: values.focusMinutes,
      tiers: ACHIEVEMENT_TIERS.focus,
      labelFn: (target) => trans.focusLabel(formatHours(target)),
    },
    {
      key: 'mood',
      title: trans.moodTitle,
      currentValue: values.moodLogs,
      tiers: ACHIEVEMENT_TIERS.mood,
      labelFn: (target) => trans.moodLabel(target),
    },
  ];
}
