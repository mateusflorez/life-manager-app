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
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useInvestment } from '@/contexts/investment-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
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
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) =>
      isDark ? `rgba(236, 237, 238, ${opacity})` : `rgba(17, 24, 28, ${opacity})`,
    labelColor: () => (isDark ? '#808080' : '#6B7280'),
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {investments.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <IconSymbol name="chart.line.uptrend.xyaxis" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('noInvestments', lang)}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('createFirstInvestment', lang)}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowNewModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.createButtonText}>{t('newInvestment', lang)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Portfolio Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconContainer}
                >
                  <IconSymbol name="chart.pie.fill" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('totalPortfolio', lang)}
                </Text>
              </View>

              <Text style={[styles.portfolioValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
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
                  <Text style={[styles.changeLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
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
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardIconContainer}
                  >
                    <IconSymbol name="chart.line.uptrend.xyaxis" size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t('contributionTrend', lang)}
                  </Text>
                </View>

                <LineChart
                  data={lineChartData}
                  width={screenWidth - 72}
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
                      <Text style={[styles.legendText, { color: isDark ? '#808080' : '#6B7280' }]}>
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
                <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('investments', lang)}
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowNewModal(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.addButtonGradient}
                  >
                    <IconSymbol name="plus" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {investments.map((investment) => (
                <TouchableOpacity
                  key={investment.id}
                  style={[
                    styles.investmentCard,
                    {
                      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                  onPress={() => handleInvestmentPress(investment)}
                  activeOpacity={0.8}
                >
                  <View style={styles.investmentHeader}>
                    <View style={styles.investmentNameRow}>
                      <View
                        style={[
                          styles.investmentColorDot,
                          { backgroundColor: investment.color || '#6366F1' },
                        ]}
                      />
                      <Text
                        style={[styles.investmentName, { color: isDark ? '#FFFFFF' : '#111827' }]}
                      >
                        {investment.name}
                      </Text>
                    </View>
                    <IconSymbol name="chevron.right" size={16} color={isDark ? '#808080' : '#6B7280'} />
                  </View>

                  <Text style={[styles.investmentTotal, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {formatCurrency(investment.total)}
                  </Text>

                  {investment.lastMovement && (
                    <View style={styles.lastMovementRow}>
                      <Text style={[styles.lastMovementLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
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
                    <Text style={[styles.lastMovementDate, { color: isDark ? '#666' : '#9CA3AF' }]}>
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
            style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('newInvestment', lang)}
              </Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#808080' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t('investmentName', lang)}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    color: isDark ? '#FFFFFF' : '#111827',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                value={newName}
                onChangeText={setNewName}
                placeholder={t('investmentName', lang)}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t('description', lang)}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    color: isDark ? '#FFFFFF' : '#111827',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder={t('description', lang)}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t('initialValue', lang)}
              </Text>
              <CurrencyInput
                value={newInitialValue}
                onChangeValue={setNewInitialValue}
                currency={settings.currency}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    color: isDark ? '#FFFFFF' : '#111827',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                  ]}
                  onPress={() => setShowNewModal(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}
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
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitButtonGradient}
                  >
                    <Text style={styles.submitButtonText}>
                      {creating ? t('saving', lang) : t('create', lang)}
                    </Text>
                  </LinearGradient>
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
    paddingTop: 20,
    gap: 16,
    paddingBottom: 40,
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
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
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
    paddingHorizontal: 20,
  },
  createButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  portfolioValue: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  changeAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  changePercent: {
    fontSize: 15,
    fontWeight: '500',
  },
  changeLabel: {
    fontSize: 14,
  },
  chartCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  lineChart: {
    borderRadius: 16,
    marginTop: 8,
  },
  legendContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  investmentsSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  investmentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  investmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  investmentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  investmentColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  investmentName: {
    fontSize: 17,
    fontWeight: '600',
  },
  investmentTotal: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  lastMovementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lastMovementLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  lastMovementAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  lastMovementPercent: {
    fontSize: 13,
    fontWeight: '500',
  },
  lastMovementDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontSize: 20,
    fontWeight: '700',
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
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
