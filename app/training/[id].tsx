import { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { useTraining } from '@/contexts/training-context';
import { t, formatDate, calculateVolume } from '@/types/training';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;

  const { getExerciseById, deleteExercise, deleteSession } = useTraining();
  const exercise = getExerciseById(id ?? '');

  if (!exercise) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.emptyText}>Exercise not found</ThemedText>
      </ThemedView>
    );
  }

  const handleDeleteExercise = () => {
    Alert.alert(
      t('deleteExercise', language),
      t('deleteExerciseConfirm', language),
      [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('delete', language),
          style: 'destructive',
          onPress: async () => {
            await deleteExercise(exercise.id);
            router.back();
          },
        },
      ]
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    Alert.alert(
      t('delete', language),
      language === 'pt' ? 'Excluir este treino?' : 'Delete this session?',
      [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('delete', language),
          style: 'destructive',
          onPress: () => deleteSession(sessionId),
        },
      ]
    );
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(language === 'pt' ? 'pt-BR' : 'en-US', {
      maximumFractionDigits: 0,
    });
  };

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
            data: chartSessions.map((s) => calculateVolume(s.load, s.reps)),
            strokeWidth: 2,
          },
        ],
      }
    : null;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: exercise.name }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <ThemedText style={styles.summaryLabel}>{t('sessions', language)}</ThemedText>
            <ThemedText style={styles.summaryValue}>{exercise.totalSessions}</ThemedText>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <ThemedText style={styles.summaryLabel}>{t('totalVolume', language)}</ThemedText>
            <ThemedText style={styles.summaryValue}>{formatNumber(exercise.totalVolume)}</ThemedText>
          </View>
        </View>

        {/* Volume Chart */}
        {hasChartData && chartData && (
          <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
            <ThemedText style={styles.sectionTitle}>{t('volumeOverTime', language)}</ThemedText>
            <LineChart
              data={chartData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: isDark ? '#1A1A1A' : '#F9F9F9',
                backgroundGradientTo: isDark ? '#1A1A1A' : '#F9F9F9',
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
        <View style={[styles.section, { backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9', borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          <ThemedText style={styles.sectionTitle}>{t('sessionHistory', language)}</ThemedText>

          {exercise.sessions.length === 0 ? (
            <ThemedText style={styles.emptyText}>{t('noSessions', language)}</ThemedText>
          ) : (
            exercise.sessions.map((session) => {
              const volume = calculateVolume(session.load, session.reps);
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[styles.sessionRow, { borderBottomColor: isDark ? '#333' : '#E0E0E0' }]}
                  onLongPress={() => handleDeleteSession(session.id)}
                >
                  <View style={styles.sessionInfo}>
                    <ThemedText style={styles.sessionDate}>
                      {formatDate(session.date, language)}
                    </ThemedText>
                    <ThemedText style={styles.sessionDetails}>
                      {session.load}kg × {session.reps} {t('reps', language).toLowerCase()} = {formatNumber(volume)} {t('volume', language)}
                    </ThemedText>
                    {session.notes && (
                      <ThemedText style={styles.sessionNotes}>"{session.notes}"</ThemedText>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Delete Exercise Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: '#EF4444' }]}
          onPress={handleDeleteExercise}
        >
          <IconSymbol name="trash" size={18} color="#EF4444" />
          <ThemedText style={styles.deleteButtonText}>{t('deleteExercise', language)}</ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chart: {
    marginLeft: -16,
    borderRadius: 8,
  },
  sessionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sessionDetails: {
    fontSize: 14,
    opacity: 0.8,
  },
  sessionNotes: {
    fontSize: 13,
    opacity: 0.6,
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
