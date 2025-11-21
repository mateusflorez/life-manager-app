import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useInvestment } from '@/contexts/investment-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CurrencyInput, currencyToFloat, floatToCurrency } from '@/components/ui/currency-input';
import {
  t,
  formatDate,
  formatPercentChange,
  InvestmentWithTotal,
} from '@/types/investment';

const screenWidth = Dimensions.get('window').width;

export default function InvestmentsOverviewScreen() {
  const router = useRouter();
  const {
    investments,
    portfolioTotal,
    monthlyChange,
    chartData,
    createInvestment,
    loading,
    refreshData,
  } = useInvestment();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInitialValue, setNewInitialValue] = useState('0');
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const lang = settings.language;

  const formatCurrency = (value: number) => {
    const locale = settings.currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: settings.currency,
    }).format(value);
  };

  const formatShortCurrency = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleCreateInvestment = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const initialValueFloat = currencyToFloat(newInitialValue);
      await createInvestment(
        newName.trim(),
        newDesc.trim() || undefined,
        initialValueFloat > 0 ? initialValueFloat : undefined
      );
      setNewName('');
      setNewDesc('');
      setNewInitialValue('0');
      setShowNewModal(false);
    } catch (error) {
      console.error('Error creating investment:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleInvestmentPress = (investment: InvestmentWithTotal) => {
    router.push(`/investments/${investment.id}`);
  };

  // Prepare line chart data - show only every 3rd label to avoid overlap
  const shortenedLabels = chartData.labels.map((label, index) => {
    // Show label only for every 3rd month (index 0, 3, 6, 9, 11)
    if (index % 3 === 0 || index === chartData.labels.length - 1) {
      // Shorten "Jan 2025" to "Jan" or "Jan'25" for first month of year
      const parts = label.split(' ');
      if (parts.length === 2) {
        const month = parts[0].substring(0, 3);
        const year = parts[1].substring(2); // "25" from "2025"
        // Show year only for January or first/last label
        if (month.toLowerCase().startsWith('jan') || index === 0 || index === chartData.labels.length - 1) {
          return `${month}'${year}`;
        }
        return month;
      }
      return label.substring(0, 3);
    }
    return '';
  });

  const lineChartData = {
    labels: shortenedLabels.length > 0 ? shortenedLabels : [''],
    datasets:
      chartData.datasets.length > 0
        ? chartData.datasets.map((ds) => ({
            data: ds.data.length > 0 ? ds.data : [0],
            color: () => ds.color,
            strokeWidth: 2,
          }))
        : [{ data: [0], color: () => '#36A2EB', strokeWidth: 2 }],
  };

  const chartConfig = {
    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
    backgroundGradientFrom: isDark ? '#1A1A1A' : '#F9F9F9',
    backgroundGradientTo: isDark ? '#1A1A1A' : '#F9F9F9',
    decimalPlaces: 0,
    color: (opacity = 1) =>
      isDark ? `rgba(236, 237, 238, ${opacity})` : `rgba(17, 24, 28, ${opacity})`,
    labelColor: () => (isDark ? '#999' : '#666'),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    propsForLabels: {
      fontSize: 10,
    },
    formatYLabel: (value: string) => formatShortCurrency(parseFloat(value)),
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {investments.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              name="chart.line.uptrend.xyaxis"
              size={48}
              color={isDark ? '#666' : '#999'}
            />
            <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t('noInvestments', lang)}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#999' : '#666' }]}>
              {t('createFirstInvestment', lang)}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowNewModal(true)}
            >
              <Text style={styles.createButtonText}>{t('newInvestment', lang)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Portfolio Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                {t('totalPortfolio', lang)}
              </Text>
              <Text style={[styles.portfolioValue, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {formatCurrency(portfolioTotal)}
              </Text>
              {monthlyChange.amount !== 0 && (
                <View style={styles.changeRow}>
                  <Text
                    style={[
                      styles.changeAmount,
                      { color: monthlyChange.amount >= 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {monthlyChange.amount >= 0 ? '+' : ''}
                    {formatCurrency(monthlyChange.amount)}
                  </Text>
                  {monthlyChange.percentChange !== null && (
                    <Text
                      style={[
                        styles.changePercent,
                        { color: monthlyChange.percentChange >= 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      ({formatPercentChange(monthlyChange.percentChange)})
                    </Text>
                  )}
                  <Text style={[styles.changeLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t('thisMonth', lang)}
                  </Text>
                </View>
              )}
            </View>

            {/* Chart */}
            {chartData.datasets.length > 0 && chartData.datasets[0].data.some((d) => d > 0) && (
              <View
                style={[
                  styles.chartCard,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                  },
                ]}
              >
                <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {t('contributionTrend', lang)}
                </Text>

                <LineChart
                  data={lineChartData}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.lineChart}
                  withInnerLines={false}
                  withOuterLines={true}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  fromZero={true}
                />

                {/* Legend */}
                <View style={styles.legendContainer}>
                  {chartData.datasets.map((ds, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: ds.color }]} />
                      <Text style={[styles.legendText, { color: isDark ? '#999' : '#666' }]}>
                        {ds.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Investment Cards */}
            <View style={styles.investmentsSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {t('investments', lang)}
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowNewModal(true)}
                >
                  <IconSymbol name="plus" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>

              {investments.map((investment) => (
                <TouchableOpacity
                  key={investment.id}
                  style={[
                    styles.investmentCard,
                    {
                      backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                      borderColor: isDark ? '#333' : '#E0E0E0',
                      borderLeftColor: investment.color || '#36A2EB',
                    },
                  ]}
                  onPress={() => handleInvestmentPress(investment)}
                >
                  <View style={styles.investmentHeader}>
                    <Text
                      style={[styles.investmentName, { color: isDark ? '#ECEDEE' : '#11181C' }]}
                    >
                      {investment.name}
                    </Text>
                    <IconSymbol name="chevron.right" size={16} color={isDark ? '#666' : '#999'} />
                  </View>

                  <Text style={[styles.investmentTotal, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                    {formatCurrency(investment.total)}
                  </Text>

                  {investment.lastMovement && (
                    <View style={styles.lastMovementRow}>
                      <Text style={[styles.lastMovementLabel, { color: isDark ? '#999' : '#666' }]}>
                        {t('lastContribution', lang)}:
                      </Text>
                      <Text
                        style={[
                          styles.lastMovementAmount,
                          {
                            color:
                              investment.lastMovement.amount >= 0 ? '#10B981' : '#EF4444',
                          },
                        ]}
                      >
                        {investment.lastMovement.amount >= 0 ? '+' : ''}
                        {formatCurrency(investment.lastMovement.amount)}
                      </Text>
                      {investment.lastMovement.percentChange !== null && (
                        <Text
                          style={[
                            styles.lastMovementPercent,
                            {
                              color:
                                investment.lastMovement.percentChange >= 0
                                  ? '#10B981'
                                  : '#EF4444',
                            },
                          ]}
                        >
                          ({formatPercentChange(investment.lastMovement.percentChange)})
                        </Text>
                      )}
                    </View>
                  )}

                  {investment.lastMovement && (
                    <Text style={[styles.lastMovementDate, { color: isDark ? '#666' : '#999' }]}>
                      {t('on', lang)} {formatDate(investment.lastMovement.date, lang)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* New Investment Modal */}
      <Modal
        visible={showNewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[styles.modalContent, { backgroundColor: isDark ? '#1A1A1A' : '#fff' }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t('newInvestment', lang)}
              </Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t('investmentName', lang)}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#333' : '#F5F5F5',
                    color: isDark ? '#ECEDEE' : '#11181C',
                    borderColor: isDark ? '#444' : '#E0E0E0',
                  },
                ]}
                value={newName}
                onChangeText={setNewName}
                placeholder={t('investmentName', lang)}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t('description', lang)}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#333' : '#F5F5F5',
                    color: isDark ? '#ECEDEE' : '#11181C',
                    borderColor: isDark ? '#444' : '#E0E0E0',
                  },
                ]}
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder={t('description', lang)}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t('initialValue', lang)}
              </Text>
              <CurrencyInput
                value={newInitialValue}
                onChangeValue={setNewInitialValue}
                currency={settings.currency}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#333' : '#F5F5F5',
                    color: isDark ? '#ECEDEE' : '#11181C',
                    borderColor: isDark ? '#444' : '#E0E0E0',
                  },
                ]}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                  onPress={() => setShowNewModal(false)}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}
                  >
                    {t('cancel', lang)}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { opacity: newName.trim() && !creating ? 1 : 0.5 },
                  ]}
                  onPress={handleCreateInvestment}
                  disabled={!newName.trim() || creating}
                >
                  <Text style={styles.submitButtonText}>
                    {creating ? t('saving', lang) : t('create', lang)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  portfolioValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  changeAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  changePercent: {
    fontSize: 14,
  },
  changeLabel: {
    fontSize: 14,
  },
  chartCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  lineChart: {
    borderRadius: 8,
    marginTop: 8,
  },
  legendContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    flexShrink: 1,
  },
  investmentsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
  },
  investmentCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    padding: 16,
    gap: 8,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  investmentName: {
    fontSize: 16,
    fontWeight: '600',
  },
  investmentTotal: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  lastMovementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lastMovementLabel: {
    fontSize: 13,
  },
  lastMovementAmount: {
    fontSize: 13,
    fontWeight: '600',
  },
  lastMovementPercent: {
    fontSize: 13,
  },
  lastMovementDate: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  form: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
