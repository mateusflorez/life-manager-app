import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
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
  showOngoingNotification,
  showCompletionNotification,
  scheduleCompletionNotification,
  cancelScheduledNotification,
  dismissOngoingNotification,
  cleanupFocusNotifications,
} from '@/services/focus-notification';
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

    // Cleanup on unmount
    return () => {
      cleanupFocusNotifications();
    };
  }, []);

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

      // Update ongoing notification every second (not every tick)
      if (notificationsEnabled && now - lastNotificationUpdateRef.current >= 1000) {
        lastNotificationUpdateRef.current = now;
        showOngoingNotification(
          prev.mode,
          prev.phase,
          newDisplayTime,
          prev.cyclesCompleted,
          prev.cyclesTarget,
          language
        );
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

      // Focus complete, start break - show notification
      if (notificationsEnabled) {
        showCompletionNotification('focus', lang);
      }

      // Start break phase
      if (state.breakMinutes > 0) {
        const breakEndsAt = Date.now() + state.breakMinutes * 60 * 1000;
        // Schedule notification for break end
        if (notificationsEnabled) {
          scheduleCompletionNotification(breakEndsAt, 'break', lang);
        }
        return {
          ...state,
          phase: 'break',
          cyclesCompleted,
          endsAt: breakEndsAt,
        };
      }

      // No break, start next focus
      const focusEndsAt = Date.now() + state.targetMinutes * 60 * 1000;
      // Schedule notification for next focus end
      if (notificationsEnabled) {
        scheduleCompletionNotification(focusEndsAt, 'focus', lang);
      }
      return {
        ...state,
        phase: 'focus',
        cyclesCompleted,
        endsAt: focusEndsAt,
        currentSessionStartISO: new Date().toISOString(),
      };
    } else if (state.phase === 'break') {
      // Break complete, start focus - show notification
      if (notificationsEnabled) {
        showCompletionNotification('break', lang);
      }
      const focusEndsAt = Date.now() + state.targetMinutes * 60 * 1000;
      // Schedule notification for focus end
      if (notificationsEnabled) {
        scheduleCompletionNotification(focusEndsAt, 'focus', lang);
      }
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

      // Show initial ongoing notification and schedule completion
      if (notificationsEnabled) {
        showOngoingNotification(
          mode,
          'focus',
          initialDisplayTime,
          0,
          cyclesTarget,
          language
        );

        // Schedule completion notification for when phase ends
        if (endsAt) {
          const notifType = mode === 'countdown' ? 'timer' : 'focus';
          scheduleCompletionNotification(endsAt, notifType, language);
        }
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
    // Cancel scheduled notification when paused
    cancelScheduledNotification();
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState((prev) => {
      const pausedTime = prev.pausedAt ? Date.now() - prev.pausedAt : 0;
      const usesEndsAt = prev.mode === 'pomodoro' || prev.mode === 'countdown';
      const newEndsAt = usesEndsAt && prev.endsAt ? prev.endsAt + pausedTime : prev.endsAt;

      // Reschedule completion notification with new end time
      if (notificationsEnabled && newEndsAt) {
        const notifType = prev.mode === 'countdown' ? 'timer' :
                         prev.phase === 'break' ? 'break' : 'focus';
        scheduleCompletionNotification(newEndsAt, notifType, language);
      }

      return {
        ...prev,
        running: true,
        pausedDuration: prev.pausedDuration + pausedTime,
        pausedAt: null,
        endsAt: newEndsAt,
      };
    });
  }, [notificationsEnabled, language]);

  const stopTimer = useCallback(() => {
    setTimerState(getDefaultTimerState());
    setDisplayTime(0);
    // Dismiss and cancel all notifications
    cleanupFocusNotifications();
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
    cleanupFocusNotifications();
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
