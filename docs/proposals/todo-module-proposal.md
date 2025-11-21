# Todo Module Proposal

## Overview

The Todo module provides task management with support for one-time tasks and recurring tasks (daily, weekly, monthly). Each task type has specific properties and completion behaviors.

---

## Data Models

### Task Types

```typescript
type TaskType = 'todo' | 'daily' | 'weekly' | 'monthly';

type BaseTask = {
  id: string;
  name: string;
  tag?: string;        // Optional tag for categorization
  createdAt: string;   // ISO date string
};

// One-time tasks (avulsos)
type TodoTask = BaseTask & {
  type: 'todo';
  date?: string;       // Optional date (YYYY-MM-DD)
  time?: string;       // Optional time (HH:mm)
};

// Daily recurring tasks
type DailyTask = BaseTask & {
  type: 'daily';
  time?: string;       // Optional time (HH:mm) - no date since it's daily
};

// Weekly recurring tasks
type WeeklyTask = BaseTask & {
  type: 'weekly';
  date?: string;       // Optional date (YYYY-MM-DD)
  time?: string;       // Optional time (HH:mm)
};

// Monthly recurring tasks
type MonthlyTask = BaseTask & {
  type: 'monthly';
  date?: string;       // Optional date (YYYY-MM-DD)
  time?: string;       // Optional time (HH:mm)
};

type Task = TodoTask | DailyTask | WeeklyTask | MonthlyTask;
```

### Task Status

```typescript
// For one-time tasks (todo)
type TodoStatus = {
  [taskId: string]: boolean; // true = completed
};

// For recurring tasks (daily, weekly, monthly)
type RecurringStatus = {
  [taskId: string]: string | null; // ISO date of last completion, null = not done this cycle
};

type TaskState = {
  todoStatus: TodoStatus;
  dailyStatus: RecurringStatus;
  weeklyStatus: RecurringStatus;
  monthlyStatus: RecurringStatus;
};
```

---

## Due Date Logic

| Condition | Due Date |
|-----------|----------|
| Has date + time | Exact datetime specified |
| Has date only | 23:59:59 of that date |
| Has time only (daily tasks) | That time today |
| No date or time | No due date (anytime) |

```typescript
const calculateDueDate = (task: Task): Date | null => {
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
};
```

---

## Completion Behavior

### One-time Tasks (Todo)

- **On completion**: Task is marked as completed and removed from list
- **XP reward**: +50 XP
- **Stats**: Increment "completed tasks" counter

### Recurring Tasks (Daily/Weekly/Monthly)

- **On completion**: Record completion date, checkbox checked for current cycle
- **Cycle reset**: Checkbox unchecks automatically when new cycle begins
- **XP reward**: +50 XP per completion
- **Stats**: Increment "completed tasks" counter

| Type | Cycle Definition |
|------|------------------|
| Daily | Resets at midnight (00:00) |
| Weekly | Resets on Monday (ISO week) |
| Monthly | Resets on 1st of month |

```typescript
const isCycleComplete = (
  type: 'daily' | 'weekly' | 'monthly',
  lastCompletionDate: string | null
): boolean => {
  if (!lastCompletionDate) return false;

  const lastCompletion = new Date(lastCompletionDate);
  const today = new Date();

  switch (type) {
    case 'daily':
      return isSameDay(lastCompletion, today);
    case 'weekly':
      return isSameISOWeek(lastCompletion, today);
    case 'monthly':
      return isSameMonth(lastCompletion, today);
  }
};
```

---

## Storage Structure

```
AsyncStorage Keys:
├── @life_manager_tasks              # All tasks
├── @life_manager_task_state         # Task completion states
└── @life_manager_account            # XP and stats (existing)
```

### Tasks Storage

```typescript
type TasksStorage = {
  todo: TodoTask[];
  daily: DailyTask[];
  weekly: WeeklyTask[];
  monthly: MonthlyTask[];
};
```

---

## UI Components

### 1. Task Board Screen (`app/(tabs)/tasks.tsx`)

Main view showing all task sections with add/complete functionality.

```
┌────────────────────────────────────────┐
│ Tasks                            [+]   │
├────────────────────────────────────────┤
│                                        │
│ ▼ To-do (3)                           │
│ ┌──────────────────────────────────┐  │
│ │ [ ] Buy groceries                │  │
│ │     📅 Today 18:00  #shopping    │  │
│ ├──────────────────────────────────┤  │
│ │ [ ] Call dentist                 │  │
│ │     📅 Nov 25  #health           │  │
│ ├──────────────────────────────────┤  │
│ │ [ ] Fix bike                     │  │
│ │     #maintenance                 │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ▼ Daily (2)                           │
│ ┌──────────────────────────────────┐  │
│ │ [✓] Exercise                     │  │
│ │     ⏰ 07:00  #health            │  │
│ ├──────────────────────────────────┤  │
│ │ [ ] Read 30 min                  │  │
│ │     #learning                    │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ▼ Weekly (1)                          │
│ ┌──────────────────────────────────┐  │
│ │ [ ] Review finances              │  │
│ │     📅 Sunday  #finance          │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ▼ Monthly (1)                         │
│ ┌──────────────────────────────────┐  │
│ │ [✓] Pay rent                     │  │
│ │     📅 Day 5  #bills             │  │
│ └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

### 2. Add Task Modal

```
┌────────────────────────────────────────┐
│ Add Task                          [X]  │
├────────────────────────────────────────┤
│                                        │
│ Type                                   │
│ ┌────┐ ┌─────┐ ┌──────┐ ┌───────┐    │
│ │Todo│ │Daily│ │Weekly│ │Monthly│    │
│ └────┘ └─────┘ └──────┘ └───────┘    │
│                                        │
│ Name *                                 │
│ ┌──────────────────────────────────┐  │
│ │ Enter task name...               │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Date (optional)          [For non-daily]│
│ ┌──────────────────────────────────┐  │
│ │ 📅 Select date...                │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Time (optional)                        │
│ ┌──────────────────────────────────┐  │
│ │ ⏰ Select time...                │  │
│ └──────────────────────────────────┘  │
│                                        │
│ Tag (optional)                         │
│ ┌──────────────────────────────────┐  │
│ │ # Enter tag...                   │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │           Add Task               │  │
│ └──────────────────────────────────┘  │
│                                        │
└────────────────────────────────────────┘
```

### 3. Task Item Component

```typescript
type TaskItemProps = {
  task: Task;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete?: () => void; // Only for todo tasks
};
```

Features:
- Checkbox for completion toggle
- Task name (primary text)
- Due date/time display (secondary text)
- Tag badge
- Swipe to delete (todo tasks only)
- Visual indication of overdue tasks (red text/border)

---

## Context API

```typescript
type TodoContextValue = {
  // Tasks
  tasks: TasksStorage;
  loading: boolean;

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  deleteTask: (type: TaskType, taskId: string) => Promise<void>;
  toggleTask: (type: TaskType, taskId: string) => Promise<void>;

  // Status
  getTaskStatus: (type: TaskType, taskId: string) => boolean;

  // Stats
  getTodayProgress: () => { completed: number; total: number };
};
```

---

## Home Screen Integration

### Quick Stats Card

```
┌────────────────────────────────────────┐
│ 📋 Tasks                    View All → │
├────────────────────────────────────────┤
│                                        │
│  Today's Progress                      │
│  ████████░░░░░░░░  5/8 completed      │
│                                        │
│  Overdue: 2 tasks                      │
│                                        │
└────────────────────────────────────────┘
```

### Module Toggle

Add `tasks` to `ModulesConfig`:

```typescript
type ModulesConfig = {
  finance: boolean;
  investments: boolean;
  tasks: boolean; // NEW
};
```

---

## File Structure

```
app/
├── (tabs)/
│   └── tasks.tsx              # Main tasks screen (tab)
├── tasks/
│   ├── _layout.tsx            # Tasks stack layout
│   └── add.tsx                # Add task modal

components/
├── tasks/
│   ├── task-item.tsx          # Single task row
│   ├── task-section.tsx       # Collapsible section
│   ├── task-form.tsx          # Add/edit task form
│   └── tasks-card.tsx         # Home screen card

contexts/
└── tasks-context.tsx          # Tasks state management

services/
└── tasks-storage.ts           # AsyncStorage operations

types/
└── tasks.ts                   # Type definitions + helpers
```

---

## Translations

```typescript
const translations = {
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
  },
};
```

---

## XP and Stats Integration

On task completion:
1. Award +50 XP to account
2. Increment "completed tasks" counter
3. For todo tasks: remove from list after completion

```typescript
const completeTask = async (type: TaskType, taskId: string) => {
  // 1. Update task status
  await updateTaskStatus(type, taskId);

  // 2. Award XP
  await accountContext.addXp(50);

  // 3. Increment completed tasks
  await accountContext.incrementCompletedTasks();

  // 4. Remove if todo task
  if (type === 'todo') {
    await deleteTask(type, taskId);
  }
};
```

---

## Implementation Priority

1. **Phase 1**: Core data models and storage
   - Types definition
   - Storage service
   - Context provider

2. **Phase 2**: Basic UI
   - Tasks tab screen
   - Task sections (collapsible)
   - Task item component
   - Add task modal

3. **Phase 3**: Completion logic
   - Toggle functionality
   - Cycle detection (daily/weekly/monthly)
   - XP integration

4. **Phase 4**: Polish
   - Home screen card
   - Overdue indicators
   - Swipe to delete
   - Animations

---

## Notes

- Daily tasks do not have a date field (they recur every day)
- Tags are single strings (no multi-tag support initially)
- Time is in 24h format (HH:mm)
- Date is in ISO format (YYYY-MM-DD)
- All timestamps stored in user's local timezone
