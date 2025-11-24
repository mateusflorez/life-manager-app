import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { useTraining } from '@/contexts/training-context';
import { t, formatDate, calculateSessionVolume, getSessionSets, MAX_SETS } from '@/types/training';
import type { TrainingSession, TrainingSet } from '@/types/training';
import { LineChart } from 'react-native-chart-kit';
import { useAlert } from '@/contexts/alert-context';

const screenWidth = Dimensions.get('window').width;

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;
  const { showConfirm, showToast } = useAlert();

  const { getExerciseById, deleteExercise, deleteSession, updateSession, isLoading } = useTraining();
  const exercise = getExerciseById(id ?? '');

  // Edit session state
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [editSets, setEditSets] = useState<Array<{ load: string; reps: string }>>([{ load: '', reps: '' }]);
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [editNotes, setEditNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleDeleteExercise = () => {
    if (!exercise) return;

    showConfirm({
      title: t('deleteExercise', language),
      message: t('deleteExerciseConfirm', language),
      buttons: [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('delete', language),
          style: 'destructive',
          onPress: async () => {
            await deleteExercise(exercise.id);
            router.back();
          },
        },
      ],
    });
  };

  const handleDeleteSession = (sessionId: string) => {
    showConfirm({
      title: t('delete', language),
      message: language === 'pt' ? 'Excluir este treino?' : 'Delete this session?',
      buttons: [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('delete', language),
          style: 'destructive',
          onPress: () => deleteSession(sessionId),
        },
      ],
    });
  };

  const handleEditSession = (session: TrainingSession) => {
    setEditingSession(session);
    const sets = getSessionSets(session);
    setEditSets(sets.map(s => ({ load: s.load.toString(), reps: s.reps.toString() })));
    setEditDate(new Date(session.date + 'T12:00:00'));
    setEditNotes(session.notes || '');
  };

  const handleCloseEdit = () => {
    setEditingSession(null);
    setEditSets([{ load: '', reps: '' }]);
    setEditDate(new Date());
    setEditNotes('');
    setShowDatePicker(false);
  };

  const formatDateForStorage = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForDisplay = (d: Date): string => {
    if (language === 'pt') {
      return d.toLocaleDateString('pt-BR');
    }
    return d.toLocaleDateString('en-US');
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setEditDate(selectedDate);
    }
  };

  const handleSaveSession = async () => {
    if (!editingSession) return;

    // Validate all sets
    const validSets: TrainingSet[] = [];
    for (const set of editSets) {
      const loadNum = parseFloat(set.load);
      const repsNum = parseInt(set.reps, 10);

      if (isNaN(loadNum) || loadNum <= 0 || isNaN(repsNum) || repsNum <= 0) {
        return;
      }
      validSets.push({ load: loadNum, reps: repsNum });
    }

    if (validSets.length === 0) return;

    setSaving(true);
    try {
      const dateStr = formatDateForStorage(editDate);
      await updateSession(editingSession.id, validSets[0].load, validSets[0].reps, dateStr, editNotes, validSets);
      showToast({ message: t('sessionUpdated', language), type: 'success' });
      handleCloseEdit();
    } catch (error) {
      console.error('Failed to update session:', error);
    } finally {
      setSaving(false);
    }
  };

  // Set management functions for edit modal
  const handleAddEditSet = () => {
    if (editSets.length < MAX_SETS) {
      setEditSets([...editSets, { load: '', reps: '' }]);
    }
  };

  const handleRemoveEditSet = (index: number) => {
    if (editSets.length > 1) {
      setEditSets(editSets.filter((_, i) => i !== index));
    }
  };

  const handleUpdateEditSet = (index: number, field: 'load' | 'reps', value: string) => {
    const newSets = [...editSets];
    newSets[index][field] = value;
    setEditSets(newSets);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
      maximumFractionDigits: 0,
    });
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </View>
      </ThemedView>
    );
  }

  if (!exercise) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.emptyStateContainer}>
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconContainer}
          >
            <IconSymbol name="dumbbell.fill" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {language === 'pt' ? 'Exercício não encontrado' : 'Exercise not found'}
          </Text>
        </View>
      </ThemedView>
    );
  }

  // Prepare chart data - last 12 sessions
  const chartSessions = [...exercise.sessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12);

  const hasChartData = chartSessions.length >= 2;

  const chartData = hasChartData
    ? {
        labels: chartSessions.map((s, i) => (i % 3 === 0 ? s.date.slice(5) : '')),
        datasets: [
          {
            data: chartSessions.map((s) => calculateSessionVolume(s)),
            strokeWidth: 2,
          },
        ],
      }
    : null;

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />
      <Stack.Screen options={{ title: exercise.name }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryIcon}
            >
              <IconSymbol name="flame.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {exercise.totalSessions}
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('sessions', language)}
            </Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryIcon}
            >
              <IconSymbol name="chart.bar.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {formatNumber(exercise.totalVolume)}
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('totalVolume', language)}
            </Text>
          </View>
        </View>

        {/* Volume Chart */}
        {hasChartData && chartData && (
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
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionIcon}
              >
                <IconSymbol name="chart.line.uptrend.xyaxis" size={14} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('volumeOverTime', language)}
              </Text>
            </View>
            <LineChart
              data={chartData}
              width={screenWidth - 72}
              height={180}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) =>
                  isDark ? `rgba(255, 255, 255, ${opacity * 0.7})` : `rgba(0, 0, 0, ${opacity * 0.7})`,
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#4CAF50',
                },
                propsForLabels: {
                  fontSize: 10,
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
            />
          </View>
        )}

        {/* Session History */}
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
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIcon}
            >
              <IconSymbol name="list.bullet" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('sessionHistory', language)}
            </Text>
          </View>

          {exercise.sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconSmall}
              >
                <IconSymbol name="dumbbell.fill" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.emptyText, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t('noSessions', language)}
              </Text>
            </View>
          ) : (
            exercise.sessions.map((session, index) => {
              const volume = calculateSessionVolume(session);
              const sets = getSessionSets(session);
              return (
                <View
                  key={session.id}
                  style={[
                    styles.sessionRow,
                    {
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      borderBottomWidth: index < exercise.sessions.length - 1 ? 1 : 0,
                    },
                  ]}
                >
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionMainRow}>
                      <Text style={[styles.sessionDate, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {formatDate(session.date, language)}
                      </Text>
                      <View style={styles.volumeBadge}>
                        <Text style={styles.volumeBadgeText}>{formatNumber(volume)}</Text>
                      </View>
                    </View>
                    <View style={styles.setsContainer}>
                      {sets.map((set, setIndex) => (
                        <Text
                          key={setIndex}
                          style={[styles.sessionDetails, { color: isDark ? '#808080' : '#6B7280' }]}
                        >
                          {sets.length > 1 ? `${setIndex + 1}. ` : ''}{set.load}kg × {set.reps} {t('reps', language).toLowerCase()}
                        </Text>
                      ))}
                    </View>
                    {session.notes && (
                      <Text style={[styles.sessionNotes, { color: isDark ? '#666' : '#9CA3AF' }]}>
                        "{session.notes}"
                      </Text>
                    )}
                  </View>
                  <View style={styles.sessionActions}>
                    <TouchableOpacity
                      style={styles.editSessionButton}
                      onPress={() => handleEditSession(session)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol name="pencil" size={16} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteSessionButton}
                      onPress={() => handleDeleteSession(session.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Delete Exercise Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            },
          ]}
          onPress={handleDeleteExercise}
          activeOpacity={0.7}
        >
          <IconSymbol name="trash" size={18} color="#EF4444" />
          <Text style={styles.deleteButtonText}>{t('deleteExercise', language)}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Session Modal */}
      <Modal
        visible={editingSession !== null}
        animationType="slide"
        transparent
        onRequestClose={handleCloseEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('editSession', language)}
              </Text>
              <TouchableOpacity onPress={handleCloseEdit}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Sets Section */}
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('sets', language)}
              </Text>

              {editSets.map((set, index) => (
                <View key={index} style={styles.setRow}>
                  <View style={styles.setNumber}>
                    <Text style={[styles.setNumberText, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.setInputContainer}>
                    <TextInput
                      style={[
                        styles.setInput,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          color: isDark ? '#FFFFFF' : '#111827',
                        },
                      ]}
                      placeholder={t('load', language)}
                      placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                      value={set.load}
                      onChangeText={(value) => handleUpdateEditSet(index, 'load', value)}
                      keyboardType="decimal-pad"
                    />
                    <Text style={[styles.setUnit, { color: isDark ? '#808080' : '#6B7280' }]}>kg</Text>
                  </View>
                  <Text style={[styles.setMultiplier, { color: isDark ? '#808080' : '#6B7280' }]}>×</Text>
                  <View style={styles.setInputContainer}>
                    <TextInput
                      style={[
                        styles.setInput,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          color: isDark ? '#FFFFFF' : '#111827',
                        },
                      ]}
                      placeholder={t('reps', language)}
                      placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                      value={set.reps}
                      onChangeText={(value) => handleUpdateEditSet(index, 'reps', value)}
                      keyboardType="number-pad"
                    />
                    <Text style={[styles.setUnit, { color: isDark ? '#808080' : '#6B7280' }]}>rep</Text>
                  </View>
                  {editSets.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeSetButton}
                      onPress={() => handleRemoveEditSet(index)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol name="minus.circle.fill" size={22} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {editSets.length < MAX_SETS && (
                <TouchableOpacity
                  style={[
                    styles.addSetButton,
                    {
                      backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.08)',
                    },
                  ]}
                  onPress={handleAddEditSet}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="plus.circle.fill" size={18} color="#4CAF50" />
                  <Text style={styles.addSetButtonText}>{t('addSet', language)}</Text>
                </TouchableOpacity>
              )}

              {/* Date Picker */}
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('date', language)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.datePickerButton,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <IconSymbol name="calendar" size={20} color={isDark ? '#FFFFFF' : '#111827'} />
                <Text style={[styles.datePickerText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {formatDateForDisplay(editDate)}
                </Text>
              </TouchableOpacity>

              {/* Notes */}
              <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('notesOptional', language)}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.notesInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                placeholder={t('notes', language)}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  (editSets.some(s => !s.load || !s.reps) || saving) && styles.modalButtonDisabled,
                ]}
                onPress={handleSaveSession}
                activeOpacity={0.8}
                disabled={editSets.some(s => !s.load || !s.reps) || saving}
              >
                <LinearGradient
                  colors={(editSets.some(s => !s.load || !s.reps) || saving) ? ['#888', '#777'] : ['#4CAF50', '#45A049']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalButtonGradient}
                >
                  <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.modalButtonText}>
                    {saving ? (language === 'pt' ? 'Salvando...' : 'Saving...') : t('save', language)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={editDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 13,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chart: {
    marginLeft: -16,
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyIconSmall: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  sessionInfo: {
    flex: 1,
    gap: 4,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  editSessionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  deleteSessionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  sessionMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  volumeBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  volumeBadgeText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
  },
  sessionDetails: {
    fontSize: 14,
  },
  sessionNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
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
    maxHeight: '80%',
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
  modalButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Sets container for session display
  setsContainer: {
    gap: 2,
  },
  // Set styles
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  setNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '600',
  },
  setInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  setInput: {
    flex: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  setUnit: {
    fontSize: 12,
    marginLeft: 4,
    minWidth: 24,
  },
  setMultiplier: {
    fontSize: 16,
    fontWeight: '500',
  },
  removeSetButton: {
    padding: 2,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  addSetButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
});
