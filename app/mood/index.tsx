import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useMood } from '@/contexts/mood-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatShortDate, getMoodFace } from '@/types/mood';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function MoodScreen() {
  const { entries, loading, getRecentEntries, getChartData, streak } = useMood();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const translations = {
    en: {
      chartTitle: 'Mood trend (last 60 days)',
      noEntries: 'No mood entries yet',
      noEntriesDesc: 'Start tracking how you feel each day!',
      logMood: "Log today's mood",
      recentEntries: 'Recent entries',
      viewAll: 'View all',
      noRecentEntries: 'No entries yet.',
      streak: 'Streak',
      days: 'days',
      avgMood: 'Avg mood',
    },
    pt: {
      chartTitle: 'Humor (últimos 60 dias)',
      noEntries: 'Nenhum registro ainda',
      noEntriesDesc: 'Comece a acompanhar como você se sente!',
      logMood: 'Registrar humor de hoje',
      recentEntries: 'Últimos registros',
      viewAll: 'Ver tudo',
      noRecentEntries: 'Nenhum registro ainda.',
      streak: 'Sequência',
      days: 'dias',
      avgMood: 'Humor médio',
    },
  };

  const t = translations[settings.language];
  const recentEntries = getRecentEntries(6);
  const chartData = getChartData(settings.language);

  // Filter out null values and prepare chart data
  const hasChartData = chartData.values.some((v) => v !== null);
  const chartValues = chartData.values.map((v) => v ?? 0);

  // Show every 10th label to avoid crowding
  const chartLabels = chartData.labels.map((label, index) => {
    if (index === 0 || index === chartData.labels.length - 1 || index % 10 === 0) {
      return label;
    }
    return '';
  });

  // Calculate average mood
  const avgMood = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
    : '0';

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#FACC15', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#000000" />
          </LinearGradient>
        </View>
      </ThemedView>
    );
  }

  const hasEntries = entries.length > 0;

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!hasEntries ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#FACC15', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <Text style={styles.emptyEmoji}>😊</Text>
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.noEntries}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.noEntriesDesc}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/mood/log')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FACC15', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                <IconSymbol name="plus" size={18} color="#000000" />
                <Text style={styles.createButtonText}>{t.logMood}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}
                >
                  <IconSymbol name="flame.fill" size={16} color="#000000" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {streak}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.streak}
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}
                >
                  <Text style={styles.statEmoji}>😊</Text>
                </LinearGradient>
                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {avgMood}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.avgMood}
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}
                >
                  <IconSymbol name="list.bullet" size={16} color="#000000" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {entries.length}
                </Text>
                <Text style={[styles.statLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  Total
                </Text>
              </View>
            </View>

            {/* Chart Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIcon}
                >
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={14} color="#000000" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.chartTitle}
                </Text>
              </View>

              {hasChartData ? (
                <View style={styles.chartContainer}>
                  <LineChart
                    data={{
                      labels: chartLabels,
                      datasets: [
                        {
                          data: chartValues.length > 0 ? chartValues : [0],
                          strokeWidth: 2,
                        },
                      ],
                    }}
                    width={screenWidth - 72}
                    height={180}
                    yAxisSuffix=""
                    yAxisInterval={1}
                    fromZero={false}
                    segments={4}
                    chartConfig={{
                      backgroundColor: 'transparent',
                      backgroundGradientFrom: isDark ? 'rgba(30, 30, 30, 0)' : 'rgba(255, 255, 255, 0)',
                      backgroundGradientTo: isDark ? 'rgba(30, 30, 30, 0)' : 'rgba(255, 255, 255, 0)',
                      decimalPlaces: 1,
                      color: (opacity = 1) => `rgba(250, 204, 21, ${opacity})`,
                      labelColor: () => (isDark ? '#808080' : '#6B7280'),
                      style: {
                        borderRadius: 8,
                      },
                      propsForDots: {
                        r: '3',
                        strokeWidth: '1',
                        stroke: '#FACC15',
                      },
                      propsForLabels: {
                        fontSize: 10,
                      },
                    }}
                    style={styles.chart}
                    bezier
                    withInnerLines={false}
                    withOuterLines={true}
                    formatYLabel={(value) => {
                      const num = parseFloat(value);
                      if (num >= 1 && num <= 5) return Math.round(num).toString();
                      return '';
                    }}
                  />
                </View>
              ) : (
                <Text style={[styles.noDataText, { color: isDark ? '#666' : '#999' }]}>
                  {t.noRecentEntries}
                </Text>
              )}
            </View>

            {/* Recent Entries Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={['#FACC15', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardIcon}
                  >
                    <IconSymbol name="clock.fill" size={14} color="#000000" />
                  </LinearGradient>
                  <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t.recentEntries}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/mood/history')}>
                  <Text style={styles.viewAllText}>{t.viewAll}</Text>
                </TouchableOpacity>
              </View>

              {recentEntries.length === 0 ? (
                <Text style={[styles.noDataText, { color: isDark ? '#666' : '#999' }]}>
                  {t.noRecentEntries}
                </Text>
              ) : (
                <View style={styles.entriesGrid}>
                  {recentEntries.map((entry) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.entryCard,
                        {
                          backgroundColor: isDark ? 'rgba(40, 40, 40, 0.8)' : 'rgba(249, 250, 251, 0.8)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        },
                      ]}
                    >
                      <View style={styles.entryHeader}>
                        <Text style={[styles.entryDate, { color: isDark ? '#999' : '#666' }]}>
                          {formatShortDate(entry.date, settings.language)}
                        </Text>
                        <View style={styles.moodBadge}>
                          <Text style={styles.entryMoodEmoji}>{getMoodFace(entry.mood)}</Text>
                          <Text style={[styles.entryMoodScore, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            {entry.mood}/5
                          </Text>
                        </View>
                      </View>
                      {entry.note && (
                        <Text
                          style={[styles.entryNote, { color: isDark ? '#999' : '#666' }]}
                          numberOfLines={2}
                        >
                          {entry.note}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {hasEntries && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/mood/log')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FACC15', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <IconSymbol name="plus" size={24} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
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
  statEmoji: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  viewAllText: {
    fontSize: 14,
    color: '#FACC15',
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  chart: {
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  entriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  entryCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  entryMoodEmoji: {
    fontSize: 14,
  },
  entryMoodScore: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryNote: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    shadowColor: '#FACC15',
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
});
