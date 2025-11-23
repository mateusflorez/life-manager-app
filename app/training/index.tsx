import { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
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
    isLoading,
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

  // Generate last 70 days for a complete grid (7x10)
  const last70Days = useMemo(() => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 69; i >= 0; i--) {
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

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

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
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIcon}
            >
              <IconSymbol name="dumbbell.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {totalSessions}
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
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statIcon}
            >
              <IconSymbol name="chart.bar.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {formatNumber(totalVolume)}
            </Text>
            <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('totalVolume', language)}
            </Text>
          </View>
        </View>

        {/* Heatmap */}
        <View
          style={[
            styles.heatmapSection,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.heatmapHeader}>
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIcon}
            >
              <IconSymbol name="calendar" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.heatmapTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {language === 'pt' ? 'Atividade' : 'Activity'}
            </Text>
          </View>
          <View style={styles.heatmapGrid}>
            {last70Days.map((day) => {
              const count = sessionsByDate[day] || 0;
              const intensity = count / maxCount;
              return (
                <View
                  key={day}
                  style={[
                    styles.heatmapCell,
                    {
                      backgroundColor: count > 0
                        ? `rgba(76, 175, 80, ${0.25 + intensity * 0.75})`
                        : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text style={[styles.quickStatLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('today', language)}
            </Text>
            <Text style={[styles.quickStatValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {todaySessions} {t('sessions', language).toLowerCase()}
            </Text>
          </View>
          <View
            style={[
              styles.quickStatCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <Text style={[styles.quickStatLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('thisWeek', language)}
            </Text>
            <Text style={[styles.quickStatValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {weekSessions} | {formatNumber(weekVolume)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenSessionModal}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <IconSymbol name="plus" size={18} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('logSession', language)}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.secondaryButton,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
            onPress={() => setShowExerciseModal(true)}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={18} color={isDark ? '#FFFFFF' : '#111827'} />
            <Text style={[styles.secondaryButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('newExercise', language)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Sessions */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
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

          {recentSessions.length === 0 ? (
            <Text style={[styles.emptyText, { color: isDark ? '#666' : '#9CA3AF' }]}>
              {t('noSessions', language)}
            </Text>
          ) : (
            recentSessions.slice(0, 8).map((session) => (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionRow,
                  { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)' },
                ]}
                onPress={() => router.push(`/training/${session.exerciseId}`)}
                activeOpacity={0.7}
              >
                <View style={styles.sessionInfo}>
                  <Text style={[styles.sessionDate, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {formatShortDate(session.date, language)}
                  </Text>
                  <Text style={[styles.sessionExercise, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {session.exerciseName}
                  </Text>
                  <Text style={[styles.sessionDetails, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {session.load}kg × {session.reps}
                  </Text>
                </View>
                <View style={styles.sessionRight}>
                  <Text style={styles.sessionVolume}>
                    {formatNumber(session.volume)}
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color={isDark ? '#666' : '#9CA3AF'} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* View All Exercises */}
        <TouchableOpacity
          style={[
            styles.viewAllButton,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
          onPress={() => router.push('/training/exercises')}
          activeOpacity={0.8}
        >
          <View style={styles.viewAllLeft}>
            <LinearGradient
              colors={['#4CAF50', '#45A049']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIcon}
            >
              <IconSymbol name="list.bullet" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.viewAllText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('viewAllExercises', language)}
            </Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color={isDark ? '#808080' : '#6B7280'} />
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
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('newExercise', language)}
              </Text>
              <TouchableOpacity onPress={() => setShowExerciseModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  color: isDark ? '#FFFFFF' : '#111827',
                },
              ]}
              placeholder={t('exerciseName', language)}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={exerciseName}
              onChangeText={setExerciseName}
              autoFocus
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCreateExercise}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonText}>{t('create', language)}</Text>
              </LinearGradient>
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
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('logSession', language)}
              </Text>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {exercises.length === 0 ? (
              <View style={styles.emptyExercises}>
                <Text style={[styles.emptyText, { color: isDark ? '#666' : '#9CA3AF' }]}>
                  {t('createExerciseFirst', language)}
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { marginTop: 16 }]}
                  onPress={() => {
                    setShowSessionModal(false);
                    setShowExerciseModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>{t('newExercise', language)}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.sessionFormContainer} showsVerticalScrollIndicator={false}>
                {/* Exercise Search */}
                <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('selectExercise', language)}
                </Text>
                <View
                  style={[
                    styles.searchContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    },
                  ]}
                >
                  <IconSymbol name="magnifyingglass" size={18} color={isDark ? '#666' : '#9CA3AF'} />
                  <TextInput
                    style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
                    placeholder={language === 'pt' ? 'Buscar exercício...' : 'Search exercise...'}
                    placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                    value={exerciseSearch}
                    onChangeText={setExerciseSearch}
                    autoCapitalize="none"
                  />
                  {exerciseSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setExerciseSearch('')}>
                      <IconSymbol name="xmark.circle.fill" size={18} color={isDark ? '#666' : '#9CA3AF'} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Selected Exercise Display */}
                {selectedExercise && (
                  <View style={[styles.selectedExercise, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                    <Text style={styles.selectedExerciseText}>
                      {selectedExercise.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedExerciseId('')}>
                      <IconSymbol name="xmark.circle.fill" size={20} color="#4CAF50" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Exercise List - Scrollable */}
                {!selectedExercise && (
                  <ScrollView
                    style={styles.exerciseListScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    {filteredExercises.length === 0 ? (
                      <Text style={[styles.noResultsText, { color: isDark ? '#666' : '#9CA3AF' }]}>
                        {language === 'pt' ? 'Nenhum exercício encontrado' : 'No exercises found'}
                      </Text>
                    ) : (
                      filteredExercises.map((exercise) => (
                        <TouchableOpacity
                          key={exercise.id}
                          style={[
                            styles.exerciseItem,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                            },
                          ]}
                          onPress={() => {
                            setSelectedExerciseId(exercise.id);
                            setExerciseSearch('');
                          }}
                        >
                          <Text style={[styles.exerciseItemName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            {exercise.name}
                          </Text>
                          <Text style={[styles.exerciseItemStats, { color: isDark ? '#808080' : '#6B7280' }]}>
                            {exercise.totalSessions} {t('sessions', language).toLowerCase()}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                )}

                {/* Load & Reps */}
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {t('load', language)} (kg)
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          color: isDark ? '#FFFFFF' : '#111827',
                        },
                      ]}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                      value={load}
                      onChangeText={setLoad}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {t('reps', language)}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          color: isDark ? '#FFFFFF' : '#111827',
                        },
                      ]}
                      placeholder="0"
                      placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                      value={reps}
                      onChangeText={setReps}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

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
                    {formatDateForDisplay(sessionDate)}
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
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    (!selectedExerciseId || !load || !reps) && styles.modalButtonDisabled,
                  ]}
                  onPress={handleLogSession}
                  activeOpacity={0.8}
                  disabled={!selectedExerciseId || !load || !reps}
                >
                  <LinearGradient
                    colors={(!selectedExerciseId || !load || !reps) ? ['#888', '#777'] : ['#4CAF50', '#45A049']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>{t('addSession', language)}</Text>
                  </LinearGradient>
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
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  heatmapSection: {
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
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  heatmapTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  heatmapCell: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '500',
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
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 15,
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
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardIcon: {
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
    marginBottom: 2,
  },
  sessionExercise: {
    fontSize: 15,
    fontWeight: '600',
  },
  sessionDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  sessionVolume: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  viewAllButton: {
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
  viewAllLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewAllText: {
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
    maxHeight: '85%',
    minHeight: 300,
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
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
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
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  modalButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  sessionFormContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  exerciseListScroll: {
    maxHeight: 180,
    marginBottom: 16,
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
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
    borderRadius: 12,
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
  },
  selectedExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedExerciseText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4CAF50',
  },
  noResultsText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Date picker styles
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
});
