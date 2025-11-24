// Tasks module types

export type TaskType = 'todo' | 'daily' | 'weekly' | 'monthly';

// Base task properties
type BaseTask = {
  id: string;
  accountId: string;
  name: string;
  tag?: string;
  createdAt: string;
};

// One-time tasks (avulsos)
export type TodoTask = BaseTask & {
  type: 'todo';
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
};

// Daily recurring tasks
export type DailyTask = BaseTask & {
  type: 'daily';
  time?: string; // HH:mm (no date since it's daily)
};

// Weekly recurring tasks
export type WeeklyTask = BaseTask & {
  type: 'weekly';
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
};

// Monthly recurring tasks
export type MonthlyTask = BaseTask & {
  type: 'monthly';
  date?: string; // YYYY-MM-DD
  time?: string; // HH:mm
};

export type Task = TodoTask | DailyTask | WeeklyTask | MonthlyTask;

// Storage structure for all tasks
export type TasksStorage = {
  todo: TodoTask[];
  daily: DailyTask[];
  weekly: WeeklyTask[];
  monthly: MonthlyTask[];
};

// Status tracking
export type TodoStatus = {
  [taskId: string]: boolean; // true = completed
};

export type RecurringStatus = {
  [taskId: string]: string | null; // ISO date of last completion
};

export type TaskState = {
  todoStatus: TodoStatus;
  dailyStatus: RecurringStatus;
  weeklyStatus: RecurringStatus;
  monthlyStatus: RecurringStatus;
};

// Default empty state
export const DEFAULT_TASK_STATE: TaskState = {
  todoStatus: {},
  dailyStatus: {},
  weeklyStatus: {},
  monthlyStatus: {},
};

export const DEFAULT_TASKS_STORAGE: TasksStorage = {
  todo: [],
  daily: [],
  weekly: [],
  monthly: [],
};

// XP reward per task completion
export const TASK_XP_REWARD = 50;

// Helper to generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Helper to get today's date as YYYY-MM-DD
export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get current time as HH:mm
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper to format date for display
export function formatDate(dateStr: string, language: 'en' | 'pt'): string {
  const [year, month, day] = dateStr.split('-');
  if (language === 'pt') {
    return `${day}/${month}/${year}`;
  }
  return `${month}/${day}/${year}`;
}

// Helper to format time for display
export function formatTime(timeStr: string, language: 'en' | 'pt'): string {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);

  if (language === 'en') {
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  }

  return `${hours}:${minutes}`;
}

// Helper to check if two dates are the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Helper to get ISO week number
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// Helper to get ISO week year
function getISOWeekYear(date: Date): number {
  const d = new Date(date);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  return d.getFullYear();
}

// Helper to check if two dates are in the same ISO week
export function isSameWeek(date1: Date, date2: Date): boolean {
  return (
    getISOWeek(date1) === getISOWeek(date2) &&
    getISOWeekYear(date1) === getISOWeekYear(date2)
  );
}

// Helper to check if two dates are in the same month
export function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

// Check if a recurring task is completed for the current cycle
// Parse YYYY-MM-DD in local timezone (not UTC)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isCycleComplete(
  type: 'daily' | 'weekly' | 'monthly',
  lastCompletionDate: string | null
): boolean {
  if (!lastCompletionDate) return false;

  // Parse the date string in local timezone to avoid UTC shift
  const lastCompletion = parseLocalDate(lastCompletionDate);
  const today = new Date();

  switch (type) {
    case 'daily':
      return isSameDay(lastCompletion, today);
    case 'weekly':
      return isSameWeek(lastCompletion, today);
    case 'monthly':
      return isSameMonth(lastCompletion, today);
  }
}

// Calculate due date for a task
export function calculateDueDate(task: Task): Date | null {
  if (task.type === 'daily' && task.time) {
    // Daily with time: due at that time today
    const [hours, minutes] = task.time.split(':').map(Number);
    const due = new Date();
    due.setHours(hours, minutes, 0, 0);
    return due;
  }

  if ('date' in task && task.date) {
    const [year, month, day] = task.date.split('-').map(Number);

    if (task.time) {
      // Date + time: exact datetime
      const [hours, minutes] = task.time.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, 0, 0);
    }

    // Date only: end of day (23:59:59)
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }

  return null; // No due date
}

// Check if a task is overdue
export function isTaskOverdue(task: Task): boolean {
  const dueDate = calculateDueDate(task);
  if (!dueDate) return false;
  return new Date() > dueDate;
}

// Check if a task is due today
export function isDueToday(task: Task): boolean {
  const dueDate = calculateDueDate(task);
  if (!dueDate) return false;
  return isSameDay(dueDate, new Date());
}

// Generate tag slug from text
export function generateTagSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get status field name for task type
export function getStatusField(type: TaskType): keyof TaskState {
  switch (type) {
    case 'todo':
      return 'todoStatus';
    case 'daily':
      return 'dailyStatus';
    case 'weekly':
      return 'weeklyStatus';
    case 'monthly':
      return 'monthlyStatus';
  }
}

// Tasks translations
export const TASKS_TRANSLATIONS = {
  en: {
    tasks: 'Tasks',
    todo: 'To-do',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    addTask: 'Add Task',
    taskName: 'Task name',
    date: 'Date',
    time: 'Time',
    tag: 'Tag',
    optional: 'optional',
    noTasks: 'No tasks yet',
    completed: 'Completed',
    overdue: 'Overdue',
    dueToday: 'Due today',
    todayProgress: "Today's Progress",
    viewAll: 'View All',
    create: 'Create',
    cancel: 'Cancel',
    delete: 'Delete',
    taskCompleted: 'Task completed! +50 XP',
    taskAdded: 'Task added!',
    taskDeleted: 'Task deleted',
    taskUpdated: 'Task updated!',
    edit: 'Edit',
    save: 'Save',
    errorSaving: 'Error saving task',
    errorDeleting: 'Error deleting task',
    enterTaskName: 'Enter task name',
    selectType: 'Select type',
    allDone: 'All done!',
    noPendingTasks: 'No pending tasks',
    overdueCount: 'overdue',
    pendingCount: 'pending',
    completedCount: 'completed',
  },
  pt: {
    tasks: 'Tarefas',
    todo: 'Avulsas',
    daily: 'Diárias',
    weekly: 'Semanais',
    monthly: 'Mensais',
    addTask: 'Adicionar Tarefa',
    taskName: 'Nome da tarefa',
    date: 'Data',
    time: 'Hora',
    tag: 'Tag',
    optional: 'opcional',
    noTasks: 'Nenhuma tarefa ainda',
    completed: 'Concluída',
    overdue: 'Atrasada',
    dueToday: 'Vence hoje',
    todayProgress: 'Progresso de Hoje',
    viewAll: 'Ver Todas',
    create: 'Criar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    taskCompleted: 'Tarefa concluída! +50 XP',
    taskAdded: 'Tarefa adicionada!',
    taskDeleted: 'Tarefa excluída',
    taskUpdated: 'Tarefa atualizada!',
    edit: 'Editar',
    save: 'Salvar',
    errorSaving: 'Erro ao salvar tarefa',
    errorDeleting: 'Erro ao excluir tarefa',
    enterTaskName: 'Digite o nome da tarefa',
    selectType: 'Selecione o tipo',
    allDone: 'Tudo feito!',
    noPendingTasks: 'Nenhuma tarefa pendente',
    overdueCount: 'atrasadas',
    pendingCount: 'pendentes',
    completedCount: 'concluídas',
  },
};

export type TasksTranslationKey = keyof typeof TASKS_TRANSLATIONS.en;

export function t(key: TasksTranslationKey, language: 'en' | 'pt'): string {
  return TASKS_TRANSLATIONS[language][key] || TASKS_TRANSLATIONS.en[key] || key;
}
