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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { useTraining } from '@/contexts/training-context';
import { useAlert } from '@/contexts/alert-context';
import { t } from '@/types/training';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;
  const { showConfirm, showToast } = useAlert();

  const { getRoutineById, exercisesWithStats, updateRoutine, deleteRoutine, isLoading } = useTraining();
  const routine = getRoutineById(id ?? '');

  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const handleDeleteRoutine = () => {
    if (!routine) return;

    showConfirm({
      title: t('deleteRoutine', language),
      message: t('deleteRoutineConfirm', language),
      buttons: [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('delete', language),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoutine(routine.id);
              showToast({ message: t('routineDeleted', language), type: 'success' });
              router.back();
            } catch (error) {
              console.error('Failed to delete routine:', error);
            }
          },
        },
      ],
    });
  };

  const handleRemoveExercise = (exerciseId: string) => {
    if (!routine) return;

    const newExerciseIds = routine.exerciseIds.filter((id) => id !== exerciseId);
    if (newExerciseIds.length === 0) {
      showToast({
        message: language === 'pt' ? 'A ficha deve ter pelo menos 1 exercício' : 'Routine must have at least 1 exercise',
        type: 'warning',
      });
      return;
    }

    showConfirm({
      title: t('removeFromRoutine', language),
      message: language === 'pt' ? 'Remover este exercício da ficha?' : 'Remove this exercise from routine?',
      buttons: [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('removeFromRoutine', language),
          style: 'destructive',
          onPress: async () => {
            try {
              await updateRoutine(routine.id, routine.name, newExerciseIds);
              showToast({
                message: language === 'pt' ? 'Exercício removido' : 'Exercise removed',
                type: 'success',
              });
            } catch (error) {
              console.error('Failed to remove exercise:', error);
            }
          },
        },
      ],
    });
  };

  const handleOpenAddExercise = () => {
    if (!routine) return;
    // Get exercises not already in routine
    const availableExercises = exercisesWithStats.filter(
      (e) => !routine.exerciseIds.includes(e.id)
    );
    if (availableExercises.length === 0) {
      showToast({
        message: language === 'pt' ? 'Todos os exercícios já estão na ficha' : 'All exercises are already in routine',
        type: 'info',
      });
      return;
    }
    setSelectedExerciseIds([]);
    setShowAddExerciseModal(true);
  };

  const handleAddExercises = async () => {
    if (!routine || selectedExerciseIds.length === 0) return;

    try {
      const newExerciseIds = [...routine.exerciseIds, ...selectedExerciseIds];
      await updateRoutine(routine.id, routine.name, newExerciseIds);
      showToast({
        message: language === 'pt' ? 'Exercícios adicionados' : 'Exercises added',
        type: 'success',
      });
      setShowAddExerciseModal(false);
    } catch (error) {
      console.error('Failed to add exercises:', error);
    }
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
      maximumFractionDigits: 0,
    });
  };

  // Get exercises not in routine for add modal
  const availableExercises = routine
    ? exercisesWithStats.filter((e) => !routine.exerciseIds.includes(e.id)).sort((a, b) => a.name.localeCompare(b.name))
    : [];

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

  if (!routine) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.emptyStateContainer}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconContainer}
          >
            <IconSymbol name="list.bullet.clipboard" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {language === 'pt' ? 'Ficha não encontrada' : 'Routine not found'}
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />
      <Stack.Screen options={{ title: routine.name }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryIcon}
              >
                <IconSymbol name="dumbbell.fill" size={16} color="#FFFFFF" />
              </LinearGradient>
              <View>
                <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {routine.exercises.length}
                </Text>
                <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('exercises', language)}
                </Text>
              </View>
            </View>
            <View style={styles.summaryItem}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryIcon}
              >
                <IconSymbol name="flame.fill" size={16} color="#FFFFFF" />
              </LinearGradient>
              <View>
                <Text style={[styles.summaryValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {routine.timesUsed}
                </Text>
                <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t('timesUsed', language)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Exercises List */}
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
              <IconSymbol name="list.bullet" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('exercisesInRoutine', language)}
            </Text>
          </View>

          {routine.exercises.map((exercise, index) => {
            const exerciseStats = exercisesWithStats.find((e) => e.id === exercise.id);
            return (
              <View
                key={exercise.id}
                style={[
                  styles.exerciseRow,
                  {
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
                    borderBottomWidth: index < routine.exercises.length - 1 ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.exerciseIndex}>
                  <Text style={[styles.exerciseIndexText, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {index + 1}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.exerciseInfo}
                  onPress={() => router.push(`/training/${exercise.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.exerciseName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {exercise.name}
                  </Text>
                  {exerciseStats && (
                    <Text style={[styles.exerciseStats, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {formatNumber(exerciseStats.totalVolume)} {t('volume', language)}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveExercise(exercise.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol name="minus.circle.fill" size={22} color="#EF4444" />
                </TouchableOpacity>
              </View>
            );
          })}

          {/* Add Exercise Button */}
          <TouchableOpacity
            style={[
              styles.addExerciseButton,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.08)',
              },
            ]}
            onPress={handleOpenAddExercise}
            activeOpacity={0.7}
          >
            <IconSymbol name="plus.circle.fill" size={18} color="#6366F1" />
            <Text style={styles.addExerciseButtonText}>{t('addExerciseToRoutine', language)}</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.08)',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            },
          ]}
          onPress={handleDeleteRoutine}
          activeOpacity={0.7}
        >
          <IconSymbol name="trash" size={18} color="#EF4444" />
          <Text style={styles.deleteButtonText}>{t('deleteRoutine', language)}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('addExerciseToRoutine', language)}
              </Text>
              <TouchableOpacity onPress={() => setShowAddExerciseModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={[
                styles.exercisesList,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                }
              ]}>
                {availableExercises.length === 0 ? (
                  <Text style={[styles.noExercisesText, { color: isDark ? '#666' : '#9CA3AF' }]}>
                    {language === 'pt' ? 'Nenhum exercício disponível' : 'No exercises available'}
                  </Text>
                ) : (
                  availableExercises.map((exercise) => (
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
                      onPress={() => toggleExercise(exercise.id)}
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
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalButton,
                selectedExerciseIds.length === 0 && styles.modalButtonDisabled,
              ]}
              onPress={handleAddExercises}
              activeOpacity={0.8}
              disabled={selectedExerciseIds.length === 0}
            >
              <LinearGradient
                colors={selectedExerciseIds.length === 0 ? ['#888', '#777'] : ['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalButtonGradient}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>
                  {language === 'pt' ? `Adicionar (${selectedExerciseIds.length})` : `Add (${selectedExerciseIds.length})`}
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
    gap: 16,
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
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 13,
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
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseIndexText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  exerciseStats: {
    fontSize: 13,
  },
  removeButton: {
    padding: 4,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  addExerciseButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
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
    maxHeight: '70%',
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
    maxHeight: 350,
  },
  exercisesList: {
    borderRadius: 12,
    overflow: 'hidden',
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
    marginTop: 16,
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
