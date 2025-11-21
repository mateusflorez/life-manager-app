import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useMood } from '@/contexts/mood-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatShortDate, getMoodFace, CHART_DAYS } from '@/types/mood';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function MoodScreen() {
  const { entries, loading, getRecentEntries, getChartData, getAverageMood, streak } = useMood();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const translations = {
    en: {
      infoTitle: 'Mood tracker',
      infoBody: 'Follow the last 60 days and jot optional notes to remember how each day felt.',
      chartTitle: 'Mood trend (last 60 days)',
      noEntries: 'No mood entries yet. Start tracking!',
      logMood: "Log today's mood",
      recentEntries: 'Recent entries',
      viewAll: 'View all',
      noRecentEntries: 'No entries yet.',
      note: 'Note',
    },
    pt: {
      infoTitle: 'Rastreador de humor',
      infoBody: 'Acompanhe os últimos 60 dias e escreva notas opcionais para lembrar como cada dia foi.',
      chartTitle: 'Humor (últimos 60 dias)',
      noEntries: 'Nenhum registro ainda. Comece a rastrear!',
      logMood: 'Registrar humor de hoje',
      recentEntries: 'Últimos registros',
      viewAll: 'Ver tudo',
      noRecentEntries: 'Nenhum registro ainda.',
      note: 'Nota',
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

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FACC15" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Info Card */}
        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F0F9FF',
              borderColor: isDark ? '#333' : '#BAE6FD',
            },
          ]}
        >
          <Text style={[styles.infoTitle, { color: isDark ? '#ECEDEE' : '#0369A1' }]}>
            {t.infoTitle}
          </Text>
          <Text style={[styles.infoBody, { color: isDark ? '#999' : '#0C4A6E' }]}>
            {t.infoBody}
          </Text>
        </View>

        {/* Chart Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t.chartTitle}
          </Text>
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
                width={screenWidth - 64}
                height={200}
                yAxisSuffix=""
                yAxisInterval={1}
                fromZero={false}
                segments={4}
                chartConfig={{
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  backgroundGradientFrom: isDark ? '#1A1A1A' : '#F9F9F9',
                  backgroundGradientTo: isDark ? '#1A1A1A' : '#F9F9F9',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(250, 204, 21, ${opacity})`,
                  labelColor: () => (isDark ? '#999' : '#666'),
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
              {t.noEntries}
            </Text>
          )}
        </View>

        {/* Log Mood Button */}
        <TouchableOpacity
          style={styles.logButton}
          onPress={() => router.push('/mood/log')}
          activeOpacity={0.8}
        >
          <Text style={styles.logButtonText}>{t.logMood}</Text>
        </TouchableOpacity>

        {/* Recent Entries Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.recentEntries}
            </Text>
            {entries.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/mood/history')}>
                <Text style={styles.viewAllText}>{t.viewAll}</Text>
              </TouchableOpacity>
            )}
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
                      backgroundColor: isDark ? '#252525' : '#fff',
                      borderColor: isDark ? '#333' : '#E0E0E0',
                    },
                  ]}
                >
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryDate, { color: isDark ? '#999' : '#666' }]}>
                      {formatShortDate(entry.date, settings.language)}
                    </Text>
                    <Text style={styles.entryMood}>
                      {getMoodFace(entry.mood)} {entry.mood}/5
                    </Text>
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
  content: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FACC15',
    fontWeight: '500',
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
  logButton: {
    backgroundColor: '#FACC15',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  entryCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
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
  entryMood: {
    fontSize: 12,
    fontWeight: '600',
  },
  entryNote: {
    fontSize: 12,
    lineHeight: 16,
  },
});
