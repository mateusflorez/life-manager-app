import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocus } from '@/contexts/focus-context';
import { useSettings } from '@/contexts/settings-context';
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
import { useAlert } from '@/contexts/alert-context';

export default function FocusScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;
  const { showToast, showConfirm } = useAlert();

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

  const handleStart = () => {
    const target = parseInt(targetMinutes, 10);
    const breakMin = parseInt(breakMinutes, 10);
    const cycleCount = parseInt(cycles, 10);

    // Pomodoro mode: validate all fields
    if (selectedMode === 'pomodoro') {
      if (!target || target < 1) {
        showToast({ message: t('invalidTarget', language), type: 'warning' });
        return;
      }
      if (!breakMin || breakMin < 1) {
        showToast({ message: t('invalidBreak', language), type: 'warning' });
        return;
      }
      if (!cycleCount || cycleCount < 1) {
        showToast({ message: t('invalidCycles', language), type: 'warning' });
        return;
      }
    }

    // Countdown mode: validate duration only
    if (selectedMode === 'countdown') {
      if (!target || target < 1) {
        showToast({ message: t('invalidTarget', language), type: 'warning' });
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
    showConfirm({
      title: '',
      message: t('deleteConfirm', language),
      buttons: [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('stop', language),
          style: 'destructive',
          onPress: stopTimer,
        },
      ],
    });
  };

  const handleFinish = async () => {
    await finishSession();
  };

  const recentEntries = entries.slice(0, RECENT_LIMIT);

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIcon}
            >
              <IconSymbol name="clock.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {stats.totalMinutes}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('total', language)} ({t('min', language)})
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIcon}
            >
              <IconSymbol name="sun.max.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {stats.todayMinutes}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('today', language)} ({t('min', language)})
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIcon}
            >
              <IconSymbol name="flame.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {stats.streak}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('streak', language)}
            </Text>
          </View>
        </View>

        {/* Timer Card */}
        <View
          style={[
            styles.timerCard,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIcon}
            >
              <IconSymbol name="timer" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('timer', language)}
            </Text>
          </View>

          {/* Mode Selector */}
          {!isActive && (
            <TouchableOpacity
              style={[
                styles.modeSelector,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                },
              ]}
              onPress={() => setShowModeModal(true)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeSelectorIcon}
              >
                <IconSymbol
                  name={selectedMode === 'pomodoro' ? 'clock.badge.checkmark' : selectedMode === 'countdown' ? 'timer' : 'stopwatch'}
                  size={14}
                  color="#FFFFFF"
                />
              </LinearGradient>
              <Text style={[styles.modeText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t(selectedMode, language)}
              </Text>
              <IconSymbol name="chevron.right" size={16} color={isDark ? '#808080' : '#6B7280'} />
            </TouchableOpacity>
          )}

          {/* Pomodoro Config - Focus, Break, Cycles */}
          {!isActive && selectedMode === 'pomodoro' && (
            <View style={styles.configGrid}>
              <View style={styles.configItem}>
                <Text style={[styles.configLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('targetMin', language)}
                </Text>
                <TextInput
                  style={[
                    styles.configInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                  value={targetMinutes}
                  onChangeText={setTargetMinutes}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.configItem}>
                <Text style={[styles.configLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('breakMin', language)}
                </Text>
                <TextInput
                  style={[
                    styles.configInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                  value={breakMinutes}
                  onChangeText={setBreakMinutes}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
              <View style={styles.configItem}>
                <Text style={[styles.configLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('cycles', language)}
                </Text>
                <TextInput
                  style={[
                    styles.configInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
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
                <Text style={[styles.configLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('duration', language)}
                </Text>
                <TextInput
                  style={[
                    styles.configInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                  value={targetMinutes}
                  onChangeText={setTargetMinutes}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>
          )}

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <LinearGradient
              colors={isActive ? (timerState.phase === 'break' ? ['#F59E0B', '#D97706'] : ['#6366F1', '#8B5CF6']) : ['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.timerCircle}
            >
              <Text style={styles.timerDisplay}>
                {formatTimerDisplay(displayTime)}
              </Text>
              <Text style={styles.phaseLabel}>
                {timerState.phase === 'idle'
                  ? t('idle', language)
                  : timerState.phase === 'focus'
                    ? t('focusPhase', language)
                    : t('breakPhase', language)}
              </Text>
            </LinearGradient>
            {isActive && timerState.mode === 'pomodoro' && (
              <Text style={[styles.cycleInfo, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t('cycles', language)}: {timerState.cyclesCompleted}/{timerState.cyclesTarget}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {!isActive ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStart}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <IconSymbol name="play.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>{t('start', language)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <>
                {isRunning ? (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={pauseTimer}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#F59E0B', '#D97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButtonGradient}
                    >
                      <IconSymbol name="pause.fill" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>{t('pause', language)}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={resumeTimer}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButtonGradient}
                    >
                      <IconSymbol name="play.fill" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>{t('resume', language)}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleStop}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionButtonGradient}
                  >
                    <IconSymbol name="stop.fill" size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>{t('stop', language)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
                {(timerState.mode === 'countup' || timerState.mode === 'countdown') && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleFinish}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButtonGradient}
                    >
                      <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                      <Text style={styles.actionButtonText}>{t('finish', language)}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Recent Sessions Card */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIcon}
              >
                <IconSymbol name="clock.fill" size={14} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('recentSessions', language)}
              </Text>
            </View>
            {entries.length > RECENT_LIMIT && (
              <TouchableOpacity onPress={() => router.push('/focus/history')}>
                <Text style={styles.viewAllText}>{t('viewAll', language)}</Text>
              </TouchableOpacity>
            )}
          </View>

          {recentEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol name="clock" size={40} color={isDark ? '#666' : '#9CA3AF'} />
              <Text style={[styles.emptyText, { color: isDark ? '#666' : '#9CA3AF' }]}>
                {t('noHistory', language)}
              </Text>
            </View>
          ) : (
            recentEntries.map((entry, index) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.entryRow,
                  index < recentEntries.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.entryIcon}
                >
                  <IconSymbol
                    name={entry.mode === 'pomodoro' ? 'clock.badge.checkmark' : entry.mode === 'countdown' ? 'timer' : 'stopwatch'}
                    size={14}
                    color="#FFFFFF"
                  />
                </LinearGradient>
                <View style={styles.entryContent}>
                  <Text style={[styles.entryDuration, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {entry.durationMinutes} {t('min', language)}
                  </Text>
                  <Text style={[styles.entryDate, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {formatDateTime(entry.startedAt, language)}
                  </Text>
                </View>
                <View style={[styles.modeTag, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <Text style={styles.modeTagText}>{t(entry.mode, language)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* View History Button */}
        <TouchableOpacity
          style={[
            styles.viewHistoryButton,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
          onPress={() => router.push('/focus/history')}
          activeOpacity={0.8}
        >
          <View style={styles.viewHistoryLeft}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIcon}
            >
              <IconSymbol name="list.bullet" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.viewHistoryText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('viewAll', language)} {t('history', language)}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={isDark ? '#808080' : '#6B7280'} />
        </TouchableOpacity>
      </ScrollView>

      {/* Mode Selection Modal */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('selectMode', language)}
              </Text>
              <TouchableOpacity onPress={() => setShowModeModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* Pomodoro Option */}
            <TouchableOpacity
              style={[
                styles.modeOption,
                selectedMode === 'pomodoro' && styles.modeOptionSelected,
              ]}
              onPress={() => {
                setSelectedMode('pomodoro');
                setShowModeModal(false);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeOptionIcon}
              >
                <IconSymbol name="clock.badge.checkmark" size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('pomodoro', language)}
                </Text>
                <Text style={[styles.modeOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('pomodoroDesc', language)}
                </Text>
              </View>
              {selectedMode === 'pomodoro' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>

            {/* Countdown Option */}
            <TouchableOpacity
              style={[
                styles.modeOption,
                selectedMode === 'countdown' && styles.modeOptionSelected,
              ]}
              onPress={() => {
                setSelectedMode('countdown');
                setShowModeModal(false);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeOptionIcon}
              >
                <IconSymbol name="timer" size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('countdown', language)}
                </Text>
                <Text style={[styles.modeOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('countdownDesc', language)}
                </Text>
              </View>
              {selectedMode === 'countdown' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>

            {/* Countup Option */}
            <TouchableOpacity
              style={[
                styles.modeOption,
                selectedMode === 'countup' && styles.modeOptionSelected,
              ]}
              onPress={() => {
                setSelectedMode('countup');
                setShowModeModal(false);
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeOptionIcon}
              >
                <IconSymbol name="stopwatch" size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modeOptionText}>
                <Text style={[styles.modeOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('countup', language)}
                </Text>
                <Text style={[styles.modeOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('countupDesc', language)}
                </Text>
              </View>
              {selectedMode === 'countup' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  timerCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    gap: 12,
  },
  modeSelectorIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
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
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  configInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  timerDisplay: {
    fontSize: 44,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    color: '#FFFFFF',
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    color: '#FFFFFF',
  },
  cycleInfo: {
    fontSize: 14,
    marginTop: 12,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6366F1',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryContent: {
    flex: 1,
  },
  entryDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  modeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6366F1',
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  viewHistoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewHistoryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  modeOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  modeOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 4,
    lineHeight: 18,
  },
});
