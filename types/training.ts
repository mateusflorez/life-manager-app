// Training module types and helpers

export type Exercise = {
  id: string;
  name: string;
  createdAt: string;
};

export type TrainingSet = {
  load: number; // weight in kg/lbs
  reps: number;
};

export type TrainingSession = {
  id: string;
  exerciseId: string;
  date: string; // "YYYY-MM-DD"
  load: number; // weight in kg/lbs (legacy, first set)
  reps: number; // (legacy, first set)
  sets?: TrainingSet[]; // array of sets (new format)
  notes?: string;
  createdAt: string;
};

export type ExerciseWithStats = Exercise & {
  totalSessions: number;
  totalVolume: number;
  sessions: TrainingSession[];
};

export type SessionWithExercise = TrainingSession & {
  exerciseName: string;
  volume: number;
};

// Constants
export const TRAINING_XP = 10;

// Helper functions
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function calculateVolume(load: number, reps: number): number {
  return Number((load * reps).toFixed(2));
}

export function calculateSessionVolume(session: TrainingSession): number {
  if (session.sets && session.sets.length > 0) {
    return session.sets.reduce((sum, set) => sum + calculateVolume(set.load, set.reps), 0);
  }
  return calculateVolume(session.load, session.reps);
}

export function getSessionSets(session: TrainingSession): TrainingSet[] {
  if (session.sets && session.sets.length > 0) {
    return session.sets;
  }
  return [{ load: session.load, reps: session.reps }];
}

export const MAX_SETS = 10;

export function formatDate(dateStr: string, language: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  if (language === 'pt') {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDate(dateStr: string, language: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  if (language === 'pt') {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getLast60Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 59; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push(key);
  }
  return days;
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    days.push(key);
  }
  return days;
}

export function getWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

// Translations
type TranslationKey =
  | 'training'
  | 'exercises'
  | 'sessions'
  | 'totalVolume'
  | 'logSession'
  | 'load'
  | 'reps'
  | 'notes'
  | 'notesOptional'
  | 'last60Days'
  | 'noTraining'
  | 'addSession'
  | 'addExercise'
  | 'newExercise'
  | 'exerciseName'
  | 'selectExercise'
  | 'date'
  | 'recentSessions'
  | 'viewAllExercises'
  | 'sessionHistory'
  | 'deleteExercise'
  | 'deleteExerciseConfirm'
  | 'cancel'
  | 'delete'
  | 'save'
  | 'create'
  | 'noExercises'
  | 'noSessions'
  | 'createExerciseFirst'
  | 'volumeOverTime'
  | 'today'
  | 'thisWeek'
  | 'volume'
  | 'exerciseCreated'
  | 'sessionLogged'
  | 'exerciseDeleted'
  | 'invalidLoad'
  | 'invalidReps'
  | 'enterExerciseName'
  | 'exerciseExists'
  | 'editExercise'
  | 'editSession'
  | 'exerciseUpdated'
  | 'sessionUpdated'
  | 'sets'
  | 'addSet'
  | 'set'
  | 'removeSet';

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    training: 'Training',
    exercises: 'Exercises',
    sessions: 'Sessions',
    totalVolume: 'Total Volume',
    logSession: 'Log Session',
    load: 'Load',
    reps: 'Reps',
    notes: 'Notes',
    notesOptional: 'Notes (optional)',
    last60Days: 'Last 60 Days',
    noTraining: 'No training',
    addSession: 'Add Session',
    addExercise: 'Add Exercise',
    newExercise: 'New Exercise',
    exerciseName: 'Exercise name',
    selectExercise: 'Select exercise',
    date: 'Date',
    recentSessions: 'Recent Sessions',
    viewAllExercises: 'View All Exercises',
    sessionHistory: 'Session History',
    deleteExercise: 'Delete Exercise',
    deleteExerciseConfirm: 'Are you sure you want to delete this exercise and all its sessions?',
    cancel: 'Cancel',
    delete: 'Delete',
    save: 'Save',
    create: 'Create',
    noExercises: 'No exercises yet. Create one to start tracking!',
    noSessions: 'No sessions logged yet.',
    createExerciseFirst: 'Create an exercise first',
    volumeOverTime: 'Volume Over Time',
    today: 'Today',
    thisWeek: 'This Week',
    volume: 'vol',
    exerciseCreated: 'Exercise created!',
    sessionLogged: 'Session logged! +10 XP',
    exerciseDeleted: 'Exercise deleted',
    invalidLoad: 'Enter a valid load',
    invalidReps: 'Enter valid reps',
    enterExerciseName: 'Enter exercise name',
    exerciseExists: 'Exercise already exists',
    editExercise: 'Edit Exercise',
    editSession: 'Edit Session',
    exerciseUpdated: 'Exercise updated!',
    sessionUpdated: 'Session updated!',
    sets: 'Sets',
    addSet: '+ Add set',
    set: 'Set',
    removeSet: 'Remove set',
  },
  pt: {
    training: 'Treino',
    exercises: 'Exercícios',
    sessions: 'Treinos',
    totalVolume: 'Volume Total',
    logSession: 'Registrar Treino',
    load: 'Carga',
    reps: 'Repetições',
    notes: 'Notas',
    notesOptional: 'Notas (opcional)',
    last60Days: 'Últimos 60 Dias',
    noTraining: 'Sem treino',
    addSession: 'Adicionar Treino',
    addExercise: 'Adicionar Exercício',
    newExercise: 'Novo Exercício',
    exerciseName: 'Nome do exercício',
    selectExercise: 'Selecionar exercício',
    date: 'Data',
    recentSessions: 'Treinos Recentes',
    viewAllExercises: 'Ver Todos Exercícios',
    sessionHistory: 'Histórico de Treinos',
    deleteExercise: 'Excluir Exercício',
    deleteExerciseConfirm: 'Tem certeza que deseja excluir este exercício e todos os seus treinos?',
    cancel: 'Cancelar',
    delete: 'Excluir',
    save: 'Salvar',
    create: 'Criar',
    noExercises: 'Nenhum exercício ainda. Crie um para começar!',
    noSessions: 'Nenhum treino registrado ainda.',
    createExerciseFirst: 'Crie um exercício primeiro',
    volumeOverTime: 'Volume ao Longo do Tempo',
    today: 'Hoje',
    thisWeek: 'Esta Semana',
    volume: 'vol',
    exerciseCreated: 'Exercício criado!',
    sessionLogged: 'Treino registrado! +10 XP',
    exerciseDeleted: 'Exercício excluído',
    invalidLoad: 'Informe uma carga válida',
    invalidReps: 'Informe repetições válidas',
    enterExerciseName: 'Digite o nome do exercício',
    exerciseExists: 'Exercício já existe',
    editExercise: 'Editar Exercício',
    editSession: 'Editar Treino',
    exerciseUpdated: 'Exercício atualizado!',
    sessionUpdated: 'Treino atualizado!',
    sets: 'Séries',
    addSet: '+ Adicionar série',
    set: 'Série',
    removeSet: 'Remover série',
  },
};

export function t(key: TranslationKey, language: string): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}
