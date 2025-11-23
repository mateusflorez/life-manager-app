import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import {
  Task,
  TaskType,
  TASK_XP_REWARD,
} from '@/types/tasks';
import * as TasksStorage from '@/services/tasks-storage';
import { TaskWithStatus } from '@/services/tasks-storage';
import { useAccount } from './account-context';

type TasksContextType = {
  // Tasks by type
  tasks: {
    todo: TaskWithStatus[];
    daily: TaskWithStatus[];
    weekly: TaskWithStatus[];
    monthly: TaskWithStatus[];
  };

  // Progress
  todayProgress: {
    completed: number;
    total: number;
    overdue: number;
  };

  // Task CRUD
  createTask: (
    type: TaskType,
    name: string,
    options?: { date?: string; time?: string; tag?: string }
  ) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (type: TaskType, taskId: string) => Promise<void>;

  // Task completion
  toggleTask: (type: TaskType, taskId: string) => Promise<void>;
  isTaskCompleted: (type: TaskType, taskId: string) => boolean;

  // State
  loading: boolean;
  refreshData: () => Promise<void>;
};

const TasksContext = createContext<TasksContextType | undefined>(undefined);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { account, updateAccount } = useAccount();
  const accountRef = useRef(account);
  accountRef.current = account;

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<{
    todo: TaskWithStatus[];
    daily: TaskWithStatus[];
    weekly: TaskWithStatus[];
    monthly: TaskWithStatus[];
  }>({
    todo: [],
    daily: [],
    weekly: [],
    monthly: [],
  });
  const [todayProgress, setTodayProgress] = useState({
    completed: 0,
    total: 0,
    overdue: 0,
  });

  // Load initial data
  const loadData = useCallback(async (showLoading = false) => {
    const currentAccount = accountRef.current;
    if (!currentAccount) {
      setTasks({ todo: [], daily: [], weekly: [], monthly: [] });
      setTodayProgress({ completed: 0, total: 0, overdue: 0 });
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
    try {
      // Load tasks with status
      const tasksData = await TasksStorage.getTasksWithStatus(currentAccount.id);
      setTasks(tasksData);

      // Calculate today's progress
      const progress = await TasksStorage.getTodayProgress(currentAccount.id);
      setTodayProgress(progress);
    } catch (error) {
      console.error('Error loading tasks data:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // Task CRUD operations
  const createTask = async (
    type: TaskType,
    name: string,
    options?: { date?: string; time?: string; tag?: string }
  ): Promise<Task> => {
    const currentAccount = accountRef.current;
    if (!currentAccount) throw new Error('No account selected');
    const newTask = await TasksStorage.saveTask(currentAccount.id, type, name, options);
    await loadData();
    return newTask;
  };

  const updateTask = async (task: Task): Promise<void> => {
    await TasksStorage.updateTask(task);
    await loadData();
  };

  const deleteTask = async (type: TaskType, taskId: string): Promise<void> => {
    await TasksStorage.deleteTask(type, taskId);
    await loadData();
  };

  // Task completion
  const toggleTask = async (type: TaskType, taskId: string): Promise<void> => {
    const currentAccount = accountRef.current;
    if (!currentAccount) throw new Error('No account selected');

    // Find current status
    const taskList = tasks[type];
    const task = taskList.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = !task.isCompleted;

    // Update status in storage
    await TasksStorage.setTaskStatus(currentAccount.id, type, taskId, newStatus);

    // Award XP on completion
    if (newStatus) {
      await updateAccount({
        xp: (currentAccount.xp || 0) + TASK_XP_REWARD,
        completedTasks: (currentAccount.completedTasks || 0) + 1,
      });

      // For todo tasks, remove after completion
      if (type === 'todo') {
        await TasksStorage.deleteTask(type, taskId);
      }
    }

    await loadData();
  };

  const isTaskCompleted = (type: TaskType, taskId: string): boolean => {
    const taskList = tasks[type];
    const task = taskList.find((t) => t.id === taskId);
    return task?.isCompleted ?? false;
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        todayProgress,
        createTask,
        updateTask,
        deleteTask,
        toggleTask,
        isTaskCompleted,
        loading,
        refreshData,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
