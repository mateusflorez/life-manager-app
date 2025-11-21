# AGENTS.md

This file provides guidance to AI coding assistants when working with code in this repository.

You must always refer to me as MATEUZIN CRIA

As vezes EU VOU CONVERSAR COM VC EM PORTUGUÊS QUE É MINHA LINGUA NATIVA APENAS PRA ME EXPRESSAR MAIS FACILMENTE, mas VOCE irá ESCREVER E usar somente ingles!!!!!!

⚠️ IMPORTANT: Every time you start working on a new feature, fix a major bug, or make any significant change in the repository, you must update this AGENTS.md file to reflect new workflows, conventions, dependencies, or patterns.

## Repository Overview

**Life Manager Mobile** is a React Native mobile application built with Expo that helps users manage their daily life tasks, notes, and organization. This project is a transformation of an Obsidian vault into a native mobile app.

### Key Characteristics
- **Type**: Cross-platform mobile application (iOS, Android, Web)
- **Framework**: Expo SDK 54 with React Native 0.81.5
- **Navigation**: File-based routing using Expo Router 6
- **Language**: TypeScript 5.9.2 (strict mode)
- **State**: Local data storage (no backend API)
- **Theme**: Built-in light/dark mode support

### Project Statistics
- Primary language: TypeScript
- React: 19.1.0
- Started: 2025
- Status: Active development

### Implemented Features
- **Account System**: User profiles with XP/level progression and task tracking
- **Settings**: Language (EN/PT) and currency (USD/BRL) preferences, module toggles
- **Module System**: Enable/disable modules from settings (data preserved when disabled)
- **Finance Module**: Complete personal finance management
  - Bank accounts management
  - Monthly income/expense tracking
  - Credit cards with spending limits and installment support
  - View/delete card charges by month
  - Recurring expenses with month selector
  - Category-based expense tracking with translations
  - Charts (Pie chart for categories, Line chart for yearly trends)
- **Investments Module**: Track investments and contributions
  - Create multiple investment portfolios
  - Track contributions via "new total" input (auto-calculates delta)
  - Running total with percentage change vs previous
  - Movement history with tags support
  - 12-month line chart showing portfolio trends
  - Portfolio summary on home screen
- **Tasks Module**: Task management with recurring tasks
  - One-time tasks (to-do) with optional date, time, and tag
  - Daily recurring tasks with optional time and tag
  - Weekly recurring tasks with optional date, time, and tag
  - Monthly recurring tasks with optional date, time, and tag
  - Due date logic: date+time = exact datetime, date only = 23:59 of that day
  - XP rewards (+50) on task completion
  - Overdue task indicators
  - Cycle-based completion tracking (daily/weekly/monthly reset)
  - Today's progress tracking on home screen
- **Books Module**: Reading tracker for books and manga
  - Track books with or without total chapters (supports ongoing series)
  - Log chapters read with XP rewards (+20 per chapter)
  - Multiple reviews per book with optional chapter/range association
  - Progress tracking with completion status
  - Drop books feature (mark as abandoned)
  - Chapter history with timestamps
  - Monthly chapters read stat on profile screen
- **Mood Module**: Daily mood tracking and visualization
  - Track mood on 1-5 scale with emoji faces
  - 60-day trend line chart
  - Optional notes for each entry
  - Recent entries display and full history
  - Search through past entries
  - Streak tracking for consecutive days
  - XP rewards (+10 per mood log)
  - Mood module toggle in settings
- **Training Module**: Workout logging and exercise tracking
  - Create and manage exercises
  - Log sessions with load, reps, date, and notes
  - Volume calculation (load × reps)
  - 60-day activity heatmap
  - Exercise detail with volume chart
  - Session history per exercise
  - XP rewards (+10 per session logged)
  - Training module toggle in settings

---

## Quick Start

### Prerequisites
- Node.js 18+ or later
- pnpm (package manager in use)
- iOS Simulator (for iOS development) or Android Emulator (for Android)
- Expo Go app (for testing on physical devices)

### Linux-Specific Setup
If you encounter file watcher errors on Linux:
```bash
# Increase file watcher limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Initial Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm start
```

---

## Essential Commands

### Development
```bash
# Start Expo development server (shows QR code)
pnpm start

# Start on Android emulator/device
pnpm run android

# Start on iOS simulator (macOS only)
pnpm run ios

# Start web version
pnpm run web
```

### Code Quality
```bash
# Run linter
pnpm run lint

# Type check
pnpm exec tsc --noEmit
```

### Project Management
```bash
# Reset project to blank state
pnpm run reset-project
```

---

## Architecture and Key Concepts

### System Architecture

This is a **client-side React Native application** with:
- **File-based routing** (Expo Router)
- **Local-first data storage** (no backend API)
- **Theming system** (automatic light/dark mode)
- **Cross-platform support** (iOS, Android, Web)

```
┌─────────────────────────────────────┐
│     app/_layout.tsx (Root)          │
│  - Theme Provider                   │
│  - Navigation Stack                 │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼─────┐
│ index.tsx   │  │  (tabs)/  │
│ Welcome     │  │  Tab Nav  │
│ Screen      │  │           │
└─────────────┘  └─────┬─────┘
                       │
              ┌────────┴────────┐
              │                 │
        ┌─────▼─────┐   ┌──────▼──────┐
        │ index.tsx │   │ explore.tsx │
        │   Home    │   │   Explore   │
        └───────────┘   └─────────────┘
```

### 1. **File-Based Routing (Expo Router)**

Expo Router uses the file system to define routes. Files in `app/` directory automatically become routes.

- **Location**: `app/` directory
- **Key files**:
  - `app/_layout.tsx` - Root layout with theme provider
  - `app/index.tsx` - Welcome screen (entry point)
  - `app/(tabs)/_layout.tsx` - Tab navigation layout
  - `app/(tabs)/index.tsx` - Home screen
  - `app/(tabs)/explore.tsx` - Explore screen

**Route Groups**: Directories wrapped in parentheses like `(tabs)` create a layout without adding a URL segment.

**Navigation Example**:
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push('/(tabs)'); // Navigate to tabs
```

### 2. **Theming System**

The app has a built-in theme system supporting light and dark modes.

- **Theme definition**: `constants/theme.ts`
- **Theme hook**: `hooks/use-color-scheme.ts` (detects system theme)
- **Color resolver**: `hooks/use-theme-color.ts` (resolves colors based on theme)
- **Themed components**: `ThemedView`, `ThemedText` (auto-apply theme colors)

**Usage Example**:
```typescript
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

<ThemedView style={styles.container}>
  <ThemedText type="title">Hello</ThemedText>
</ThemedView>
```

**Color Structure**:
```typescript
Colors = {
  light: { text, background, tint, icon, tabIconDefault, tabIconSelected },
  dark: { text, background, tint, icon, tabIconDefault, tabIconSelected }
}
```

### 3. **Local Data Storage (Implemented)**

**IMPORTANT**: This app stores all data locally on the device using AsyncStorage. There is NO backend API.

**Storage Architecture**:
```
services/
├── account-storage.ts    # User account persistence
├── settings-storage.ts   # App settings persistence
├── finance-storage.ts    # Finance data persistence
└── investment-storage.ts # Investment data persistence
```

**Storage Keys** (AsyncStorage):
- `@life-manager/account` - User account data
- `@life-manager/settings` - Language, currency, and module preferences
- `@life-manager/finance/{accountId}/bank-accounts` - Bank accounts
- `@life-manager/finance/{accountId}/credit-cards` - Credit cards
- `@life-manager/finance/{accountId}/recurring-expenses` - Recurring expenses
- `@life-manager/finance/{accountId}/finance-months` - Monthly records
- `@life-manager/finance/{accountId}/finance-entries/{monthId}` - Month entries
- `@life-manager/finance/{accountId}/card-charges/{cardId}` - Card charges
- `@life_manager_investments` - Investment portfolios
- `@life_manager_investment_movements` - Investment movements/contributions
- `@life_manager_books` - Books data
- `@life_manager_book_chapters` - Chapter reading history
- `@life_manager_book_reviews` - Book reviews

**Context Providers** (wrap entire app in `app/_layout.tsx`):
```typescript
<SettingsProvider>
  <AccountProvider>
    <FinanceProvider>
      <InvestmentProvider>
        <TasksProvider>
          <BooksProvider>
            {children}
          </BooksProvider>
        </TasksProvider>
      </InvestmentProvider>
    </FinanceProvider>
  </AccountProvider>
</SettingsProvider>
```

### 4. **Finance Module**

Complete personal finance management system.

**Data Models** (`types/finance.ts`):
- `BankAccount` - Bank account with name, description
- `CreditCard` - Card with limit, close day, due day
- `CardCharge` - Individual card charge with category
- `RecurringExpense` - Monthly recurring expense
- `FinanceMonth` - Monthly record (year/month)
- `FinanceEntry` - Income/expense entry with category, amount, source

**Entry Sources**:
- `manual` - Manually entered by user
- `card` - Generated from credit card charges
- `recurring` - Generated from recurring expenses

**Default Categories** (translatable EN/PT):
- **Income**: Salary, Freelance, Investments, Gifts, Refunds, Other
- **Expense**: Housing, Food, Transport, Health, Education, Entertainment, Shopping, Subscriptions, Bills, Other

**Helper Functions** (`types/finance.ts`):
- `generateSlug(name)` - Create URL-safe slugs
- `generateId()` - Create unique IDs
- `getCurrentMonthKey()` - Get current month as "YYYY-MM" format
- `getNextMonthKey()` - Get next month as "YYYY-MM" format
- `getMonthOptions(monthsAhead)` - Generate array of month keys for selectors
- `addMonthsToKey(monthKey, monthsToAdd)` - Add N months to a month key
- `formatMonthKey(key, language)` - Format month key for display
- `getMonthName(month, language)` - Get translated month name
- `translateCategory(category, language)` - Translate category name

### 5. **Investments Module**

Track investments and portfolio contributions.

**Data Models** (`types/investment.ts`):
- `Investment` - Investment portfolio (name, description, color)
- `InvestmentMovement` - Contribution/withdrawal with amount, date, tags
- `InvestmentWithTotal` - Investment with calculated running total

**Key Features**:
- Add contributions by entering "new total" (delta auto-calculated)
- Running total with percentage change vs previous
- Movement history with tags (e.g., "bonus", "initial")
- 12-month line chart showing portfolio trends

**Helper Functions** (`types/investment.ts`):
- `generateId()` - Create unique IDs
- `getTodayKey()` - Get today as "YYYY-MM-DD"
- `formatDate(dateStr, language)` - Format date for display
- `calculatePercentChange(amount, previousTotal)` - Calculate % change
- `formatPercentChange(percent)` - Format percentage for display
- `getLast12Months()` - Get last 12 months for chart
- `calculateChartData(investments)` - Generate chart data
- `t(key, language)` - Translation helper

### 6. **Tasks Module**

Task management with one-time and recurring tasks.

**Data Models** (`types/tasks.ts`):
- `TodoTask` - One-time tasks with optional date, time, tag
- `DailyTask` - Daily recurring tasks with optional time, tag
- `WeeklyTask` - Weekly recurring tasks with optional date, time, tag
- `MonthlyTask` - Monthly recurring tasks with optional date, time, tag
- `TaskState` - Completion status tracking per task type

**Key Features**:
- Four task types: todo (one-time), daily, weekly, monthly
- Due date calculation: date+time = exact, date only = 23:59
- XP rewards (+50) on task completion
- Cycle-based reset for recurring tasks
- Overdue task indicators
- Collapsible sections per task type
- Today's progress tracking

**Helper Functions** (`types/tasks.ts`):
- `generateId()` - Create unique IDs
- `getTodayKey()` - Get today as "YYYY-MM-DD"
- `formatDate(dateStr, language)` - Format date for display
- `formatTime(timeStr, language)` - Format time for display
- `isCycleComplete(type, lastCompletionDate)` - Check if recurring task is done
- `calculateDueDate(task)` - Get due date for task
- `isTaskOverdue(task)` - Check if task is overdue
- `isDueToday(task)` - Check if task is due today
- `t(key, language)` - Translation helper

**Storage Keys** (AsyncStorage):
- `@life_manager_tasks` - All tasks by type
- `@life_manager_task_state_{accountId}` - Completion status per account

### 7. **Books Module**

Reading tracker for books, manga, and other serialized content.

**Data Models** (`types/books.ts`):
- `Book` - Book with name, total chapters (nullable for ongoing), dropped status
- `BookChapter` - Individual chapter reading record with timestamp
- `BookReview` - Review with optional chapter/range association
- `BookWithProgress` - Book with calculated progress, reviews array, completion status

**Key Features**:
- Track books with or without total chapters (ongoing series support)
- Log chapters read (+20 XP per chapter)
- Multiple reviews per book with chapter range selection
- Progress percentage for finite books
- Drop/abandon books feature
- Chapter history with timestamps
- Monthly reading stats on profile

**Helper Functions** (`types/books.ts`):
- `generateId()` - Create unique IDs
- `formatDate(dateStr, language)` - Format date for display
- `formatDateTime(dateStr, language)` - Format date and time for display
- `calculateProgress(book, chapters)` - Calculate reading progress
- `BOOK_XP` - XP constant (20) for reading a chapter

**Storage Keys** (AsyncStorage):
- `@life_manager_books` - Books data
- `@life_manager_book_chapters` - Chapter reading history
- `@life_manager_book_reviews` - Book reviews

### 8. **Mood Module**

Daily mood tracking with visualization and history.

**Data Models** (`types/mood.ts`):
- `MoodEntry` - Entry with date, mood score (1-5), optional note, timestamp
- `MoodScore` - Type union of 1 | 2 | 3 | 4 | 5

**Key Features**:
- Track daily mood on a 1-5 scale with emojis
- 60-day trend line chart visualization
- Optional notes for each entry
- Recent entries display on overview
- Full history screen with search
- Streak tracking for consecutive days
- XP rewards (+10 per mood log)

**Emoji Mapping**:
- 1: 😞 (Very sad)
- 2: 😕 (Sad)
- 3: 😐 (Neutral)
- 4: 🙂 (Happy)
- 5: 😄 (Very happy)

**Helper Functions** (`types/mood.ts`):
- `generateId()` - Create unique IDs
- `getTodayKey()` - Get today as "YYYY-MM-DD"
- `formatDate(dateStr, language)` - Format date for display
- `formatShortDate(dateStr, language)` - Short date format
- `getMoodFace(mood)` - Get emoji for mood score
- `calculateStreak(entries)` - Calculate consecutive days streak
- `calculateAverageMood(entries, days)` - Calculate average mood
- `buildChartData(entries, days, language)` - Generate chart data
- `groupEntriesByMonth(entries, language)` - Group entries for history

**Storage Keys** (AsyncStorage):
- `@life_manager_mood_entries` - Mood entries data

### 9. **Training Module**

Workout logging and exercise tracking system.

**Data Models** (`types/training.ts`):
- `Exercise` - Exercise with id, name, createdAt
- `TrainingSession` - Session with exerciseId, date, load, reps, notes
- `ExerciseWithStats` - Exercise with totalSessions, totalVolume, sessions array
- `SessionWithExercise` - Session with exerciseName and calculated volume

**Key Features**:
- Create and manage exercises
- Log sessions with load, reps, date, and notes
- Volume calculation (load × reps)
- 60-day activity heatmap on overview
- Exercise detail screen with volume chart
- Session history per exercise
- XP rewards (+10 per session logged)

**Helper Functions** (`types/training.ts`):
- `generateId()` - Create unique IDs
- `getTodayKey()` - Get today as "YYYY-MM-DD"
- `calculateVolume(load, reps)` - Calculate session volume
- `formatDate(dateStr, language)` - Format date for display
- `formatShortDate(dateStr, language)` - Short date format
- `getLast60Days()` - Get array of last 60 day keys
- `getLast7Days()` - Get array of last 7 day keys
- `getWeekStart()` - Get current week's Monday
- `t(key, language)` - Translation helper

**Storage Keys** (AsyncStorage):
- `@life_manager_exercises` - Exercises data
- `@life_manager_training_sessions` - Training sessions data

### 10. **Module System**

The app supports enabling/disabling modules from settings. When disabled:
- Module cards and stats are hidden from the home screen
- Data is preserved (not deleted)
- Module can be re-enabled anytime

**Settings Type** (`types/settings.ts`):
```typescript
type ModulesConfig = {
  finance: boolean;
  investments: boolean;
  tasks: boolean;
  books: boolean;
  mood: boolean;
  training: boolean;
};

type Settings = {
  language: Language;
  currency: Currency;
  modules: ModulesConfig;
};
```

**Usage in Components**:
```typescript
// Check if module is enabled (with backwards compatibility)
{settings.modules?.finance !== false && (
  <FinanceCard />
)}
```

### 11. **Visual Patterns and UI Conventions**

**Back Button Pattern** (used in Finance and Investments modules):
```typescript
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

const BackButton = () => (
  <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
    <IconSymbol name="chevron.left" size={24} color={isDark ? '#ECEDEE' : '#11181C'} />
  </TouchableOpacity>
);

// Usage in layout screenOptions:
headerLeft: () => <BackButton />,
```

**Chart Label Patterns** (for crowded X-axis labels):
- Show every 3rd label to avoid overlap
- Use shortened format: "Jan" instead of "January 2025"
- Add year suffix only for January or edge labels: "Jan'25"
- Font size: 10px for chart labels

**Legend Layout** (when horizontal legend overlaps):
- Use vertical column layout instead of horizontal row
- Align items to flex-start
- Add gap: 8 between items

**Color Conventions**:
- Positive values/gains: `#10B981` (green)
- Negative values/losses: `#EF4444` (red)
- Primary action button: `#007AFF` (blue)
- Books module accent: `#6C5CE7` (purple)
- Dark mode background: `#151718` (header), `#1A1A1A` (cards)
- Light mode background: `#fff` (header), `#F9F9F9` (cards)
- Dark mode text: `#ECEDEE` (primary), `#999` (secondary)
- Light mode text: `#11181C` (primary), `#666` (secondary)
- Dark mode borders: `#333`
- Light mode borders: `#E0E0E0`

### 12. **Component Architecture**

Components are organized by reusability level:

**Themed Components** (`components/themed-*.tsx`):
- Base components with automatic theme support
- `ThemedView` - Container with theme-aware background
- `ThemedText` - Text with theme-aware colors and typography variants

**UI Components** (`components/ui/`):
- Lower-level reusable UI elements
- `IconSymbol` - Cross-platform icons (SF Symbols on iOS, Material Icons elsewhere)
- `Collapsible` - Expandable sections

**Feature Components** (`components/`):
- Higher-level composed components
- `ParallaxScrollView` - Scroll view with parallax header
- `HapticTab` - Tab button with iOS haptic feedback
- `ExternalLink` - Link that opens in native browser

---

## Project Structure

```
life-manager-mobile/
├── app/                          # Expo Router - File-based routing
│   ├── _layout.tsx              # Root layout (providers, navigation)
│   ├── index.tsx                # Welcome/entry screen
│   ├── modal.tsx                # Modal example
│   ├── (tabs)/                  # Tab navigation group
│   │   ├── _layout.tsx          # Tab configuration
│   │   ├── index.tsx            # Home screen (balance, stats, modules)
│   │   └── config.tsx           # Settings screen (language, currency, modules)
│   ├── finance/                 # Finance module screens
│   │   ├── _layout.tsx          # Finance tab navigation
│   │   ├── index.tsx            # Finance overview (charts, summaries)
│   │   ├── months.tsx           # Monthly entries management
│   │   ├── cards.tsx            # Credit cards management
│   │   └── recurring.tsx        # Recurring expenses
│   ├── investments/             # Investments module screens
│   │   ├── _layout.tsx          # Investments stack navigation
│   │   ├── index.tsx            # Investments overview (chart, cards)
│   │   └── [id].tsx             # Investment detail (movements, add contribution)
│   ├── tasks/                   # Tasks module screens
│   │   ├── _layout.tsx          # Tasks stack navigation
│   │   ├── index.tsx            # Tasks overview (sections, progress)
│   │   └── add.tsx              # Add task modal screen
│   ├── books/                   # Books module screens
│   │   ├── _layout.tsx          # Books stack navigation
│   │   ├── index.tsx            # Books overview (in progress, completed, dropped)
│   │   ├── add.tsx              # Add book screen
│   │   └── [id].tsx             # Book detail (progress, reviews, chapter history)
│   └── training/                # Training module screens
│       ├── _layout.tsx          # Training stack navigation
│       ├── index.tsx            # Training overview (heatmap, log session modal)
│       ├── exercises.tsx        # Exercises list (add exercise modal)
│       └── [id].tsx             # Exercise detail (volume chart, session history)
│
├── components/                   # Reusable components
│   ├── ui/                      # Lower-level UI components
│   │   ├── icon-symbol.tsx      # Cross-platform icons
│   │   ├── icon-symbol.ios.tsx  # iOS-specific implementation
│   │   ├── collapsible.tsx      # Collapsible sections
│   │   └── currency-input.tsx   # Currency input (right-to-left typing)
│   ├── themed-view.tsx          # Theme-aware View
│   ├── themed-text.tsx          # Theme-aware Text
│   ├── account-form.tsx         # Account creation/edit form
│   ├── haptic-tab.tsx           # Tab with haptics
│   ├── parallax-scroll-view.tsx # Parallax scroll
│   ├── external-link.tsx        # External browser links
│   └── hello-wave.tsx           # Animation example
│
├── contexts/                     # React Context providers
│   ├── account-context.tsx      # User account state management
│   ├── settings-context.tsx     # App settings (language, currency)
│   ├── finance-context.tsx      # Finance data management
│   ├── investment-context.tsx   # Investment data management
│   ├── tasks-context.tsx        # Tasks data management
│   ├── books-context.tsx        # Books data management
│   ├── mood-context.tsx         # Mood data management
│   └── training-context.tsx     # Training data management
│
├── services/                     # Data persistence layer
│   ├── account-storage.ts       # Account AsyncStorage operations
│   ├── settings-storage.ts      # Settings AsyncStorage operations
│   ├── finance-storage.ts       # Finance AsyncStorage operations
│   ├── investment-storage.ts    # Investment AsyncStorage operations
│   ├── tasks-storage.ts         # Tasks AsyncStorage operations
│   ├── books-storage.ts         # Books AsyncStorage operations
│   ├── mood-storage.ts          # Mood AsyncStorage operations
│   └── training-storage.ts      # Training AsyncStorage operations
│
├── types/                        # TypeScript type definitions
│   ├── account.ts               # Account types
│   ├── settings.ts              # Settings types (Language, Currency, ModulesConfig)
│   ├── finance.ts               # Finance types + helpers
│   ├── investment.ts            # Investment types + helpers
│   ├── tasks.ts                 # Tasks types + helpers
│   ├── books.ts                 # Books types + helpers
│   ├── mood.ts                  # Mood types + helpers
│   └── training.ts              # Training types + helpers
│
├── hooks/                        # Custom React hooks
│   ├── use-color-scheme.ts      # Theme detection (native)
│   ├── use-color-scheme.web.ts  # Theme detection (web)
│   └── use-theme-color.ts       # Theme color resolver
│
├── constants/                    # App-wide constants
│   └── theme.ts                 # Colors and fonts
│
├── assets/                       # Static assets
│   └── images/                  # Images, icons, splash
│
├── scripts/                      # Utility scripts
│   └── reset-project.js         # Reset to blank project
│
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── eslint.config.js            # ESLint rules
├── app.json                    # Expo configuration
└── expo-env.d.ts              # Expo type definitions
```

**File Organization Principles**:
- `app/` - Only routing/screen files
- `components/` - Reusable UI components
- `hooks/` - Custom React hooks
- `constants/` - Shared constants
- `assets/` - Static files (images, fonts)

---

## Important Patterns

### Adding New Screens

1. **Create a new file in `app/`**:
```typescript
// app/new-screen.tsx
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

export default function NewScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">New Screen</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
```

2. **Register in `app/_layout.tsx`** (if using Stack):
```typescript
<Stack>
  <Stack.Screen name="new-screen" options={{ title: 'New Screen' }} />
</Stack>
```

3. **Navigate to it**:
```typescript
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/new-screen');
```

### Adding New Components

1. **Create in `components/` directory**:
```typescript
// components/my-component.tsx
import { StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';

export type MyComponentProps = {
  title: string;
  children?: React.ReactNode;
};

export function MyComponent({ title, children }: MyComponentProps) {
  return (
    <ThemedView style={styles.container}>
      {/* Component JSX */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});
```

2. **Import using `@/` alias**:
```typescript
import { MyComponent } from '@/components/my-component';
```

### Platform-Specific Code

**File Extensions**:
- `.ios.tsx` - iOS-specific
- `.android.tsx` - Android-specific
- `.web.ts` - Web-specific
- `.tsx` - Default/fallback

**Example**: `icon-symbol.tsx` (Android/Web) vs `icon-symbol.ios.tsx` (iOS)

**Runtime Checks**:
```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
}

// Or use Platform.select
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { shadowOpacity: 0.3 },
      android: { elevation: 4 },
    }),
  },
});
```

### Themed Components Pattern

Always use themed components for consistent theming:

```typescript
// ✅ Good - Uses theme
<ThemedView style={styles.container}>
  <ThemedText type="title">Title</ThemedText>
</ThemedView>

// ❌ Avoid - Hardcoded colors
<View style={{ backgroundColor: '#fff' }}>
  <Text style={{ color: '#000' }}>Title</Text>
</View>
```

**Custom Colors**:
```typescript
<ThemedView
  lightColor="#f0f0f0"
  darkColor="#1a1a1a"
  style={styles.container}
>
  <ThemedText
    lightColor="#333"
    darkColor="#eee"
  >
    Custom themed text
  </ThemedText>
</ThemedView>
```

### Testing Approach

**Status**: Testing infrastructure not yet set up.

**Recommended Setup**:
- Unit tests: Jest with React Native Testing Library
- Component tests: Test theming, rendering, user interactions
- E2E tests: Detox or Maestro for critical flows

**Test File Naming**: `[filename].test.ts` or `[filename].spec.ts`

---

## Code Style

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `themed-text.tsx`, `use-color-scheme.ts` |
| Components | PascalCase | `ThemedView`, `IconSymbol` |
| Functions | camelCase | `handlePress`, `fetchData` |
| Variables | camelCase | `userName`, `itemCount` |
| Constants | camelCase or UPPER_SNAKE_CASE | `tintColor`, `MAX_ITEMS` |
| Types/Interfaces | PascalCase | `ThemedTextProps`, `UserData` |
| Hooks | camelCase with `use` prefix | `useColorScheme`, `useThemeColor` |
| Directories | kebab-case | `components/`, `(tabs)/` |

### File Organization

**Screen/Route Files** (in `app/`):
```typescript
import { dependencies } from 'libraries';
import { components } from '@/components/...';
import { hooks } from '@/hooks/...';

export default function ScreenName() {
  // Hooks
  const hook = useHook();

  // Event handlers
  const handleEvent = () => { ... };

  // Render
  return (
    <View>
      {/* JSX */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles at bottom
});
```

**Component Files** (in `components/`):
```typescript
import { dependencies } from 'libraries';

export type ComponentProps = {
  // Props definition
};

export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Component logic

  return (
    <View>
      {/* JSX */}
    </View>
  );
}

const styles = StyleSheet.create({
  // Styles at bottom
});
```

### Import/Export Patterns

**Always use `@/` path alias**:
```typescript
// ✅ Good - Absolute imports with @/
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

// ❌ Avoid - Relative imports
import { ThemedView } from '../../components/themed-view';
```

**Export Conventions**:
- `default export` for screens/routes
- `named export` for components
- Export types alongside components

```typescript
// Components (named export)
export function MyComponent() { ... }
export type MyComponentProps = { ... };

// Screens (default export)
export default function MyScreen() { ... }
```

### TypeScript Conventions

**Props Definitions**:
```typescript
import { type ViewProps } from 'react-native';

export type MyComponentProps = ViewProps & {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
};
```

**Extending Native Components**:
```typescript
// Extend React Native props
export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

// Component receives all View props + custom props
export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  return <View style={style} {...otherProps} />;
}
```

**Type Imports**:
```typescript
import { type ComponentProps } from 'react';
import { type Href } from 'expo-router';
```

### StyleSheet Pattern

Styles always at the **bottom of the file** using `StyleSheet.create()`:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

**Why?**: Type safety, performance optimization, validation.

---

## Dependencies and External Services

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react-native | 0.81.5 | Mobile framework |
| react | 19.1.0 | UI library |
| expo | ~54.0.25 | Development platform |
| expo-router | ~6.0.15 | File-based routing |
| typescript | ~5.9.2 | Type system |
| react-native-reanimated | ~4.1.1 | Animations |
| react-native-gesture-handler | ~2.28.0 | Gesture system |
| @react-native-async-storage/async-storage | ^2.1.2 | Local data persistence |
| react-native-chart-kit | ^6.12.0 | Charts (Pie, Line) |
| react-native-svg | ^15.11.2 | SVG support for charts |

### Expo Modules

- `expo-constants` - App constants
- `expo-font` - Custom fonts
- `expo-haptics` - Haptic feedback (iOS)
- `expo-image` - Optimized images
- `expo-linking` - Deep linking
- `expo-splash-screen` - Splash screen
- `expo-status-bar` - Status bar control
- `expo-symbols` - SF Symbols (iOS icons)
- `expo-web-browser` - Native browser

### Environment Configuration

**No environment variables currently used.**

When implementing data storage, consider:
```bash
# Future environment variables (not yet implemented)
STORAGE_ENCRYPTION_KEY=
APP_VERSION=
```

---

## Development Workflows

### Git Workflow

**Branch Naming**: Use descriptive names
```bash
feature/add-task-manager
fix/theme-switching-bug
refactor/component-structure
```

**Commit Style**: Conventional commits recommended
```bash
feat: add welcome screen with navigation
fix: resolve dark mode color issue
refactor: reorganize themed components
docs: update CLAUDE.md with routing patterns
```

### Expo Development Server

When you run `pnpm start`, you'll see:
- QR code for Expo Go app
- Options to press:
  - `a` - Open on Android
  - `i` - Open on iOS
  - `w` - Open on web
  - `r` - Reload app
  - `m` - Toggle menu
  - `j` - Open debugger

### Hot Reloading

- **Fast Refresh**: Automatic on file save
- **Manual Reload**: Press `r` in terminal or shake device
- **Clear Cache**: `pnpm start --clear`

### Debugging

**React DevTools**:
```bash
# In development server, press 'j' to open debugger
```

**Console Logs**:
```typescript
console.log('Debug:', variable);
console.warn('Warning message');
console.error('Error:', error);
```

**React Native Debugger**:
- Install standalone app
- Works with Chrome DevTools
- Inspect component hierarchy, state, props

---

## Hidden Context

### Origin Story

This app is a **transformation of an Obsidian vault** (`life-manager-old/`) into a native mobile application. The original content consists of markdown files, notes, and personal knowledge management data.

**Implications**:
- Content migration will be needed from markdown to app data structures
- Markdown parsing/rendering may be required
- File organization concepts from Obsidian may influence app structure
- Users expect note-taking, task management, and organization features similar to Obsidian

### Data Storage Strategy

**CRITICAL**: This app has **NO backend API**. All data is stored locally on the device.

**Current Status**: Data persistence not yet implemented.

**Recommended Approach**:
```typescript
// Option 1: AsyncStorage (simple key-value)
import AsyncStorage from '@react-native-async-storage/async-storage';

// Option 2: SQLite (structured data)
import * as SQLite from 'expo-sqlite';

// Option 3: File System (markdown files)
import * as FileSystem from 'expo-file-system';
```

**Important Considerations**:
- User data must be persisted between app launches
- Consider data backup/export functionality
- Implement data encryption for sensitive information
- Plan for data migration between app versions
- Consider sync strategy if multi-device support is needed in future

### Performance Considerations

**React Native New Architecture**: Enabled in `app.json`
```json
"newArchEnabled": true
```
- Improved performance
- Better interoperability with native modules
- Synchronous access to native modules

**React Compiler**: Enabled
```json
"experiments": {
  "reactCompiler": true
}
```
- Automatic optimization of React components
- Reduces unnecessary re-renders

**Reanimated**: Used for smooth animations
- Runs animations on UI thread (not JS thread)
- 60 FPS animations even with heavy JS load

### Platform-Specific Notes

**iOS**:
- SF Symbols used for icons (native iOS icons)
- Haptic feedback available (`expo-haptics`)
- Tab navigation supports iOS gestures
- Edge-to-edge display supported

**Android**:
- Adaptive icons configured (foreground, background, monochrome)
- Material Icons used as fallback
- Edge-to-edge display enabled
- Predictive back gesture disabled (by config choice)

**Web**:
- Static output mode configured
- Color scheme detection with hydration handling
- Responsive design considerations needed

### Known Technical Debt

1. ~~**No Data Persistence Layer**~~: ✅ Implemented with AsyncStorage
2. ~~**Welcome Screen Placeholder**~~: ✅ Account creation flow implemented
3. **Example Components**: Some components (HelloWave, ParallaxScrollView) are examples and may not be needed.
4. **No Error Boundaries**: App doesn't have error handling infrastructure.
5. **No Testing**: No test files or testing setup.
6. **Chart TypeScript Errors**: `formatYLabel` type mismatch in react-native-chart-kit (pre-existing library issue).

### Expo Configuration Notes

**URL Scheme**: `lifemanagermobile://`
- Used for deep linking
- Format: `lifemanagermobile://path/to/screen`

**Typed Routes**: Enabled
- Expo Router generates TypeScript types for routes
- Autocomplete and type safety for navigation

**Splash Screen**: Configured with custom background and logo
- iOS: Shows status bar during splash
- Android: Full-screen splash

---

## Gotchas and Tips

### Common Pitfalls

**1. File Watcher Limits on Linux**
- **Issue**: `ENOSPC: System limit for number of file watchers reached`
- **Fix**: Increase inotify limit (see Quick Start section)

**2. Import Path Mistakes**
- **Issue**: Relative imports instead of `@/` alias
- **Fix**: Always use `@/` prefix for imports

**3. Color Hardcoding**
- **Issue**: Hardcoded colors break dark mode
- **Fix**: Always use `ThemedView`/`ThemedText` or `useThemeColor` hook

**4. Platform-Specific Components**
- **Issue**: Using iOS-only features on Android
- **Fix**: Check `Platform.OS` or use platform-specific files

**5. Async Storage Import**
- **Issue**: Using `@react-native-async-storage/async-storage` without installation
- **Fix**: Install when needed: `pnpm add @react-native-async-storage/async-storage`

### Pro Tips

**Fast Development**:
- Use `pnpm start` and scan QR code with Expo Go for fastest iteration
- Use web mode (`pnpm run web`) for UI development
- Hot reload works most of the time, but restart if behavior is weird

**Debugging**:
- Add `console.log` liberally during development
- Use React DevTools for component inspection
- Press `m` in dev server to access dev menu on device

**Theming**:
- Test both light and dark modes during development
- Device/emulator can toggle modes in system settings
- Use `useColorScheme()` hook to detect current theme

**Navigation**:
- File-based routing is automatic - just create files in `app/`
- Use route groups `(name)` for layouts without URL segments
- `_layout.tsx` files control navigation structure

**Performance**:
- Reanimated for 60 FPS animations
- Avoid heavy computations in render
- Use `React.memo` for expensive components
- StyleSheet.create() helps with performance

---

## Resources

### Official Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)

### Expo Modules
- [Expo SDK Reference](https://docs.expo.dev/versions/latest/)
- [Expo Router API](https://docs.expo.dev/router/reference/api/)

### TypeScript
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Design Resources
- [SF Symbols](https://developer.apple.com/sf-symbols/) (iOS icons)
- [Material Icons](https://fonts.google.com/icons) (Android icons)

---

## Next Steps for Development

### Immediate Priorities

1. **Implement Data Persistence**
   - Choose storage solution (AsyncStorage, SQLite, or FileSystem)
   - Create data models for notes, tasks, etc.
   - Implement save/load functionality

2. **Migrate Obsidian Content**
   - Parse markdown files from `life-manager-old/`
   - Convert to app data format
   - Create import functionality

3. **Build Core Features**
   - Note creation and editing
   - Task management
   - Organization/categorization
   - Search functionality

4. **Implement Authentication** (if needed)
   - User account system (or remove "Create account" button)
   - Local authentication (PIN, biometric)

5. **Add Testing**
   - Set up Jest and React Native Testing Library
   - Write tests for critical components
   - Add E2E tests for main flows

### Future Enhancements

- Cloud sync (if multi-device support needed)
- Markdown rendering for notes
- Rich text editor
- Attachments and media
- Tags and linking (Obsidian-style)
- Export functionality
- Widgets and home screen integrations

---

## Contributing Guidelines

### Code Submission Process

1. Create a feature branch
2. Make changes following code style guidelines
3. Test on both iOS and Android (or web)
4. Test both light and dark themes
5. Commit with descriptive messages
6. Create pull request with description

### Code Review Checklist

- [ ] Follows naming conventions (kebab-case files, PascalCase components)
- [ ] Uses `@/` import alias
- [ ] Uses themed components (ThemedView/ThemedText)
- [ ] Includes TypeScript types for props
- [ ] Styles use StyleSheet.create() at bottom of file
- [ ] Tested on relevant platforms
- [ ] Works in both light and dark mode
- [ ] No console errors or warnings
- [ ] No hardcoded colors or text

### Definition of Done

A feature is complete when:
- Code is written and follows style guide
- Themed appropriately (light/dark mode)
- Tested on target platforms
- No TypeScript errors
- No ESLint warnings
- Data persists correctly (when applicable)
- Documentation updated if needed

---

**Last Updated**: 2025-11-21

**Recent Changes**:
- Added Training Module for workout logging
  - Create and manage exercises
  - Log sessions with load, reps, date, and notes (via modals)
  - Volume calculation (load × reps)
  - 60-day activity heatmap visualization
  - Exercise detail screen with volume line chart
  - Session history per exercise with delete option
  - XP rewards (+10 per session logged)
- Added `dumbbell.fill` icon mapping to `fitness-center`
- Added training module toggle in settings

**Note**: This document should be updated as the codebase evolves. When making significant architectural changes or adding new patterns, update this file accordingly.
