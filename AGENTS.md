# CLAUDE.md

Guidance for AI coding assistants working with this repository.

**Always refer to me as MATEUZIN CRIA**

Eu posso conversar em português, mas você deve **escrever código e comentários apenas em inglês**.

---

## Overview

**Life Manager Mobile** - React Native app built with Expo for personal life management.

| Aspect | Value |
|--------|-------|
| Framework | Expo SDK 54 + React Native 0.81.5 |
| Navigation | Expo Router 6 (file-based) |
| Language | TypeScript 5.9.2 (strict) |
| State | Local storage (AsyncStorage, no backend) |
| Theme | Light/dark mode support |

---

## Essential Commands

```bash
pnpm install          # Install dependencies
pnpm start            # Start dev server
pnpm run android      # Run on Android
pnpm run lint         # Run linter
pnpm exec tsc --noEmit # Type check
pnpm run build:apk:prod:local # Build APK
```

---

## Project Structure

```
app/                    # Expo Router screens
├── _layout.tsx         # Root layout (providers)
├── index.tsx           # Welcome screen
├── (tabs)/             # Tab navigation
│   ├── index.tsx       # Home
│   ├── achievements.tsx
│   └── config.tsx      # Settings
├── finance/            # Finance module
├── investments/        # Investments module
├── tasks/              # Tasks module
├── books/              # Books module
├── training/           # Training module
├── mood/               # Mood module (if exists)
└── focus/              # Focus module

components/             # Reusable components
├── ui/                 # Low-level (IconSymbol, Collapsible)
├── themed-view.tsx     # Theme-aware View
└── themed-text.tsx     # Theme-aware Text

contexts/               # React Context providers
services/               # AsyncStorage persistence
types/                  # TypeScript definitions + helpers
hooks/                  # Custom hooks
constants/              # Theme colors, etc.
```

---

## Code Style

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `themed-text.tsx` |
| Components | PascalCase | `ThemedView` |
| Functions/Variables | camelCase | `handlePress` |
| Types | PascalCase | `MyComponentProps` |
| Hooks | `use` prefix | `useColorScheme` |

### File Organization

```typescript
// 1. Imports
import { View } from 'react-native';
import { ThemedView } from '@/components/themed-view';

// 2. Types (for components)
export type MyComponentProps = { title: string };

// 3. Component/Screen
export function MyComponent({ title }: MyComponentProps) {
  // Hooks first
  const { settings } = useSettings();

  // Handlers
  const handlePress = () => {};

  // Render
  return <ThemedView>...</ThemedView>;
}

// 4. Styles at bottom
const styles = StyleSheet.create({
  container: { flex: 1 },
});
```

### Exports

- **Screens**: `export default function`
- **Components**: `export function` (named)
- **Always use `@/` alias**: `import { X } from '@/components/x'`

---

## Key Patterns

### Theming

```typescript
// Always use themed components
<ThemedView style={styles.container}>
  <ThemedText type="title">Hello</ThemedText>
</ThemedView>

// For custom colors
const isDark = useColorScheme() === 'dark';
const textColor = isDark ? '#ECEDEE' : '#11181C';
```

### Color Conventions

| Purpose | Color |
|---------|-------|
| Positive/gains | `#10B981` |
| Negative/losses | `#EF4444` |
| Primary action | `#007AFF` |
| Dark background | `#151718` / `#1A1A1A` |
| Light background | `#fff` / `#F9F9F9` |
| Dark text | `#ECEDEE` / `#999` |
| Light text | `#11181C` / `#666` |
| Dark borders | `#333` |
| Light borders | `#E0E0E0` |

### Navigation

```typescript
import { useRouter } from 'expo-router';
const router = useRouter();
router.push('/(tabs)');
router.push('/finance');
router.back();
```

### Alerts and Toasts

```typescript
// Never use Alert.alert directly
const { showConfirm, showToast } = useAlert();
showConfirm({ title: 'Delete?', buttons: [...] });
showToast({ message: 'Saved!', type: 'success' });
```

### Module System

```typescript
// Check if module enabled (with backwards compat)
{settings.modules?.finance !== false && <FinanceCard />}
```

### Context Providers Order

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

---

## Storage Keys (AsyncStorage)

| Key Pattern | Purpose |
|-------------|---------|
| `@life-manager/account` | User account |
| `@life-manager/settings` | Language, currency, modules |
| `@life-manager/finance/{accountId}/*` | Finance data |
| `@life_manager_investments` | Investment portfolios |
| `@life_manager_books` | Books data |
| `@life_manager_tasks` | Tasks data |
| `@life_manager_mood_entries` | Mood entries |
| `@life_manager_exercises` | Training exercises |
| `@life_manager_focus_entries` | Focus sessions |

---

## Visual Style

- **Card Style**: `borderRadius: 20-24`, `rgba` backgrounds, subtle borders
- **Shadows**: `shadowOpacity: 0.1`, `shadowRadius: 12`, `elevation: 5`
- **Gradients**: `['#6366F1', '#8B5CF6']` for accents
- **Typography**: Bold headers (700-800)

---

## Common Gotchas

1. **Linux file watchers**: Run `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`
2. **Always use `@/` imports**, never relative paths
3. **Never hardcode colors** - use themed components or `isDark` checks
4. **Add new SF Symbol names** to `components/ui/icon-symbol.tsx` for Android fallbacks

---

## Modules Summary

| Module | XP Reward | Key Features |
|--------|-----------|--------------|
| Tasks | +50/task | Todo, daily, weekly, monthly tasks |
| Books | +20/chapter | Track reading progress, reviews |
| Mood | +10/log | Daily mood 1-5, 60-day chart |
| Training | +10/session | Exercises, volume tracking, heatmap |
| Focus | +1/minute | Pomodoro, countdown, countup modes |
| Finance | - | Bank accounts, cards, recurring expenses |
| Investments | - | Portfolios, movements, 12-month chart |
| Achievements | - | Read-only, tracks milestones across modules |
