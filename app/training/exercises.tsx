import { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
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

  const { exercisesWithStats, createExercise } = useTraining();

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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Add Exercise Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: '#007AFF' }]}
          onPress={() => setShowModal(true)}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
          <ThemedText style={styles.addButtonText}>{t('addExercise', language)}</ThemedText>
        </TouchableOpacity>

        {/* Exercises List */}
        <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          <ThemedText style={styles.sectionTitle}>
            {t('exercises', language)} ({sortedExercises.length})
          </ThemedText>

          {sortedExercises.length === 0 ? (
            <ThemedText style={styles.emptyText}>{t('noExercises', language)}</ThemedText>
          ) : (
            sortedExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={[styles.exerciseRow, { borderBottomColor: isDark ? '#333' : '#E0E0E0' }]}
                onPress={() => router.push(`/training/${exercise.id}`)}
              >
                <View style={styles.exerciseInfo}>
                  <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                  <ThemedText style={styles.exerciseStats}>
                    {exercise.totalSessions} {t('sessions', language).toLowerCase()} | {formatNumber(exercise.totalVolume)} {t('volume', language)}
                  </ThemedText>
                </View>
                <IconSymbol name="chevron.right" size={20} color={isDark ? '#666' : '#999'} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* New Exercise Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t('newExercise', language)}</ThemedText>
              <TouchableOpacity onPress={() => setShowModal(false)}>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
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
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 20,
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
  modalButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
