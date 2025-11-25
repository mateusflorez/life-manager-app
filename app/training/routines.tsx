import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { useTraining } from '@/contexts/training-context';
import { useAlert } from '@/contexts/alert-context';
import { t } from '@/types/training';
import type { WorkoutRoutineWithExercises } from '@/types/training';

export default function RoutinesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;
  const { showToast } = useAlert();

  const { routinesWithExercises, exercisesWithStats, createRoutine, updateRoutine, isLoading } = useTraining();

  const [showModal, setShowModal] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  // Edit state
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutineWithExercises | null>(null);
  const [editName, setEditName] = useState('');
  const [editSelectedExerciseIds, setEditSelectedExerciseIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleCreateRoutine = async () => {
    if (!routineName.trim() || selectedExerciseIds.length === 0) {
      return;
    }

    try {
      await createRoutine(routineName.trim(), selectedExerciseIds);
      showToast({ message: t('routineCreated', language), type: 'success' });
      setRoutineName('');
      setSelectedExerciseIds([]);
      setShowModal(false);
    } catch (error) {
      // Routine already exists - silently ignore
    }
  };

  const handleEditRoutine = (routine: WorkoutRoutineWithExercises) => {
    setEditingRoutine(routine);
    setEditName(routine.name);
    setEditSelectedExerciseIds(routine.exerciseIds);
  };

  const handleCloseEdit = () => {
    setEditingRoutine(null);
    setEditName('');
    setEditSelectedExerciseIds([]);
  };

  const handleSaveEdit = async () => {
    if (!editingRoutine || !editName.trim() || editSelectedExerciseIds.length === 0) return;
    setSaving(true);
    try {
      await updateRoutine(editingRoutine.id, editName.trim(), editSelectedExerciseIds);
      showToast({ message: t('routineUpdated', language), type: 'success' });
      handleCloseEdit();
    } catch (error) {
      // Routine already exists
    } finally {
      setSaving(false);
    }
  };

  const toggleExercise = (exerciseId: string, isEdit: boolean) => {
    if (isEdit) {
      setEditSelectedExerciseIds((prev) =>
        prev.includes(exerciseId)
          ? prev.filter((id) => id !== exerciseId)
          : [...prev, exerciseId]
      );
    } else {
      setSelectedExerciseIds((prev) =>
        prev.includes(exerciseId)
          ? prev.filter((id) => id !== exerciseId)
          : [...prev, exerciseId]
      );
    }
  };

  const sortedRoutines = [...routinesWithExercises].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const sortedExercises = [...exercisesWithStats].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
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
        {/* Routines List */}
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
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIcon}
            >
              <IconSymbol name="list.bullet.clipboard" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('routines', language)} ({sortedRoutines.length})
            </Text>
          </View>

          {sortedRoutines.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconContainer}
              >
                <IconSymbol name="list.bullet.clipboard" size={32} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('noRoutines', language)}
              </Text>
              <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {language === 'pt' ? 'Crie sua primeira ficha de treino!' : 'Create your first workout routine!'}
              </Text>
            </View>
          ) : (
            sortedRoutines.map((routine, index) => (
              <View
                key={routine.id}
                style={[
                  styles.routineRow,
                  {
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
                    borderBottomWidth: index < sortedRoutines.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.routineInfo}
                  onPress={() => router.push(`/training/routine/${routine.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.routineName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {routine.name}
                  </Text>
                  <Text style={[styles.routineStats, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {routine.exercises.length} {t('exercises', language).toLowerCase()} · {routine.timesUsed} {t('timesUsed', language)}
                  </Text>
                </TouchableOpacity>
                <View style={styles.routineActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEditRoutine(routine)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <IconSymbol name="pencil" size={16} color="#6366F1" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => router.push(`/training/routine/${routine.id}`)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <IconSymbol name="chevron.right" size={20} color={isDark ? '#666' : '#9CA3AF'} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* New Routine Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('newRoutine', language)}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <View style={styles.inputHeader}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputIcon}
                  >
                    <IconSymbol name="list.bullet.clipboard" size={12} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t('routineName', language)}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                  placeholder={language === 'pt' ? 'Ex: Treino A - Peito' : 'E.g., Workout A - Chest'}
                  placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                  value={routineName}
                  onChangeText={setRoutineName}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputHeader}>
                  <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputIcon}
                  >
                    <IconSymbol name="dumbbell.fill" size={12} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t('selectExercises', language)} ({selectedExerciseIds.length})
                  </Text>
                </View>

                <ScrollView
                  style={[
                    styles.exercisesList,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    }
                  ]}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {sortedExercises.length === 0 ? (
                    <Text style={[styles.noExercisesText, { color: isDark ? '#666' : '#9CA3AF' }]}>
                      {t('noExercises', language)}
                    </Text>
                  ) : (
                    sortedExercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise.id}
                        style={[
                          styles.exerciseCheckRow,
                          {
                            backgroundColor: selectedExerciseIds.includes(exercise.id)
                              ? isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'
                              : 'transparent',
                          },
                        ]}
                        onPress={() => toggleExercise(exercise.id, false)}
                        activeOpacity={0.7}
                      >
                        <View style={[
                          styles.checkbox,
                          {
                            backgroundColor: selectedExerciseIds.includes(exercise.id) ? '#6366F1' : 'transparent',
                            borderColor: selectedExerciseIds.includes(exercise.id) ? '#6366F1' : isDark ? '#666' : '#9CA3AF',
                          },
                        ]}>
                          {selectedExerciseIds.includes(exercise.id) && (
                            <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                          )}
                        </View>
                        <Text style={[styles.exerciseCheckName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                          {exercise.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalButton,
                (!routineName.trim() || selectedExerciseIds.length === 0) && styles.modalButtonDisabled,
              ]}
              onPress={handleCreateRoutine}
              activeOpacity={0.8}
              disabled={!routineName.trim() || selectedExerciseIds.length === 0}
            >
              <LinearGradient
                colors={(!routineName.trim() || selectedExerciseIds.length === 0) ? ['#888', '#777'] : ['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalButtonGradient}
              >
                <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>{t('create', language)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Routine Modal */}
      <Modal
        visible={editingRoutine !== null}
        animationType="slide"
        transparent
        onRequestClose={handleCloseEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {language === 'pt' ? 'Editar Ficha' : 'Edit Routine'}
              </Text>
              <TouchableOpacity onPress={handleCloseEdit}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <View style={styles.inputHeader}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputIcon}
                  >
                    <IconSymbol name="pencil" size={12} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t('routineName', language)}
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                  placeholder={language === 'pt' ? 'Ex: Treino A - Peito' : 'E.g., Workout A - Chest'}
                  placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputHeader}>
                  <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.inputIcon}
                  >
                    <IconSymbol name="dumbbell.fill" size={12} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.inputLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t('selectExercises', language)} ({editSelectedExerciseIds.length})
                  </Text>
                </View>

                <ScrollView
                  style={[
                    styles.exercisesList,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    }
                  ]}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                >
                  {sortedExercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={[
                        styles.exerciseCheckRow,
                        {
                          backgroundColor: editSelectedExerciseIds.includes(exercise.id)
                            ? isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'
                            : 'transparent',
                        },
                      ]}
                      onPress={() => toggleExercise(exercise.id, true)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkbox,
                        {
                          backgroundColor: editSelectedExerciseIds.includes(exercise.id) ? '#6366F1' : 'transparent',
                          borderColor: editSelectedExerciseIds.includes(exercise.id) ? '#6366F1' : isDark ? '#666' : '#9CA3AF',
                        },
                      ]}>
                        {editSelectedExerciseIds.includes(exercise.id) && (
                          <IconSymbol name="checkmark" size={12} color="#FFFFFF" />
                        )}
                      </View>
                      <Text style={[styles.exerciseCheckName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {exercise.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalButton,
                (saving || !editName.trim() || editSelectedExerciseIds.length === 0) && styles.modalButtonDisabled,
              ]}
              onPress={handleSaveEdit}
              activeOpacity={0.8}
              disabled={saving || !editName.trim() || editSelectedExerciseIds.length === 0}
            >
              <LinearGradient
                colors={(saving || !editName.trim() || editSelectedExerciseIds.length === 0) ? ['#888', '#777'] : ['#6366F1', '#8B5CF6']}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  section: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
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
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  routineStats: {
    fontSize: 13,
  },
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalScroll: {
    maxHeight: 400,
  },
  inputContainer: {
    gap: 8,
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  exercisesList: {
    borderRadius: 12,
    maxHeight: 250,
  },
  exerciseCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseCheckName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  noExercisesText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 14,
  },
  modalButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
});
