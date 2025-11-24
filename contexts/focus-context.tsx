import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  FocusEntry,
  FocusTimerState,
  FocusStats,
  FocusMode,
  FocusPhase,
  calculateStats,
  getDefaultTimerState,
  generateId,
  getTodayKey,
  FOCUS_XP_PER_MINUTE,
  Language,
} from '@/types/focus';
import {
  loadFocusEntries,
  saveFocusEntries,
  addFocusEntry,
  deleteFocusEntry,
  loadTimerState,
  saveTimerState,
} from '@/services/focus-storage';
import {
  configureFocusNotifications,
  showCompletionNotification,
} from '@/services/focus-notification';
import {
  scheduleAllPhaseTransitions,
  cancelAllScheduledPhases,
  showOngoingNotification,
  dismissOngoingNotification,
  calculateCurrentState,
  cleanupAllFocusNotifications,
  getScheduledPhaseNotifications,
} from '@/services/focus-background-service';
import { useAccount } from '@/contexts/account-context';
import { useSettings } from '@/contexts/settings-context';

type FocusContextType = {
  // Data
  entries: FocusEntry[];
  stats: FocusStats;
  timerState: FocusTimerState;
  isLoading: boolean;

  // Timer display
  displayTime: number; // ms remaining (countdown) or elapsed (countup)
  isRunning: boolean;

  // Actions
  startTimer: (mode: FocusMode, config?: TimerConfig) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  finishSession: () => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refreshEntries: () => Promise<void>;
};

type TimerConfig = {
  targetMinutes?: number;
  breakMinutes?: number;
  cyclesTarget?: number;
};

const FocusContext = createContext<FocusContextType | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const { account, addXp } = useAccount();
  const { settings } = useSettings();
  const language = settings.language as Language;
  const [entries, setEntries] = useState<FocusEntry[]>([]);
  const [timerState, setTimerState] = useState<FocusTimerState>(
    getDefaultTimerState()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [displayTime, setDisplayTime] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastNotificationUpdateRef = useRef<number>(0);

  // Calculate stats from entries
  const stats = calculateStats(entries);

  // Ref to track if we need to handle completion when timer expires in background
  const needsCompletionHandlingRef = useRef(false);

  // Sync display time from timer state (used when resuming from background)
  const syncDisplayTime = useCallback((state: FocusTimerState) => {
    if (!state.running || state.phase === 'idle') return;

    const now = Date.now();
    if ((state.mode === 'pomodoro' || state.mode === 'countdown') && state.endsAt) {
      const remaining = Math.max(0, state.endsAt - now);
      setDisplayTime(remaining);

      // Mark for completion handling if timer expired while in background
      if (remaining <= 0) {
        needsCompletionHandlingRef.current = true;
      }
    } else if (state.mode === 'countup' && state.startedAt) {
      const elapsed = now - state.startedAt - state.pausedDuration;
      setDisplayTime(elapsed);
    }
  }, []);

  // Load initial data and configure notifications
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [loadedEntries, loadedState] = await Promise.all([
          loadFocusEntries(),
          loadTimerState(),
        ]);
        setEntries(loadedEntries);
        setTimerState(loadedState);

        // Sync display time in case timer was running
        syncDisplayTime(loadedState);

        // Configure notifications
        const enabled = await configureFocusNotifications();
        setNotificationsEnabled(enabled);
      } catch (error) {
        console.error('Failed to load focus data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();

    // Cleanup on unmount - don't cleanup notifications so timer continues in background
    return () => {
      // Only cleanup if timer is not running
      // cleanupAllFocusNotifications();
    };
  }, [syncDisplayTime]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App coming back to foreground
      if (nextAppState === 'active') {
        // Calculate current state based on elapsed time (handles phases that completed in background)
        const { state: newState, completedSessions, phaseChanged, previousPhase } = calculateCurrentState(timerState);

        if (completedSessions > 0 || newState.phase !== timerState.phase || newState.cyclesCompleted !== timerState.cyclesCompleted) {
          // State changed while in background - update it
          setTimerState(newState);

          // Save completed sessions
          for (let i = 0; i < completedSessions; i++) {
            await saveSession(timerState, timerState.targetMinutes);
          }

          // Show completion notification if phase changed while in background
          // This ensures the user gets notified even if the scheduled notification didn't fire
          if (notificationsEnabled && phaseChanged) {
            if (newState.phase === 'idle') {
              // Session fully completed
              if (timerState.mode === 'countdown') {
                showCompletionNotification('timer', language);
              } else {
                showCompletionNotification('allCycles', language);
              }
            } else if (newState.phase === 'break' && previousPhase === 'focus') {
              // Focus phase completed, now in break
              showCompletionNotification('focus', language);
            } else if (newState.phase === 'focus' && previousPhase === 'break') {
              // Break phase completed, now in focus
              showCompletionNotification('break', language);
            }
          }

          // Update display time
          if (newState.running && newState.phase !== 'idle') {
            const now = Date.now();
            if ((newState.mode === 'pomodoro' || newState.mode === 'countdown') && newState.endsAt) {
              setDisplayTime(Math.max(0, newState.endsAt - now));
            } else if (newState.mode === 'countup' && newState.startedAt) {
              setDisplayTime(now - newState.startedAt - newState.pausedDuration);
            }
          } else {
            setDisplayTime(0);
          }

          // Reschedule notifications for remaining phases
          if (notificationsEnabled && newState.running && newState.phase !== 'idle') {
            scheduleAllPhaseTransitions(newState, language);
          }
        } else {
          // Just sync display time
          syncDisplayTime(timerState);
        }

        // Update notification
        if (notificationsEnabled && newState.running && newState.phase !== 'idle') {
          showOngoingNotification(newState, language);
        } else if (newState.phase === 'idle') {
          dismissOngoingNotification();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [timerState, notificationsEnabled, language, syncDisplayTime]);

  // Timer tick logic
  const tick = useCallback(() => {
    setTimerState((prev) => {
      if (!prev.running || prev.phase === 'idle') return prev;

      const now = Date.now();
      let newDisplayTime = 0;

      // Pomodoro and Countdown both use endsAt for timing
      if ((prev.mode === 'pomodoro' || prev.mode === 'countdown') && prev.endsAt) {
        const remaining = prev.endsAt - now;
        newDisplayTime = Math.max(0, remaining);
        setDisplayTime(newDisplayTime);

        // Phase complete
        if (remaining <= 0) {
          return handlePhaseComplete(prev, language);
        }
      } else if (prev.mode === 'countup' && prev.startedAt) {
        const elapsed = now - prev.startedAt - prev.pausedDuration;
        newDisplayTime = elapsed;
        setDisplayTime(newDisplayTime);
      }

      // Update ongoing notification every 5 seconds (chronometer handles real-time on Android)
      if (notificationsEnabled && now - lastNotificationUpdateRef.current >= 5000) {
        lastNotificationUpdateRef.current = now;
        showOngoingNotification(prev, language);
      }

      return prev;
    });
  }, [notificationsEnabled, language]);

  // Handle phase completion for pomodoro and countdown modes
  const handlePhaseComplete = (state: FocusTimerState, lang: Language): FocusTimerState => {
    // Simple countdown mode - just complete when timer ends
    if (state.mode === 'countdown') {
      saveSession(state, state.targetMinutes);
      // Show completion notification (if app in foreground, scheduled already fired if in background)
      if (notificationsEnabled) {
        showCompletionNotification('timer', lang);
      }
      return {
        ...state,
        running: false,
        phase: 'idle',
        endsAt: null,
        currentSessionStartISO: null,
      };
    }

    // Pomodoro mode - handle focus and break cycles
    if (state.phase === 'focus') {
      // Focus phase complete
      const cyclesCompleted = state.cyclesCompleted + 1;

      // Save the focus session
      saveSession(state, state.targetMinutes);

      if (cyclesCompleted >= state.cyclesTarget) {
        // All cycles done - show completion notification
        if (notificationsEnabled) {
          showCompletionNotification('allCycles', lang);
        }
        return {
          ...state,
          running: false,
          phase: 'idle',
          cyclesCompleted: 0,
          endsAt: null,
          currentSessionStartISO: null,
        };
      }

      // Focus complete, start break - show notification (scheduled notifications already handle background)
      if (notificationsEnabled) {
        showCompletionNotification('focus', lang);
      }

      // Start break phase
      if (state.breakMinutes > 0) {
        const breakEndsAt = Date.now() + state.breakMinutes * 60 * 1000;
        return {
          ...state,
          phase: 'break',
          cyclesCompleted,
          endsAt: breakEndsAt,
        };
      }

      // No break, start next focus
      const focusEndsAt = Date.now() + state.targetMinutes * 60 * 1000;
      return {
        ...state,
        phase: 'focus',
        cyclesCompleted,
        endsAt: focusEndsAt,
        currentSessionStartISO: new Date().toISOString(),
      };
    } else if (state.phase === 'break') {
      // Break complete, start focus - show notification (scheduled notifications already handle background)
      if (notificationsEnabled) {
        showCompletionNotification('break', lang);
      }
      const focusEndsAt = Date.now() + state.targetMinutes * 60 * 1000;
      return {
        ...state,
        phase: 'focus',
        endsAt: focusEndsAt,
        currentSessionStartISO: new Date().toISOString(),
      };
    }

    return state;
  };

  // Save a completed session
  const saveSession = async (state: FocusTimerState, durationMinutes: number) => {
    if (durationMinutes < 1) return;

    const now = new Date();
    const entry: FocusEntry = {
      id: generateId(),
      date: getTodayKey(),
      startedAt: state.currentSessionStartISO || now.toISOString(),
      endedAt: now.toISOString(),
      mode: state.mode,
      durationMinutes: Math.round(durationMinutes),
      targetMinutes: state.mode === 'countdown' ? state.targetMinutes : undefined,
      breakMinutes: state.mode === 'countdown' ? state.breakMinutes : undefined,
      cyclesCompleted:
        state.mode === 'countdown' ? state.cyclesCompleted + 1 : undefined,
    };

    try {
      const updated = await addFocusEntry(entry);
      setEntries(updated);

      // Award XP
      const xpAmount = Math.round(durationMinutes * FOCUS_XP_PER_MINUTE);
      if (xpAmount > 0 && account) {
        addXp(xpAmount);
      }
    } catch (error) {
      console.error('Failed to save focus session:', error);
    }
  };

  // Start/stop interval
  useEffect(() => {
    if (timerState.running) {
      intervalRef.current = setInterval(tick, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.running, tick]);

  // Persist timer state changes
  useEffect(() => {
    if (!isLoading) {
      saveTimerState(timerState);
    }
  }, [timerState, isLoading]);

  // Initialize display time on load
  useEffect(() => {
    if (!isLoading && timerState.running) {
      const now = Date.now();
      if ((timerState.mode === 'pomodoro' || timerState.mode === 'countdown') && timerState.endsAt) {
        setDisplayTime(Math.max(0, timerState.endsAt - now));
      } else if (timerState.mode === 'countup' && timerState.startedAt) {
        setDisplayTime(now - timerState.startedAt - timerState.pausedDuration);
      }
    }
  }, [isLoading]);

  // Handle timer completion that occurred while app was in background
  useEffect(() => {
    if (needsCompletionHandlingRef.current && timerState.running) {
      needsCompletionHandlingRef.current = false;
      setTimerState((prev) => handlePhaseComplete(prev, language));
    }
  }, [timerState.running, language]);

  // Actions
  const startTimer = useCallback(
    (mode: FocusMode, config?: TimerConfig) => {
      const now = Date.now();
      const nowISO = new Date().toISOString();

      const targetMinutes = config?.targetMinutes ?? timerState.targetMinutes;
      const breakMinutes = config?.breakMinutes ?? timerState.breakMinutes;
      const cyclesTarget = config?.cyclesTarget ?? timerState.cyclesTarget;

      // Both pomodoro and countdown modes use endsAt
      const usesEndsAt = mode === 'pomodoro' || mode === 'countdown';
      const initialDisplayTime = usesEndsAt ? targetMinutes * 60 * 1000 : 0;
      const endsAt = usesEndsAt ? now + targetMinutes * 60 * 1000 : null;

      const newState: FocusTimerState = {
        ...timerState,
        running: true,
        mode,
        phase: 'focus',
        targetMinutes,
        breakMinutes,
        cyclesTarget,
        cyclesCompleted: 0,
        endsAt,
        startedAt: mode === 'countup' ? now : null,
        currentSessionStartISO: nowISO,
        pausedDuration: 0,
        pausedAt: null,
      };

      setTimerState(newState);
      setDisplayTime(initialDisplayTime);

      // Show initial ongoing notification and schedule all phase transitions
      if (notificationsEnabled) {
        showOngoingNotification(newState, language);

        // Schedule all phase transition notifications (will fire even in background)
        scheduleAllPhaseTransitions(newState, language).then(async () => {
          // Verify notifications were scheduled (in dev mode)
          if (__DEV__) {
            const { count, notifications } = await getScheduledPhaseNotifications();
            console.log(`[Focus] Verified ${count} notifications scheduled:`);
            notifications.forEach(n => {
              console.log(`  - ${n.id}: ${n.triggerDate?.toLocaleTimeString() || 'unknown'}`);
            });
          }
        });
      }
    },
    [timerState, notificationsEnabled, language]
  );

  const pauseTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      running: false,
      pausedAt: Date.now(),
    }));
    // Cancel all scheduled phase notifications when paused
    cancelAllScheduledPhases();
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState((prev) => {
      const pausedTime = prev.pausedAt ? Date.now() - prev.pausedAt : 0;
      const usesEndsAt = prev.mode === 'pomodoro' || prev.mode === 'countdown';
      const newEndsAt = usesEndsAt && prev.endsAt ? prev.endsAt + pausedTime : prev.endsAt;

      const newState = {
        ...prev,
        running: true,
        pausedDuration: prev.pausedDuration + pausedTime,
        pausedAt: null,
        endsAt: newEndsAt,
      };

      // Reschedule all phase transition notifications with adjusted times
      if (notificationsEnabled) {
        scheduleAllPhaseTransitions(newState, language);
        showOngoingNotification(newState, language);
      }

      return newState;
    });
  }, [notificationsEnabled, language]);

  const stopTimer = useCallback(() => {
    setTimerState(getDefaultTimerState());
    setDisplayTime(0);
    // Dismiss and cancel all notifications
    cleanupAllFocusNotifications();
  }, []);

  const finishSession = useCallback(async () => {
    const state = timerState;
    if (!state.running && state.phase === 'idle') return;

    let durationMinutes = 0;

    if ((state.mode === 'pomodoro' || state.mode === 'countdown') && state.endsAt) {
      // Calculate how much time was actually spent
      const totalPhaseTime = state.targetMinutes * 60 * 1000;
      const remaining = Math.max(0, state.endsAt - Date.now());
      durationMinutes = Math.round((totalPhaseTime - remaining) / 60000);
    } else if (state.mode === 'countup' && state.startedAt) {
      const elapsed = Date.now() - state.startedAt - state.pausedDuration;
      durationMinutes = Math.round(elapsed / 60000);
    }

    if (durationMinutes >= 1) {
      await saveSession(state, durationMinutes);
    }

    setTimerState(getDefaultTimerState());
    setDisplayTime(0);
    // Dismiss and cancel all notifications
    cleanupAllFocusNotifications();
  }, [timerState, saveSession]);

  const deleteEntry = useCallback(async (id: string) => {
    const updated = await deleteFocusEntry(id);
    setEntries(updated);
  }, []);

  const refreshEntries = useCallback(async () => {
    const loaded = await loadFocusEntries();
    setEntries(loaded);
  }, []);

  return (
    <FocusContext.Provider
      value={{
        entries,
        stats,
        timerState,
        isLoading,
        displayTime,
        isRunning: timerState.running,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        finishSession,
        deleteEntry,
        refreshEntries,
      }}
    >
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
