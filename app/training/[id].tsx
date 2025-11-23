import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
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
import { t, formatDate, calculateVolume } from '@/types/training';
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
  const { showConfirm } = useAlert();

  const { getExerciseById, deleteExercise, deleteSession, isLoading } = useTraining();
  const exercise = getExerciseById(id ?? '');

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
            data: chartSessions.map((s) => calculateVolume(s.load, s.reps)),
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
              const volume = calculateVolume(session.load, session.reps);
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionRow,
                    {
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      borderBottomWidth: index < exercise.sessions.length - 1 ? 1 : 0,
                    },
                  ]}
                  onLongPress={() => handleDeleteSession(session.id)}
                  activeOpacity={0.7}
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
                    <Text style={[styles.sessionDetails, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {session.load}kg × {session.reps} {t('reps', language).toLowerCase()}
                    </Text>
                    {session.notes && (
                      <Text style={[styles.sessionNotes, { color: isDark ? '#666' : '#9CA3AF' }]}>
                        "{session.notes}"
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
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
    paddingVertical: 14,
  },
  sessionInfo: {
    flex: 1,
    gap: 4,
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
});
