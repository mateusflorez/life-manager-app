import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Task,
  TaskType,
  TodoTask,
  DailyTask,
  WeeklyTask,
  MonthlyTask,
  TasksStorage,
  TaskState,
  DEFAULT_TASK_STATE,
  DEFAULT_TASKS_STORAGE,
  generateId,
  getTodayKey,
  getStatusField,
  isCycleComplete,
} from '@/types/tasks';

// Storage keys
const KEYS = {
  TASKS: '@life_manager_tasks',
  TASK_STATE: '@life_manager_task_state',
};

// ============ Tasks ============

export async function getTasks(accountId: string): Promise<TasksStorage> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    if (!data) return DEFAULT_TASKS_STORAGE;

    const allTasks: TasksStorage = JSON.parse(data);

    // Filter by accountId
    return {
      todo: allTasks.todo.filter((t) => t.accountId === accountId),
      daily: allTasks.daily.filter((t) => t.accountId === accountId),
      weekly: allTasks.weekly.filter((t) => t.accountId === accountId),
      monthly: allTasks.monthly.filter((t) => t.accountId === accountId),
    };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return DEFAULT_TASKS_STORAGE;
  }
}

export async function getTasksByType<T extends Task>(
  accountId: string,
  type: TaskType
): Promise<T[]> {
  try {
    const tasks = await getTasks(accountId);
    return tasks[type] as T[];
  } catch (error) {
    console.error(`Error getting ${type} tasks:`, error);
    return [];
  }
}

export async function saveTask(
  accountId: string,
  type: TaskType,
  name: string,
  options?: { date?: string; time?: string; tag?: string }
): Promise<Task> {
  const now = new Date().toISOString();
  const baseTask = {
    id: generateId(),
    accountId,
    name,
    tag: options?.tag,
    createdAt: now,
  };

  let newTask: Task;

  switch (type) {
    case 'todo':
      newTask = {
        ...baseTask,
        type: 'todo',
        date: options?.date,
        time: options?.time,
      } as TodoTask;
      break;
    case 'daily':
      newTask = {
        ...baseTask,
        type: 'daily',
        time: options?.time,
      } as DailyTask;
      break;
    case 'weekly':
      newTask = {
        ...baseTask,
        type: 'weekly',
        date: options?.date,
        time: options?.time,
      } as WeeklyTask;
      break;
    case 'monthly':
      newTask = {
        ...baseTask,
        type: 'monthly',
        date: options?.date,
        time: options?.time,
      } as MonthlyTask;
      break;
  }

  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    const allTasks: TasksStorage = data ? JSON.parse(data) : DEFAULT_TASKS_STORAGE;
    allTasks[type].push(newTask as never);
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(allTasks));
    return newTask;
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
}

export async function updateTask(task: Task): Promise<Task> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    const allTasks: TasksStorage = data ? JSON.parse(data) : DEFAULT_TASKS_STORAGE;

    const index = allTasks[task.type].findIndex((t) => t.id === task.id);
    if (index === -1) throw new Error('Task not found');

    allTasks[task.type][index] = task as never;
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(allTasks));
    return task;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

export async function deleteTask(type: TaskType, taskId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    const allTasks: TasksStorage = data ? JSON.parse(data) : DEFAULT_TASKS_STORAGE;

    allTasks[type] = allTasks[type].filter((t) => t.id !== taskId) as never;
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(allTasks));

    // Also clean up status
    await deleteTaskStatus(type, taskId);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

export async function deleteTasksByAccount(accountId: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TASKS);
    const allTasks: TasksStorage = data ? JSON.parse(data) : DEFAULT_TASKS_STORAGE;

    // Get task IDs to delete for cleanup
    const taskIdsToDelete: { type: TaskType; id: string }[] = [];

    (['todo', 'daily', 'weekly', 'monthly'] as TaskType[]).forEach((type) => {
      allTasks[type].forEach((task) => {
        if (task.accountId === accountId) {
          taskIdsToDelete.push({ type, id: task.id });
        }
      });
      allTasks[type] = allTasks[type].filter((t) => t.accountId !== accountId) as never;
    });

    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(allTasks));

    // Clean up status for deleted tasks
    for (const { type, id } of taskIdsToDelete) {
      await deleteTaskStatus(type, id);
    }
  } catch (error) {
    console.error('Error deleting tasks by account:', error);
  }
}

// ============ Task State ============

export async function getTaskState(accountId: string): Promise<TaskState> {
  try {
    const data = await AsyncStorage.getItem(`${KEYS.TASK_STATE}_${accountId}`);
    if (!data) return DEFAULT_TASK_STATE;
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting task state:', error);
    return DEFAULT_TASK_STATE;
  }
}

export async function saveTaskState(accountId: string, state: TaskState): Promise<void> {
  try {
    await AsyncStorage.setItem(`${KEYS.TASK_STATE}_${accountId}`, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving task state:', error);
    throw error;
  }
}

export async function setTaskStatus(
  accountId: string,
  type: TaskType,
  taskId: string,
  completed: boolean
): Promise<void> {
  try {
    const state = await getTaskState(accountId);
    const field = getStatusField(type);

    if (type === 'todo') {
      // Boolean status for one-time tasks
      if (completed) {
        state[field][taskId] = true;
      } else {
        delete state[field][taskId];
      }
    } else {
      // Date-based status for recurring tasks
      if (completed) {
        (state[field] as Record<string, string | null>)[taskId] = getTodayKey();
      } else {
        (state[field] as Record<string, string | null>)[taskId] = null;
      }
    }

    await saveTaskState(accountId, state);
  } catch (error) {
    console.error('Error setting task status:', error);
    throw error;
  }
}

async function deleteTaskStatus(type: TaskType, taskId: string): Promise<void> {
  // Note: This is a simplified cleanup. In production, we'd need accountId.
  // Since status is stored per-account, orphaned statuses won't affect anything.
}

export async function isTaskCompleted(
  accountId: string,
  type: TaskType,
  taskId: string
): Promise<boolean> {
  try {
    const state = await getTaskState(accountId);
    const field = getStatusField(type);

    if (type === 'todo') {
      return Boolean(state[field][taskId]);
    } else {
      const lastCompletion = (state[field] as Record<string, string | null>)[taskId];
      return isCycleComplete(type, lastCompletion);
    }
  } catch (error) {
    console.error('Error checking task completion:', error);
    return false;
  }
}

// ============ Combined Queries ============

export type TaskWithStatus = Task & { isCompleted: boolean };
export type TodoTaskWithStatus = TodoTask & { isCompleted: boolean };
export type DailyTaskWithStatus = DailyTask & { isCompleted: boolean };
export type WeeklyTaskWithStatus = WeeklyTask & { isCompleted: boolean };
export type MonthlyTaskWithStatus = MonthlyTask & { isCompleted: boolean };

export async function getTasksWithStatus(accountId: string): Promise<{
  todo: TodoTaskWithStatus[];
  daily: DailyTaskWithStatus[];
  weekly: WeeklyTaskWithStatus[];
  monthly: MonthlyTaskWithStatus[];
}> {
  try {
    const tasks = await getTasks(accountId);
    const state = await getTaskState(accountId);

    const addStatus = <T extends Task>(
      items: T[],
      type: TaskType
    ): (T & { isCompleted: boolean })[] => {
      const field = getStatusField(type);
      return items.map((task) => {
        let isCompleted = false;
        if (type === 'todo') {
          isCompleted = Boolean(state[field][task.id]);
        } else {
          const lastCompletion = (state[field] as Record<string, string | null>)[task.id];
          isCompleted = isCycleComplete(type, lastCompletion);
        }
        return { ...task, isCompleted };
      });
    };

    return {
      todo: addStatus(tasks.todo, 'todo'),
      daily: addStatus(tasks.daily, 'daily'),
      weekly: addStatus(tasks.weekly, 'weekly'),
      monthly: addStatus(tasks.monthly, 'monthly'),
    };
  } catch (error) {
    console.error('Error getting tasks with status:', error);
    return {
      todo: [],
      daily: [],
      weekly: [],
      monthly: [],
    };
  }
}

export async function getTodayProgress(accountId: string): Promise<{
  completed: number;
  total: number;
  overdue: number;
}> {
  try {
    const tasksWithStatus = await getTasksWithStatus(accountId);

    // Count all recurring tasks (daily/weekly/monthly) + non-completed todo tasks
    const dailyTotal = tasksWithStatus.daily.length;
    const weeklyTotal = tasksWithStatus.weekly.length;
    const monthlyTotal = tasksWithStatus.monthly.length;
    const todoTotal = tasksWithStatus.todo.filter((t) => !t.isCompleted).length;

    const dailyCompleted = tasksWithStatus.daily.filter((t) => t.isCompleted).length;
    const weeklyCompleted = tasksWithStatus.weekly.filter((t) => t.isCompleted).length;
    const monthlyCompleted = tasksWithStatus.monthly.filter((t) => t.isCompleted).length;

    // For today's progress, we count daily tasks + any todo with due date today
    const todayKey = getTodayKey();
    const todayTodoTasks = tasksWithStatus.todo.filter((t) => t.date === todayKey);
    const todayTodoCompleted = todayTodoTasks.filter((t) => t.isCompleted).length;

    // Count overdue tasks
    const now = new Date();
    let overdue = 0;

    tasksWithStatus.todo.forEach((task) => {
      if (task.isCompleted) return;
      if (task.date) {
        const dueDate = new Date(task.date);
        if (task.time) {
          const [hours, minutes] = task.time.split(':').map(Number);
          dueDate.setHours(hours, minutes);
        } else {
          dueDate.setHours(23, 59, 59, 999);
        }
        if (now > dueDate) overdue++;
      }
    });

    return {
      completed:
        dailyCompleted +
        weeklyCompleted +
        monthlyCompleted +
        todayTodoCompleted,
      total:
        dailyTotal +
        weeklyTotal +
        monthlyTotal +
        todayTodoTasks.length,
      overdue,
    };
  } catch (error) {
    console.error('Error getting today progress:', error);
    return { completed: 0, total: 0, overdue: 0 };
  }
}
