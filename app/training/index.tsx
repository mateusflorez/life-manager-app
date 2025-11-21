import { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { useAccount } from '@/contexts/account-context';
import { useTraining } from '@/contexts/training-context';
import {
  t,
  formatShortDate,
  TRAINING_XP,
} from '@/types/training';

export default function TrainingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const { addXp } = useAccount();
  const language = settings.language;

  const {
    exercises,
    exercisesWithStats,
    recentSessions,
    totalSessions,
    totalVolume,
    todaySessions,
    weekSessions,
    weekVolume,
    getSessionsByDate,
    createExercise,
    logSession,
  } = useTraining();

  // Modal states
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Exercise form
  const [exerciseName, setExerciseName] = useState('');

  // Session form
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [load, setLoad] = useState('');
  const [reps, setReps] = useState('');
  const [sessionDate, setSessionDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');

  const sessionsByDate = getSessionsByDate();

  // Generate last 64 days for a complete grid (8x8)
  const last64Days = useMemo(() => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 63; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      days.push(key);
    }
    return days;
  }, []);

  const maxCount = Math.max(...Object.values(sessionsByDate), 1);

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) {
      return exercisesWithStats;
    }
    const searchLower = exerciseSearch.toLowerCase();
    return exercisesWithStats.filter((exercise) =>
      exercise.name.toLowerCase().includes(searchLower)
    );
  }, [exercisesWithStats, exerciseSearch]);

  // Get selected exercise name
  const selectedExercise = exercisesWithStats.find((e) => e.id === selectedExerciseId);

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      return;
    }

    try {
      await createExercise(exerciseName.trim());
      setExerciseName('');
      setShowExerciseModal(false);
    } catch (error) {
      // Exercise already exists - silently ignore
    }
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
      setSessionDate(selectedDate);
    }
  };

  const handleLogSession = async () => {
    if (!selectedExerciseId) {
      return;
    }

    const loadNum = parseFloat(load);
    const repsNum = parseInt(reps, 10);

    if (isNaN(loadNum) || loadNum <= 0) {
      return;
    }

    if (isNaN(repsNum) || repsNum <= 0) {
      return;
    }

    try {
      const dateStr = formatDateForStorage(sessionDate);
      await logSession(selectedExerciseId, loadNum, repsNum, dateStr, notes);
      await addXp(TRAINING_XP);

      // Reset form
      setSelectedExerciseId('');
      setExerciseSearch('');
      setLoad('');
      setReps('');
      setNotes('');
      setSessionDate(new Date());
      setShowSessionModal(false);
    } catch (error) {
      console.error('Failed to log session:', error);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
      maximumFractionDigits: 0,
    });
  };

  const handleOpenSessionModal = () => {
    setSelectedExerciseId('');
    setExerciseSearch('');
    setLoad('');
    setReps('');
    setNotes('');
    setSessionDate(new Date());
    setShowSessionModal(true);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <ThemedText style={styles.summaryLabel}>{t('sessions', language)}</ThemedText>
            <ThemedText style={styles.summaryValue}>{totalSessions}</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <ThemedText style={styles.summaryLabel}>{t('totalVolume', language)}</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatNumber(totalVolume)}</ThemedText>
          </View>
        </View>

        {/* Heatmap */}
        <View style={[styles.heatmapSection, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          <View style={styles.heatmapGrid}>
            {last64Days.map((day) => {
              const count = sessionsByDate[day] || 0;
              const intensity = count / maxCount;
              return (
                <View
                  key={day}
                  style={[
                    styles.heatmapCell,
                    {
                      backgroundColor: count > 0
                        ? `rgba(76, 175, 80, ${0.2 + intensity * 0.8})`
                        : isDark ? '#333' : '#E0E0E0',
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View style={[styles.quickStatCard, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <ThemedText style={styles.quickStatLabel}>{t('today', language)}</ThemedText>
            <ThemedText style={styles.quickStatValue}>{todaySessions} {t('sessions', language).toLowerCase()}</ThemedText>
          </View>
          <View style={[styles.quickStatCard, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <ThemedText style={styles.quickStatLabel}>{t('thisWeek', language)}</ThemedText>
            <ThemedText style={styles.quickStatValue}>{weekSessions} | {formatNumber(weekVolume)} {t('volume', language)}</ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={handleOpenSessionModal}
          >
            <IconSymbol name="plus" size={20} color="#fff" />
            <ThemedText style={styles.actionButtonText}>{t('logSession', language)}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}
            onPress={() => setShowExerciseModal(true)}
          >
            <IconSymbol name="plus" size={20} color={isDark ? '#fff' : '#11181C'} />
            <ThemedText style={[styles.actionButtonText, { color: isDark ? '#fff' : '#11181C' }]}>
              {t('newExercise', language)}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Recent Sessions */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          <ThemedText style={styles.sectionTitle}>{t('recentSessions', language)}</ThemedText>
          {recentSessions.length === 0 ? (
            <ThemedText style={styles.emptyText}>{t('noSessions', language)}</ThemedText>
          ) : (
            recentSessions.slice(0, 8).map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[styles.sessionRow, { borderBottomColor: isDark ? '#333' : '#E0E0E0' }]}
                onPress={() => router.push(`/training/${session.exerciseId}`)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionInfo}>
                  <ThemedText style={styles.sessionDate}>
                    {formatShortDate(session.date, language)}
                  </ThemedText>
                  <ThemedText style={styles.sessionExercise}>{session.exerciseName}</ThemedText>
                  <ThemedText style={styles.sessionDetails}>
                    {session.load}kg × {session.reps}
                  </ThemedText>
                </View>
                <View style={styles.sessionRight}>
                  <ThemedText style={styles.sessionVolume}>
                    {formatNumber(session.volume)} {t('volume', language)}
                  </ThemedText>
                  <IconSymbol name="chevron.right" size={16} color={isDark ? '#666' : '#999'} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* View All Exercises */}
        <TouchableOpacity
          style={[styles.viewAllButton, { borderColor: isDark ? '#333' : '#E0E0E0' }]}
          onPress={() => router.push('/training/exercises')}
        >
          <ThemedText style={styles.viewAllText}>{t('viewAllExercises', language)}</ThemedText>
          <IconSymbol name="chevron.right" size={20} color={isDark ? '#999' : '#666'} />
        </TouchableOpacity>
      </ScrollView>

      {/* New Exercise Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('newExercise', language)}</ThemedText>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#999'} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#333' : '#F5F5F5',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#E0E0E0',
                },
              ]}
              placeholder={t('exerciseName', language)}
              placeholderTextColor={isDark ? '#888' : '#999'}
              value={exerciseName}
              onChangeText={setExerciseName}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#007AFF' }]}
              onPress={handleCreateExercise}
            >
              <ThemedText style={styles.modalButtonText}>{t('create', language)}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Log Session Modal */}
      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('logSession', language)}</ThemedText>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#999'} />
              </TouchableOpacity>
            </View>

            {exercises.length === 0 ? (
              <View style={styles.emptyExercises}>
                <ThemedText style={styles.emptyText}>{t('createExerciseFirst', language)}</ThemedText>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#007AFF', marginTop: 16 }]}
                  onPress={() => {
                    setShowSessionModal(false);
                    setShowExerciseModal(true);
                  }}
                >
                  <ThemedText style={styles.modalButtonText}>{t('newExercise', language)}</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Exercise Search */}
                <ThemedText style={styles.inputLabel}>{t('selectExercise', language)}</ThemedText>
                <View style={[
                  styles.searchContainer,
                  {
                    backgroundColor: isDark ? '#333' : '#F5F5F5',
                    borderColor: isDark ? '#444' : '#E0E0E0',
                  },
                ]}>
                  <IconSymbol name="magnifyingglass" size={18} color={isDark ? '#888' : '#999'} />
                  <TextInput
                    style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
                    placeholder={language === 'pt' ? 'Buscar exercício...' : 'Search exercise...'}
                    placeholderTextColor={isDark ? '#888' : '#999'}
                    value={exerciseSearch}
                    onChangeText={setExerciseSearch}
                    autoCapitalize="none"
                  />
                  {exerciseSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setExerciseSearch('')}>
                      <IconSymbol name="xmark.circle.fill" size={18} color={isDark ? '#666' : '#999'} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Selected Exercise Display */}
                {selectedExercise && (
                  <View style={[styles.selectedExercise, { backgroundColor: isDark ? '#007AFF20' : '#007AFF10', borderColor: '#007AFF' }]}>
                    <ThemedText style={styles.selectedExerciseText}>
                      {selectedExercise.name}
                    </ThemedText>
                    <TouchableOpacity onPress={() => setSelectedExerciseId('')}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Exercise List */}
                {!selectedExercise && (
                  <View style={styles.exerciseList}>
                    {filteredExercises.length === 0 ? (
                      <ThemedText style={styles.noResultsText}>
                        {language === 'pt' ? 'Nenhum exercício encontrado' : 'No exercises found'}
                      </ThemedText>
                    ) : (
                      filteredExercises.map((exercise) => (
                        <TouchableOpacity
                          key={exercise.id}
                          style={[
                            styles.exerciseItem,
                            {
                              backgroundColor: isDark ? '#252525' : '#F0F0F0',
                              borderColor: isDark ? '#333' : '#E0E0E0',
                            },
                          ]}
                          onPress={() => {
                            setSelectedExerciseId(exercise.id);
                            setExerciseSearch('');
                          }}
                        >
                          <ThemedText style={styles.exerciseItemName}>{exercise.name}</ThemedText>
                          <ThemedText style={styles.exerciseItemStats}>
                            {exercise.totalSessions} {t('sessions', language).toLowerCase()}
                          </ThemedText>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}

                {/* Load & Reps */}
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <ThemedText style={styles.inputLabel}>{t('load', language)} (kg)</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#333' : '#F5F5F5',
                          color: isDark ? '#fff' : '#000',
                          borderColor: isDark ? '#444' : '#E0E0E0',
                        },
                      ]}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#888' : '#999'}
                      value={load}
                      onChangeText={setLoad}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <ThemedText style={styles.inputLabel}>{t('reps', language)}</ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? '#333' : '#F5F5F5',
                          color: isDark ? '#fff' : '#000',
                          borderColor: isDark ? '#444' : '#E0E0E0',
                        },
                      ]}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#888' : '#999'}
                      value={reps}
                      onChangeText={setReps}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                {/* Date Picker */}
                <ThemedText style={styles.inputLabel}>{t('date', language)}</ThemedText>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    {
                      backgroundColor: isDark ? '#333' : '#F5F5F5',
                      borderColor: isDark ? '#444' : '#E0E0E0',
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <IconSymbol name="calendar" size={20} color={isDark ? '#ECEDEE' : '#11181C'} />
                  <ThemedText style={styles.datePickerText}>
                    {formatDateForDisplay(sessionDate)}
                  </ThemedText>
                </TouchableOpacity>

                {/* Notes */}
                <ThemedText style={styles.inputLabel}>{t('notesOptional', language)}</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.notesInput,
                    {
                      backgroundColor: isDark ? '#333' : '#F5F5F5',
                      color: isDark ? '#fff' : '#000',
                      borderColor: isDark ? '#444' : '#E0E0E0',
                    },
                  ]}
                  placeholder={t('notes', language)}
                  placeholderTextColor={isDark ? '#888' : '#999'}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#007AFF' }]}
                  onPress={handleLogSession}
                >
                  <ThemedText style={styles.modalButtonText}>{t('addSession', language)}</ThemedText>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={sessionDate}
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  heatmapSection: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatmapCell: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickStatLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  sessionExercise: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessionDetails: {
    fontSize: 13,
    opacity: 0.7,
  },
  sessionVolume: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  exerciseList: {
    marginBottom: 16,
    maxHeight: 200,
  },
  exerciseItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseItemName: {
    fontSize: 15,
    fontWeight: '500',
  },
  exerciseItemStats: {
    fontSize: 12,
    opacity: 0.6,
  },
  selectedExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  selectedExerciseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  noResultsText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Date picker styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    marginBottom: 12,
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
});
