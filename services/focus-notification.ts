// Focus notification service
// Handles persistent notifications during focus sessions and completion sounds
// Uses Android Chronometer for real-time timer updates even when app is in background

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FocusMode, FocusPhase, formatTimerDisplay, Language } from '@/types/focus';

// Notification channel ID for Android
const FOCUS_CHANNEL_ID = 'focus-timer';

// Notification IDs
const ONGOING_NOTIFICATION_ID = 'focus-ongoing';
const SCHEDULED_COMPLETION_ID = 'focus-completion';

// Translations for notifications
const notificationTranslations = {
  en: {
    focusTitle: 'Focus Session',
    breakTitle: 'Break Time',
    focusBody: 'Stay focused!',
    breakBody: 'Take a break',
    focusComplete: 'Focus Complete!',
    breakComplete: 'Break Complete!',
    allCyclesComplete: 'All Cycles Done!',
    cycleInfo: 'Cycle',
    timerComplete: 'Timer Complete!',
    sessionFinished: 'Your focus session has ended.',
    pomodoro: 'Pomodoro',
    countdown: 'Countdown',
    countup: 'Stopwatch',
    timeForBreak: 'Time for a break!',
    backToFocus: 'Back to focus!',
  },
  pt: {
    focusTitle: 'Sessão de Foco',
    breakTitle: 'Hora do Descanso',
    focusBody: 'Mantenha o foco!',
    breakBody: 'Descanse um pouco',
    focusComplete: 'Foco Concluído!',
    breakComplete: 'Descanso Concluído!',
    allCyclesComplete: 'Todos os Ciclos Concluídos!',
    cycleInfo: 'Ciclo',
    timerComplete: 'Timer Concluído!',
    sessionFinished: 'Sua sessão de foco terminou.',
    pomodoro: 'Pomodoro',
    countdown: 'Contagem Regressiva',
    countup: 'Cronômetro',
    timeForBreak: 'Hora do descanso!',
    backToFocus: 'Voltar ao foco!',
  },
};

type NotificationKey = keyof typeof notificationTranslations.en;

function getNotificationText(key: NotificationKey, language: Language): string {
  return notificationTranslations[language]?.[key] ?? notificationTranslations.en[key] ?? key;
}

// Configure notifications
export async function configureFocusNotifications(): Promise<boolean> {
  // Set notification handler - this determines how notifications are handled when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permission not granted');
    return false;
  }

  // Create notification channel for Android with MAX importance for alarm-like behavior
  if (Platform.OS === 'android') {
    // Delete and recreate channel to ensure settings are applied
    try {
      await Notifications.deleteNotificationChannelAsync(FOCUS_CHANNEL_ID);
    } catch {
      // Channel might not exist yet, ignore
    }

    await Notifications.setNotificationChannelAsync(FOCUS_CHANNEL_ID, {
      name: 'Focus Timer',
      description: 'Notifications for focus sessions, breaks, and timer completions',
      importance: Notifications.AndroidImportance.MAX, // Changed from HIGH to MAX for alarm-like behavior
      vibrationPattern: [0, 500, 200, 500], // More noticeable vibration
      sound: 'default',
      enableLights: true,
      lightColor: '#007AFF',
      bypassDnd: true, // Try to bypass Do Not Disturb
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      enableVibrate: true,
    });
  }

  return true;
}

// Show or update ongoing notification with Android chronometer for background support
// The chronometer counts time natively on Android, without needing JS updates
export async function showOngoingNotification(
  mode: FocusMode,
  phase: FocusPhase,
  displayTime: number,
  cyclesCompleted: number,
  cyclesTarget: number,
  language: Language,
  endsAt?: number | null // timestamp when timer ends (for countdown modes)
): Promise<void> {
  if (phase === 'idle') {
    await dismissOngoingNotification();
    return;
  }

  const isBreak = phase === 'break';
  const title = isBreak
    ? getNotificationText('breakTitle', language)
    : getNotificationText('focusTitle', language);

  let body = '';
  if (mode === 'pomodoro') {
    body = `${getNotificationText('cycleInfo', language)} ${cyclesCompleted + 1}/${cyclesTarget}`;
  } else if (mode === 'countdown') {
    body = getNotificationText('focusBody', language);
  } else {
    body = getNotificationText('focusBody', language);
  }

  try {
    // For Android, use chronometer for real-time timer updates in background
    if (Platform.OS === 'android') {
      const isCountdown = mode === 'pomodoro' || mode === 'countdown';

      // Use type assertion for Android-specific notification options
      // showChronometer, chronometerCountDown, when, usesChronometer, ongoing are valid Android options
      // but not typed in expo-notifications
      const androidContent = {
        title,
        body,
        sound: false,
        sticky: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        channelId: FOCUS_CHANNEL_ID,
        // Android-specific chronometer options
        showChronometer: true,
        chronometerCountDown: isCountdown,
        // For countdown: when the timer ends. For countup: when the timer started
        when: isCountdown && endsAt ? endsAt : Date.now() - displayTime,
        usesChronometer: true,
        ongoing: true,
      } as Notifications.NotificationContentInput;

      await Notifications.scheduleNotificationAsync({
        identifier: ONGOING_NOTIFICATION_ID,
        content: androidContent,
        trigger: null,
      });
    } else {
      // iOS fallback - just show the time (will only update when app is in foreground)
      await Notifications.scheduleNotificationAsync({
        identifier: ONGOING_NOTIFICATION_ID,
        content: {
          title,
          body: `${formatTimerDisplay(displayTime)}${mode === 'pomodoro' ? ` - ${body}` : ''}`,
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

// Schedule a completion notification at a specific time
// This will fire even when app is in background!
export async function scheduleCompletionNotification(
  endsAt: number, // timestamp in ms
  type: 'focus' | 'break' | 'timer',
  language: Language
): Promise<void> {
  // Cancel any existing scheduled notification first
  await cancelScheduledNotification();

  let title: string;
  let body: string;

  switch (type) {
    case 'focus':
      title = getNotificationText('focusComplete', language);
      body = getNotificationText('timeForBreak', language);
      break;
    case 'break':
      title = getNotificationText('breakComplete', language);
      body = getNotificationText('backToFocus', language);
      break;
    case 'timer':
      title = getNotificationText('timerComplete', language);
      body = getNotificationText('sessionFinished', language);
      break;
  }

  const triggerDate = new Date(endsAt);
  const now = Date.now();

  // Only schedule if in the future
  if (endsAt <= now) {
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      identifier: SCHEDULED_COMPLETION_ID,
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' && {
          channelId: FOCUS_CHANNEL_ID,
        }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch (error) {
    console.warn('Failed to schedule completion notification:', error);
  }
}

// Cancel the scheduled completion notification
export async function cancelScheduledNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(SCHEDULED_COMPLETION_ID);
  } catch (error) {
    // Ignore - notification might not exist
  }
}

// Dismiss ongoing notification
export async function dismissOngoingNotification(): Promise<void> {
  try {
    await Notifications.dismissNotificationAsync(ONGOING_NOTIFICATION_ID);
  } catch (error) {
    // Ignore - notification might not exist
  }
}

// Show immediate completion notification (used when app is in foreground)
export async function showCompletionNotification(
  type: 'focus' | 'break' | 'allCycles' | 'timer',
  language: Language
): Promise<void> {
  let title: string;
  let body: string;

  switch (type) {
    case 'focus':
      title = getNotificationText('focusComplete', language);
      body = getNotificationText('timeForBreak', language);
      break;
    case 'break':
      title = getNotificationText('breakComplete', language);
      body = getNotificationText('backToFocus', language);
      break;
    case 'allCycles':
      title = getNotificationText('allCyclesComplete', language);
      body = getNotificationText('sessionFinished', language);
      break;
    case 'timer':
      title = getNotificationText('timerComplete', language);
      body = getNotificationText('sessionFinished', language);
      break;
  }

  // Dismiss ongoing notification first
  await dismissOngoingNotification();
  // Cancel any scheduled notification (we're showing it now)
  await cancelScheduledNotification();

  // Show completion notification
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        ...(Platform.OS === 'android' && {
          channelId: FOCUS_CHANNEL_ID,
        }),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to show completion notification:', error);
  }
}

// Cleanup all notifications
export async function cleanupFocusNotifications(): Promise<void> {
  await dismissOngoingNotification();
  await cancelScheduledNotification();
}
