import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocus } from '@/contexts/focus-context';
import { useSettings } from '@/contexts/settings-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  t,
  formatTimerDisplay,
  formatDateTime,
  FocusMode,
  RECENT_LIMIT,
  DEFAULT_TARGET_MINUTES,
  DEFAULT_BREAK_MINUTES,
  DEFAULT_CYCLES,
} from '@/types/focus';

export default function FocusScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;

  const {
    entries,
    stats,
    timerState,
    displayTime,
    isRunning,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    finishSession,
  } = useFocus();

  // Local state for config inputs
  const [targetMinutes, setTargetMinutes] = useState(
    String(timerState.targetMinutes || DEFAULT_TARGET_MINUTES)
  );
  const [breakMinutes, setBreakMinutes] = useState(
    String(timerState.breakMinutes || DEFAULT_BREAK_MINUTES)
  );
  const [cycles, setCycles] = useState(
    String(timerState.cyclesTarget || DEFAULT_CYCLES)
  );
  const [selectedMode, setSelectedMode] = useState<FocusMode>(timerState.mode);
  const [showModeModal, setShowModeModal] = useState(false);

  const isActive = timerState.phase !== 'idle';
  const isPaused = !isRunning && isActive;

  // Theme colors
  const cardBg = isDark ? '#1A1A1A' : '#F9F9F9';
  const borderColor = isDark ? '#333' : '#E0E0E0';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#999' : '#666';
  const accentColor = '#007AFF';
  const greenColor = '#10B981';

  const handleStart = () => {
    const target = parseInt(targetMinutes, 10);
    const breakMin = parseInt(breakMinutes, 10);
    const cycleCount = parseInt(cycles, 10);

    // Pomodoro mode: validate all fields
    if (selectedMode === 'pomodoro') {
      if (!target || target < 1) {
        Alert.alert('', t('invalidTarget', language));
        return;
      }
      if (!breakMin || breakMin < 1) {
        Alert.alert('', t('invalidBreak', language));
        return;
      }
      if (!cycleCount || cycleCount < 1) {
        Alert.alert('', t('invalidCycles', language));
        return;
      }
    }

    // Countdown mode: validate duration only
    if (selectedMode === 'countdown') {
      if (!target || target < 1) {
        Alert.alert('', t('invalidTarget', language));
        return;
      }
    }

    // Countup mode: no validation needed

    startTimer(selectedMode, {
      targetMinutes: target,
      breakMinutes: breakMin,
      cyclesTarget: cycleCount,
    });
  };

  const handleStop = () => {
    Alert.alert(
      '',
      t('deleteConfirm', language),
      [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('stop', language),
          style: 'destructive',
          onPress: stopTimer,
        },
      ]
    );
  };

  const handleFinish = async () => {
    await finishSession();
  };

  const recentEntries = entries.slice(0, RECENT_LIMIT);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#151718' : '#fff' }]}
      contentContainerStyle={styles.content}
    >
      {/* Stats Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.cardTitle, { color: textPrimary }]}>
          {t('focusStats', language)}
        </Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textPrimary }]}>
              {stats.totalMinutes}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>
              {t('total', language)} ({t('min', language)})
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: textPrimary }]}>
              {stats.todayMinutes}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>
              {t('today', language)} ({t('min', language)})
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: greenColor }]}>
              {stats.streak}
            </Text>
            <Text style={[styles.statLabel, { color: textSecondary }]}>
              {t('streak', language)} ({stats.streak === 1 ? t('day', language) : t('days', language)})
            </Text>
          </View>
        </View>
        {stats.lastEntry && (
          <Text style={[styles.lastSession, { color: textSecondary }]}>
            {t('lastSession', language)}: {stats.lastEntry.durationMinutes} {t('min', language)} ·{' '}
            {formatDateTime(stats.lastEntry.startedAt, language)}
          </Text>
        )}
      </View>

      {/* Timer Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <Text style={[styles.cardTitle, { color: textPrimary }]}>
          {t('timer', language)}
        </Text>

        {/* Mode Selector */}
        {!isActive && (
          <TouchableOpacity
            style={[styles.modeSelector, { borderColor }]}
            onPress={() => setShowModeModal(true)}
          >
            <IconSymbol
              name={selectedMode === 'pomodoro' ? 'clock.badge.checkmark' : selectedMode === 'countdown' ? 'timer' : 'stopwatch'}
              size={20}
              color={accentColor}
            />
            <Text style={[styles.modeText, { color: textPrimary }]}>
              {t(selectedMode, language)}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={textSecondary} />
          </TouchableOpacity>
        )}

        {/* Pomodoro Config - Focus, Break, Cycles */}
        {!isActive && selectedMode === 'pomodoro' && (
          <View style={styles.configGrid}>
            <View style={styles.configItem}>
              <Text style={[styles.configLabel, { color: textSecondary }]}>
                {t('targetMin', language)}
              </Text>
              <TextInput
                style={[
                  styles.configInput,
                  { backgroundColor: isDark ? '#252525' : '#fff', color: textPrimary, borderColor },
                ]}
                value={targetMinutes}
                onChangeText={setTargetMinutes}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={styles.configItem}>
              <Text style={[styles.configLabel, { color: textSecondary }]}>
                {t('breakMin', language)}
              </Text>
              <TextInput
                style={[
                  styles.configInput,
                  { backgroundColor: isDark ? '#252525' : '#fff', color: textPrimary, borderColor },
                ]}
                value={breakMinutes}
                onChangeText={setBreakMinutes}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <View style={styles.configItem}>
              <Text style={[styles.configLabel, { color: textSecondary }]}>
                {t('cycles', language)}
              </Text>
              <TextInput
                style={[
                  styles.configInput,
                  { backgroundColor: isDark ? '#252525' : '#fff', color: textPrimary, borderColor },
                ]}
                value={cycles}
                onChangeText={setCycles}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        )}

        {/* Countdown Config - Duration only */}
        {!isActive && selectedMode === 'countdown' && (
          <View style={styles.configGrid}>
            <View style={[styles.configItem, { flex: 1 }]}>
              <Text style={[styles.configLabel, { color: textSecondary }]}>
                {t('duration', language)}
              </Text>
              <TextInput
                style={[
                  styles.configInput,
                  { backgroundColor: isDark ? '#252525' : '#fff', color: textPrimary, borderColor },
                ]}
                value={targetMinutes}
                onChangeText={setTargetMinutes}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
          </View>
        )}

        {/* Countup has no config - just start */}

        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <Text style={[styles.timerDisplay, { color: textPrimary }]}>
            {formatTimerDisplay(displayTime)}
          </Text>
          <Text style={[styles.phaseLabel, { color: accentColor }]}>
            {timerState.phase === 'idle'
              ? t('idle', language)
              : timerState.phase === 'focus'
                ? t('focusPhase', language)
                : t('breakPhase', language)}
          </Text>
          {isActive && timerState.mode === 'pomodoro' && (
            <Text style={[styles.cycleInfo, { color: textSecondary }]}>
              {t('cycles', language)}: {timerState.cyclesCompleted}/{timerState.cyclesTarget}
            </Text>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          {!isActive ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={handleStart}
            >
              <Text style={styles.buttonText}>{t('start', language)}</Text>
            </TouchableOpacity>
          ) : (
            <>
              {isRunning ? (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: '#F59E0B' }]}
                  onPress={pauseTimer}
                >
                  <Text style={styles.buttonText}>{t('pause', language)}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: greenColor }]}
                  onPress={resumeTimer}
                >
                  <Text style={styles.buttonText}>{t('resume', language)}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#EF4444' }]}
                onPress={handleStop}
              >
                <Text style={styles.buttonText}>{t('stop', language)}</Text>
              </TouchableOpacity>
              {(timerState.mode === 'countup' || timerState.mode === 'countdown') && (
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: accentColor }]}
                  onPress={handleFinish}
                >
                  <Text style={styles.buttonText}>{t('finish', language)}</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      {/* Recent Sessions Card */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: textPrimary }]}>
            {t('recentSessions', language)}
          </Text>
          {entries.length > RECENT_LIMIT && (
            <TouchableOpacity onPress={() => router.push('/focus/history')}>
              <Text style={[styles.viewAll, { color: accentColor }]}>
                {t('viewAll', language)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {recentEntries.length === 0 ? (
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            {t('noHistory', language)}
          </Text>
        ) : (
          recentEntries.map((entry) => (
            <View
              key={entry.id}
              style={[styles.entryItem, { borderBottomColor: borderColor }]}
            >
              <View style={styles.entryIcon}>
                <IconSymbol
                  name={entry.mode === 'pomodoro' ? 'clock.badge.checkmark' : entry.mode === 'countdown' ? 'timer' : 'stopwatch'}
                  size={16}
                  color={textSecondary}
                />
              </View>
              <View style={styles.entryContent}>
                <Text style={[styles.entryDuration, { color: textPrimary }]}>
                  {entry.durationMinutes} {t('min', language)}
                </Text>
                <Text style={[styles.entryDate, { color: textSecondary }]}>
                  {formatDateTime(entry.startedAt, language)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Mode Selection Modal */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModeModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModeModal(false)}
        >
          <View
            style={[styles.modalContent, { backgroundColor: cardBg }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: textPrimary }]}>
              {t('selectMode', language)}
            </Text>

            {/* Pomodoro - Focus and break cycles */}
            <TouchableOpacity
              style={[
                styles.modeOption,
                { borderColor },
                selectedMode === 'pomodoro' && { borderColor: accentColor, backgroundColor: isDark ? '#1a3a5c' : '#E8F4FD' },
              ]}
              onPress={() => {
                setSelectedMode('pomodoro');
                setShowModeModal(false);
              }}
            >
              <IconSymbol name="clock.badge.checkmark" size={24} color={accentColor} />
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, { color: textPrimary }]}>
                  {t('pomodoro', language)}
                </Text>
                <Text style={[styles.modeOptionDesc, { color: textSecondary }]}>
                  {t('pomodoroDesc', language)}
                </Text>
              </View>
              {selectedMode === 'pomodoro' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={accentColor} />
              )}
            </TouchableOpacity>

            {/* Countdown - Simple timer */}
            <TouchableOpacity
              style={[
                styles.modeOption,
                { borderColor },
                selectedMode === 'countdown' && { borderColor: accentColor, backgroundColor: isDark ? '#1a3a5c' : '#E8F4FD' },
              ]}
              onPress={() => {
                setSelectedMode('countdown');
                setShowModeModal(false);
              }}
            >
              <IconSymbol name="timer" size={24} color={accentColor} />
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, { color: textPrimary }]}>
                  {t('countdown', language)}
                </Text>
                <Text style={[styles.modeOptionDesc, { color: textSecondary }]}>
                  {t('countdownDesc', language)}
                </Text>
              </View>
              {selectedMode === 'countdown' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={accentColor} />
              )}
            </TouchableOpacity>

            {/* Countup - Stopwatch */}
            <TouchableOpacity
              style={[
                styles.modeOption,
                { borderColor },
                selectedMode === 'countup' && { borderColor: accentColor, backgroundColor: isDark ? '#1a3a5c' : '#E8F4FD' },
              ]}
              onPress={() => {
                setSelectedMode('countup');
                setShowModeModal(false);
              }}
            >
              <IconSymbol name="stopwatch" size={24} color={accentColor} />
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, { color: textPrimary }]}>
                  {t('countup', language)}
                </Text>
                <Text style={[styles.modeOptionDesc, { color: textSecondary }]}>
                  {t('countupDesc', language)}
                </Text>
              </View>
              {selectedMode === 'countup' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color={accentColor} />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  lastSession: {
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  modeText: {
    flex: 1,
    fontSize: 16,
  },
  configGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  configItem: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  configInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  timerDisplay: {
    fontSize: 64,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  cycleInfo: {
    fontSize: 14,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 25,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    minWidth: 160,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  entryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryContent: {
    flex: 1,
  },
  entryDuration: {
    fontSize: 16,
    fontWeight: '500',
  },
  entryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    gap: 12,
  },
  modeOptionText: {
    flex: 1,
  },
  modeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modeOptionDesc: {
    fontSize: 13,
    marginTop: 2,
  },
});
