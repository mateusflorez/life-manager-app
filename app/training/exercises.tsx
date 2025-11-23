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
import { t } from '@/types/training';

export default function ExercisesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;

  const { exercisesWithStats, createExercise, isLoading } = useTraining();

  const [showModal, setShowModal] = useState(false);
  const [exerciseName, setExerciseName] = useState('');

  const handleCreateExercise = async () => {
    if (!exerciseName.trim()) {
      return;
    }

    try {
      await createExercise(exerciseName.trim());
      setExerciseName('');
      setShowModal(false);
    } catch (error) {
      // Exercise already exists - silently ignore
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
      maximumFractionDigits: 0,
    });
  };

  const sortedExercises = [...exercisesWithStats].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

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
              <IconSymbol name="dumbbell.fill" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('exercises', language)} ({sortedExercises.length})
            </Text>
          </View>

          {sortedExercises.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['#4CAF50', '#45A049']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyIconContainer}
              >
                <IconSymbol name="dumbbell.fill" size={32} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('noExercises', language)}
              </Text>
              <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {language === 'pt' ? 'Adicione seu primeiro exercício!' : 'Add your first exercise!'}
              </Text>
            </View>
          ) : (
            sortedExercises.map((exercise, index) => (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseRow,
                  {
                    borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.08)',
                    borderBottomWidth: index < sortedExercises.length - 1 ? 1 : 0,
                  },
                ]}
                onPress={() => router.push(`/training/${exercise.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.exerciseInfo}>
                  <Text style={[styles.exerciseName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {exercise.name}
                  </Text>
                  <Text style={[styles.exerciseStats, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {exercise.totalSessions} {t('sessions', language).toLowerCase()} · {formatNumber(exercise.totalVolume)} {t('volume', language)}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
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
          colors={['#4CAF50', '#45A049']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* New Exercise Modal */}
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
                {t('newExercise', language)}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
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
                  {t('exerciseName', language)}
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
                placeholder={language === 'pt' ? 'Ex: Supino reto' : 'E.g., Bench press'}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                value={exerciseName}
                onChangeText={setExerciseName}
                autoFocus
              />
            </View>

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
                <IconSymbol name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.modalButtonText}>{t('create', language)}</Text>
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
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseStats: {
    fontSize: 13,
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
    shadowColor: '#4CAF50',
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
    shadowColor: '#4CAF50',
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
  inputContainer: {
    gap: 8,
    marginBottom: 12,
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
  modalButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
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
