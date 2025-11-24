// Focus Background Service
// Handles timer execution in background by scheduling all phase transition notifications
// and syncing state when app returns to foreground

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FocusTimerState,
  FocusEntry,
  formatTimerDisplay,
  getDefaultTimerState,
  generateId,
  getTodayKey,
  Language,
  FOCUS_XP_PER_MINUTE,
} from '@/types/focus';

// Storage keys
const TIMER_STATE_KEY = '@life_manager_focus_timer_state';
const FOCUS_ENTRIES_KEY = '@life_manager_focus_entries';
const SCHEDULED_PHASES_KEY = '@life_manager_focus_scheduled_phases';

// Notification channel and IDs
const FOCUS_CHANNEL_ID = 'focus-timer';
const ONGOING_NOTIFICATION_ID = 'focus-ongoing';
const PHASE_NOTIFICATION_PREFIX = 'focus-phase-';

// Translations
const translations = {
  en: {
    focusTitle: 'Focus Session',
    breakTitle: 'Break Time',
    focusBody: 'Stay focused!',
    breakBody: 'Take a break',
    cycleInfo: 'Cycle',
    focusComplete: 'Focus Complete!',
    breakComplete: 'Break Complete!',
    allCyclesComplete: 'All Cycles Done!',
    timerComplete: 'Timer Complete!',
    sessionFinished: 'Your focus session has ended.',
    timeForBreak: 'Time for a break!',
    backToFocus: 'Back to focus!',
  },
  pt: {
    focusTitle: 'Sessão de Foco',
    breakTitle: 'Hora do Descanso',
    focusBody: 'Mantenha o foco!',
    breakBody: 'Descanse um pouco',
    cycleInfo: 'Ciclo',
    focusComplete: 'Foco Concluído!',
    breakComplete: 'Descanso Concluído!',
    allCyclesComplete: 'Todos os Ciclos Concluídos!',
    timerComplete: 'Timer Concluído!',
    sessionFinished: 'Sua sessão de foco terminou.',
    timeForBreak: 'Hora do descanso!',
    backToFocus: 'Voltar ao foco!',
  },
};

type TranslationKey = keyof typeof translations.en;

function t(key: TranslationKey, language: Language): string {
  return translations[language]?.[key] ?? translations.en[key] ?? key;
}

// Phase transition info for scheduling
type ScheduledPhase = {
  id: string;
  type: 'focus_end' | 'break_end' | 'timer_end' | 'all_cycles_end';
  triggerAt: number; // timestamp
  cycleNumber: number;
  newPhase: 'focus' | 'break' | 'idle';
  newEndsAt: number | null;
};

// Schedule all phase transitions for a pomodoro session
export async function scheduleAllPhaseTransitions(
  state: FocusTimerState,
  language: Language
): Promise<void> {
  // Cancel any existing scheduled notifications
  await cancelAllScheduledPhases();

  if (!state.running || state.phase === 'idle') return;

  const scheduledPhases: ScheduledPhase[] = [];
  const focusDurationMs = state.targetMinutes * 60 * 1000;
  const breakDurationMs = state.breakMinutes * 60 * 1000;
  const now = Date.now();

  if (state.mode === 'countdown') {
    // Simple countdown - just one notification at the end
    if (state.endsAt && state.endsAt > now) {
      const phase: ScheduledPhase = {
        id: `${PHASE_NOTIFICATION_PREFIX}0`,
        type: 'timer_end',
        triggerAt: state.endsAt,
        cycleNumber: 0,
        newPhase: 'idle',
        newEndsAt: null,
      };
      scheduledPhases.push(phase);
    }
  } else if (state.mode === 'pomodoro') {
    // Schedule all focus and break transitions for remaining cycles
    let currentTime = state.endsAt || now;
    let currentPhase = state.phase;
    let cyclesCompleted = state.cyclesCompleted;
    let notificationIndex = 0;

    // Calculate total remaining phases to schedule
    // Each cycle has: 1 focus phase + 1 break phase (except last cycle which has no break after)
    const remainingCycles = state.cyclesTarget - cyclesCompleted;
    const maxPhases = remainingCycles * 2; // Max possible phase transitions

    for (let i = 0; i < maxPhases; i++) {
      // Skip if this phase already ended
      if (currentTime <= now) {
        // Phase already passed, advance to next
        if (currentPhase === 'focus') {
          cyclesCompleted++;
          if (cyclesCompleted >= state.cyclesTarget) break;
          currentTime = currentTime + breakDurationMs;
          currentPhase = 'break';
        } else {
          currentTime = currentTime + focusDurationMs;
          currentPhase = 'focus';
        }
        continue;
      }

      if (currentPhase === 'focus') {
        // Focus phase ending
        const isLastCycle = cyclesCompleted + 1 >= state.cyclesTarget;

        const phase: ScheduledPhase = {
          id: `${PHASE_NOTIFICATION_PREFIX}${notificationIndex}`,
          type: isLastCycle ? 'all_cycles_end' : 'focus_end',
          triggerAt: currentTime,
          cycleNumber: cyclesCompleted + 1,
          newPhase: isLastCycle ? 'idle' : 'break',
          newEndsAt: isLastCycle ? null : currentTime + breakDurationMs,
        };
        scheduledPhases.push(phase);
        notificationIndex++;

        if (isLastCycle) break;

        // Advance to break phase
        cyclesCompleted++;
        currentPhase = 'break';
        currentTime = currentTime + breakDurationMs;
      } else {
        // Break phase ending
        const phase: ScheduledPhase = {
          id: `${PHASE_NOTIFICATION_PREFIX}${notificationIndex}`,
          type: 'break_end',
          triggerAt: currentTime,
          cycleNumber: cyclesCompleted,
          newPhase: 'focus',
          newEndsAt: currentTime + focusDurationMs,
        };
        scheduledPhases.push(phase);
        notificationIndex++;

        // Advance to focus phase
        currentPhase = 'focus';
        currentTime = currentTime + focusDurationMs;
      }
    }
  }

  // Schedule all notifications in parallel for better reliability
  const schedulePromises = scheduledPhases.map(phase =>
    schedulePhaseNotification(phase, language)
  );
  await Promise.all(schedulePromises);

  // Save scheduled phases for sync later
  await AsyncStorage.setItem(SCHEDULED_PHASES_KEY, JSON.stringify(scheduledPhases));

  // Verify scheduling (for debugging)
  if (__DEV__) {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const phaseNotifs = scheduled.filter(n => n.identifier.startsWith(PHASE_NOTIFICATION_PREFIX));
    console.log(`[Focus] Scheduled ${phaseNotifs.length} phase notifications for ${scheduledPhases.length} phases`);
  }
}

// Schedule a single phase notification
async function schedulePhaseNotification(
  phase: ScheduledPhase,
  language: Language
): Promise<void> {
  let title: string;
  let body: string;

  switch (phase.type) {
    case 'focus_end':
      title = t('focusComplete', language);
      body = t('timeForBreak', language);
      break;
    case 'break_end':
      title = t('breakComplete', language);
      body = t('backToFocus', language);
      break;
    case 'all_cycles_end':
      title = t('allCyclesComplete', language);
      body = t('sessionFinished', language);
      break;
    case 'timer_end':
      title = t('timerComplete', language);
      body = t('sessionFinished', language);
      break;
  }

  const now = Date.now();
  const triggerDate = new Date(phase.triggerAt);

  // Only schedule if in the future (with small buffer for timing)
  if (phase.triggerAt <= now + 1000) {
    if (__DEV__) {
      console.log(`[Focus] Skipping past notification: ${phase.type} at ${triggerDate.toLocaleTimeString()}`);
    }
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: phase.id,
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 200, 500],
        ...(Platform.OS === 'android' && {
          channelId: FOCUS_CHANNEL_ID,
          // Android specific options for more reliable delivery
          sticky: false,
          autoDismiss: true,
        }),
        data: {
          type: 'focus_phase_transition',
          phase: phase,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    if (__DEV__) {
      const minutesUntil = Math.round((phase.triggerAt - now) / 60000);
      console.log(`[Focus] Scheduled ${phase.type} notification in ${minutesUntil}min at ${triggerDate.toLocaleTimeString()}`);
    }
  } catch (error) {
    console.error(`[Focus] Failed to schedule ${phase.type} notification:`, error);
  }
}

// Cancel all scheduled phase notifications
export async function cancelAllScheduledPhases(): Promise<void> {
  try {
    // Get all scheduled notifications and cancel the phase ones
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.identifier.startsWith(PHASE_NOTIFICATION_PREFIX)) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    // Clear stored scheduled phases
    await AsyncStorage.removeItem(SCHEDULED_PHASES_KEY);
  } catch (error) {
    console.warn('Failed to cancel scheduled phases:', error);
  }
}

// Show ongoing notification with chronometer
export async function showOngoingNotification(
  state: FocusTimerState,
  language: Language
): Promise<void> {
  if (state.phase === 'idle') {
    await dismissOngoingNotification();
    return;
  }

  const isBreak = state.phase === 'break';
  const title = isBreak ? t('breakTitle', language) : t('focusTitle', language);

  let body = '';
  if (state.mode === 'pomodoro') {
    body = `${t('cycleInfo', language)} ${state.cyclesCompleted + 1}/${state.cyclesTarget}`;
  } else {
    body = isBreak ? t('breakBody', language) : t('focusBody', language);
  }

  const isCountdown = state.mode === 'pomodoro' || state.mode === 'countdown';

  try {
    if (Platform.OS === 'android') {
      const androidContent = {
        title,
        body,
        sound: false,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        channelId: FOCUS_CHANNEL_ID,
        showChronometer: true,
        chronometerCountDown: isCountdown,
        when: isCountdown && state.endsAt ? state.endsAt : Date.now() - (state.startedAt ? Date.now() - state.startedAt - state.pausedDuration : 0),
        usesChronometer: true,
        ongoing: true,
      } as Notifications.NotificationContentInput;

      await Notifications.scheduleNotificationAsync({
        identifier: ONGOING_NOTIFICATION_ID,
        content: androidContent,
        trigger: null,
      });
    } else {
      // iOS fallback
      let displayTime = 0;
      if (isCountdown && state.endsAt) {
        displayTime = Math.max(0, state.endsAt - Date.now());
      } else if (state.startedAt) {
        displayTime = Date.now() - state.startedAt - state.pausedDuration;
      }

      await Notifications.scheduleNotificationAsync({
        identifier: ONGOING_NOTIFICATION_ID,
        content: {
          title,
          body: `${formatTimerDisplay(displayTime)}${state.mode === 'pomodoro' ? ` - ${body}` : ''}`,
          sound: false,
          sticky: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.warn('Failed to show ongoing notification:', error);
  }
}

// Dismiss ongoing notification
export async function dismissOngoingNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(ONGOING_NOTIFICATION_ID);
  } catch (error) {
    // Ignore
  }
}

// Result type for calculateCurrentState
export type CalculateCurrentStateResult = {
  state: FocusTimerState;
  completedSessions: number;
  phaseChanged: boolean;
  previousPhase: 'focus' | 'break' | 'idle';
};

// Calculate current state based on time elapsed (for syncing when app comes to foreground)
export function calculateCurrentState(
  originalState: FocusTimerState,
  currentTime: number = Date.now()
): CalculateCurrentStateResult {
  const previousPhase = originalState.phase;

  if (!originalState.running || originalState.phase === 'idle') {
    return { state: originalState, completedSessions: 0, phaseChanged: false, previousPhase };
  }

  let state = { ...originalState };
  let completedSessions = 0;

  // Countdown mode
  if (state.mode === 'countdown') {
    if (state.endsAt && currentTime >= state.endsAt) {
      completedSessions = 1;
      return {
        state: {
          ...state,
          running: false,
          phase: 'idle',
          endsAt: null,
          currentSessionStartISO: null,
        },
        completedSessions,
        phaseChanged: true,
        previousPhase,
      };
    }
    return { state, completedSessions, phaseChanged: false, previousPhase };
  }

  // Countup mode - never auto-completes
  if (state.mode === 'countup') {
    return { state, completedSessions, phaseChanged: false, previousPhase };
  }

  // Pomodoro mode - calculate how many phases have passed
  const focusDurationMs = state.targetMinutes * 60 * 1000;
  const breakDurationMs = state.breakMinutes * 60 * 1000;
  let lastPhaseBeforeLoop = state.phase;

  while (state.running && state.phase !== 'idle' && state.endsAt && currentTime >= state.endsAt) {
    lastPhaseBeforeLoop = state.phase;

    if (state.phase === 'focus') {
      // Focus phase completed
      completedSessions++;
      const cyclesCompleted = state.cyclesCompleted + 1;

      if (cyclesCompleted >= state.cyclesTarget) {
        // All cycles done
        return {
          state: {
            ...state,
            running: false,
            phase: 'idle',
            cyclesCompleted: 0,
            endsAt: null,
            currentSessionStartISO: null,
          },
          completedSessions,
          phaseChanged: true,
          previousPhase: lastPhaseBeforeLoop,
        };
      }

      // Start break
      if (breakDurationMs > 0) {
        state = {
          ...state,
          phase: 'break',
          cyclesCompleted,
          endsAt: state.endsAt + breakDurationMs,
        };
      } else {
        // No break, start next focus
        state = {
          ...state,
          phase: 'focus',
          cyclesCompleted,
          endsAt: state.endsAt + focusDurationMs,
          currentSessionStartISO: new Date(state.endsAt).toISOString(),
        };
      }
    } else if (state.phase === 'break') {
      // Break phase completed, start focus
      state = {
        ...state,
        phase: 'focus',
        endsAt: state.endsAt + focusDurationMs,
        currentSessionStartISO: new Date(state.endsAt).toISOString(),
      };
    }
  }

  const phaseChanged = state.phase !== originalState.phase || completedSessions > 0;

  return {
    state,
    completedSessions,
    phaseChanged,
    previousPhase: phaseChanged ? lastPhaseBeforeLoop : previousPhase,
  };
}

// Cleanup all focus notifications
export async function cleanupAllFocusNotifications(): Promise<void> {
  await dismissOngoingNotification();
  await cancelAllScheduledPhases();
}

// Debug: Get info about all scheduled phase notifications
export async function getScheduledPhaseNotifications(): Promise<{
  count: number;
  notifications: Array<{ id: string; triggerDate: Date | null }>;
}> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const phaseNotifs = scheduled.filter(n =>
      n.identifier.startsWith(PHASE_NOTIFICATION_PREFIX)
    );

    return {
      count: phaseNotifs.length,
      notifications: phaseNotifs.map(n => ({
        id: n.identifier,
        triggerDate: n.trigger && 'date' in n.trigger ? new Date(n.trigger.date) : null,
      })),
    };
  } catch (error) {
    console.error('[Focus] Failed to get scheduled notifications:', error);
    return { count: 0, notifications: [] };
  }
}
