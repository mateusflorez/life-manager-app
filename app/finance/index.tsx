import { useEffect, useState, useCallback } from 'react';
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
import { PieChart, LineChart } from 'react-native-chart-kit';
import { ThemedView } from '@/components/themed-view';
import { useFinance } from '@/contexts/finance-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { BankAccount, getMonthName, translateCategory } from '@/types/finance';

const screenWidth = Dimensions.get('window').width;

const CHART_COLORS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function FinanceOverviewScreen() {
  const {
    bankAccounts,
    activeBankAccount,
    setActiveBankAccount,
    createBankAccount,
    ensureMonth,
    getMonthSummary,
    getYearSummary,
    getFinanceEntries,
    loading,
    refreshData,
  } = useFinance();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountDesc, setNewAccountDesc] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [currentMonthSummary, setCurrentMonthSummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
  });
  const [yearSummary, setYearSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalBalance: 0,
    months: [] as Array<{
      month: number;
      income: number;
      expenses: number;
      balance: number;
    }>,
  });
  const [expensesByCategory, setExpensesByCategory] = useState<
    Array<{ name: string; amount: number; color: string; legendFontColor: string }>
  >([]);

  const translations = {
    en: {
      selectAccount: 'Select Account',
      noAccounts: 'No bank accounts yet',
      createFirst: 'Create your first account to start tracking finances',
      createAccount: 'Create Account',
      newAccount: 'New Account',
      accountName: 'Account name',
      description: 'Description (optional)',
      cancel: 'Cancel',
      create: 'Create',
      currentMonth: 'Current Month',
      income: 'Income',
      expenses: 'Expenses',
      balance: 'Balance',
      yearSummary: 'Year Summary',
      noData: 'No data yet',
      account: 'Account',
      expensesByCategory: 'Expenses by Category',
      yearlyTrend: 'Yearly Trend',
    },
    pt: {
      selectAccount: 'Selecionar Conta',
      noAccounts: 'Nenhuma conta bancária ainda',
      createFirst: 'Crie sua primeira conta para começar a controlar finanças',
      createAccount: 'Criar Conta',
      newAccount: 'Nova Conta',
      accountName: 'Nome da conta',
      description: 'Descrição (opcional)',
      cancel: 'Cancelar',
      create: 'Criar',
      currentMonth: 'Mês Atual',
      income: 'Receitas',
      expenses: 'Despesas',
      balance: 'Saldo',
      yearSummary: 'Resumo do Ano',
      noData: 'Sem dados ainda',
      account: 'Conta',
      expensesByCategory: 'Despesas por Categoria',
      yearlyTrend: 'Tendência Anual',
    },
  };

  const t = translations[settings.language];

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

  const loadSummaries = useCallback(async () => {
    if (!activeBankAccount) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    try {
      const { financeMonth } = await ensureMonth(year, month);
      const monthSum = await getMonthSummary(financeMonth.id);
      setCurrentMonthSummary(monthSum);

      const entries = await getFinanceEntries(financeMonth.id);
      const expenseEntries = entries.filter((e) => e.type === 'expense');

      const categoryTotals: Record<string, number> = {};
      expenseEntries.forEach((entry) => {
        categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.amount;
      });

      const pieData = Object.entries(categoryTotals)
        .map(([name, amount], index) => ({
          name,
          amount,
          color: CHART_COLORS[index % CHART_COLORS.length],
          legendFontColor: isDark ? '#ECEDEE' : '#11181C',
        }))
        .sort((a, b) => b.amount - a.amount);

      setExpensesByCategory(pieData);

      const yearSum = await getYearSummary(year);
      setYearSummary(yearSum);
    } catch (error) {
      console.error('Error loading summaries:', error);
    }
  }, [activeBankAccount, ensureMonth, getMonthSummary, getYearSummary, getFinanceEntries, isDark]);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadSummaries();
    setRefreshing(false);
  };

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;
    try {
      await createBankAccount(newAccountName.trim(), newAccountDesc.trim() || undefined);
      setNewAccountName('');
      setNewAccountDesc('');
      setShowNewAccountModal(false);
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const handleSelectAccount = async (account: BankAccount) => {
    await setActiveBankAccount(account);
    setShowAccountModal(false);
  };

  const now = new Date();
  const currentMonthName = getMonthName(now.getMonth() + 1, settings.language);
  const currentYear = now.getFullYear();

  const monthLabels = yearSummary.months.map((m) =>
    getMonthName(m.month, settings.language).substring(0, 3)
  );

  const lineChartData = {
    labels: monthLabels.length > 0 ? monthLabels : [''],
    datasets: [
      {
        data: yearSummary.months.length > 0 ? yearSummary.months.map((m) => m.income) : [0],
        color: () => '#10B981',
        strokeWidth: 2,
      },
      {
        data: yearSummary.months.length > 0 ? yearSummary.months.map((m) => m.expenses) : [0],
        color: () => '#EF4444',
        strokeWidth: 2,
      },
      {
        data: yearSummary.months.length > 0 ? yearSummary.months.map((m) => m.balance) : [0],
        color: () => '#3B82F6',
        strokeWidth: 2,
      },
    ],
    legend: [t.income, t.expenses, t.balance],
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: 'transparent',
    backgroundGradientTo: 'transparent',
    decimalPlaces: 0,
    color: (opacity = 1) => (isDark ? `rgba(236, 237, 238, ${opacity})` : `rgba(17, 24, 28, ${opacity})`),
    labelColor: () => (isDark ? '#808080' : '#6B7280'),
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
    },
    formatYLabel: (value: string) => formatShortCurrency(parseFloat(value)),
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#10B981', '#059669']}
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
        {/* Account Selector */}
        <TouchableOpacity
          style={[
            styles.accountSelector,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
          onPress={() => setShowAccountModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.accountIconContainer}
          >
            <IconSymbol name="building.columns" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.account}
            </Text>
            <Text style={[styles.accountName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {activeBankAccount?.name || t.selectAccount}
            </Text>
          </View>
          <IconSymbol name="chevron.down" size={20} color={isDark ? '#808080' : '#6B7280'} />
        </TouchableOpacity>

        {!activeBankAccount ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <IconSymbol name="building.columns" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.noAccounts}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.createFirst}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowNewAccountModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.createButtonText}>{t.createAccount}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Current Month Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
                  <IconSymbol name="calendar" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.currentMonth} - {currentMonthName} {currentYear}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {t.income}
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                    {formatCurrency(currentMonthSummary.income)}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {t.expenses}
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                    {formatCurrency(currentMonthSummary.expenses)}
                  </Text>
                </View>
              </View>

              <View style={[styles.balanceContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.balance}
                </Text>
                <Text
                  style={[
                    styles.balanceValue,
                    {
                      color: currentMonthSummary.balance >= 0 ? '#10B981' : '#EF4444',
                    },
                  ]}
                >
                  {formatCurrency(currentMonthSummary.balance)}
                </Text>
              </View>
            </View>

            {/* Expenses by Category - Pie Chart */}
            <View
              style={[
                styles.chartCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconContainer}
                >
                  <IconSymbol name="chart.pie.fill" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.expensesByCategory}
                </Text>
              </View>

              {expensesByCategory.length === 0 ? (
                <Text style={[styles.noData, { color: isDark ? '#666' : '#9CA3AF' }]}>
                  {t.noData}
                </Text>
              ) : (
                <>
                  <View style={styles.pieChartContainer}>
                    <PieChart
                      data={expensesByCategory.map((item) => ({
                        name: translateCategory(item.name, settings.language),
                        population: parseFloat(item.amount.toFixed(2)),
                        color: item.color,
                        legendFontColor: item.legendFontColor,
                        legendFontSize: 11,
                      }))}
                      width={200}
                      height={200}
                      chartConfig={chartConfig}
                      accessor="population"
                      backgroundColor="transparent"
                      paddingLeft="50"
                      hasLegend={false}
                    />
                  </View>
                  <View style={styles.pieLegendContainer}>
                    {expensesByCategory.map((item, index) => (
                      <View key={index} style={styles.pieLegendItem}>
                        <View style={[styles.pieLegendDot, { backgroundColor: item.color }]} />
                        <Text style={[styles.pieLegendText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                          {translateCategory(item.name, settings.language)}: {formatCurrency(item.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </View>

            {/* Yearly Trend - Line Chart */}
            <View
              style={[
                styles.chartCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
                  {t.yearlyTrend} {currentYear}
                </Text>
              </View>

              {yearSummary.months.length === 0 ? (
                <Text style={[styles.noData, { color: isDark ? '#666' : '#9CA3AF' }]}>
                  {t.noData}
                </Text>
              ) : (
                <LineChart
                  data={lineChartData}
                  width={screenWidth - 72}
                  height={220}
                  chartConfig={chartConfig}
                  bezier
                  style={styles.lineChart}
                  withInnerLines={false}
                  withOuterLines={true}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  fromZero={false}
                />
              )}

              {yearSummary.months.length > 0 && (
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[styles.legendText, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {t.income}
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                    <Text style={[styles.legendText, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {t.expenses}
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={[styles.legendText, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {t.balance}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Year Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={['#8B5CF6', '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIconContainer}
                >
                  <IconSymbol name="chart.bar.fill" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.yearSummary} {currentYear}
                </Text>
              </View>

              {yearSummary.months.length === 0 ? (
                <Text style={[styles.noData, { color: isDark ? '#666' : '#9CA3AF' }]}>
                  {t.noData}
                </Text>
              ) : (
                <>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                        {t.income}
                      </Text>
                      <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                        {formatCurrency(yearSummary.totalIncome)}
                      </Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                        {t.expenses}
                      </Text>
                      <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                        {formatCurrency(yearSummary.totalExpenses)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.balanceContainer, { borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[styles.summaryLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {t.balance}
                    </Text>
                    <Text
                      style={[
                        styles.balanceValue,
                        {
                          color: yearSummary.totalBalance >= 0 ? '#10B981' : '#EF4444',
                        },
                      ]}
                    >
                      {formatCurrency(yearSummary.totalBalance)}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Account Selection Modal */}
      <Modal
        visible={showAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.selectAccount}
              </Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#808080' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.accountList}>
              {bankAccounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  style={[
                    styles.accountItem,
                    {
                      backgroundColor:
                        activeBankAccount?.id === account.id
                          ? isDark
                            ? 'rgba(99, 102, 241, 0.15)'
                            : 'rgba(99, 102, 241, 0.1)'
                          : 'transparent',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  onPress={() => handleSelectAccount(account)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.accountAvatar}
                  >
                    <Text style={styles.accountAvatarText}>
                      {account.name.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.accountItemInfo}>
                    <Text
                      style={[styles.accountItemName, { color: isDark ? '#FFFFFF' : '#111827' }]}
                    >
                      {account.name}
                    </Text>
                    {account.description && (
                      <Text style={[styles.accountItemDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                        {account.description}
                      </Text>
                    )}
                  </View>
                  {activeBankAccount?.id === account.id && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color="#6366F1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.newAccountButton}
              onPress={() => {
                setShowAccountModal(false);
                setShowNewAccountModal(true);
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.newAccountButtonGradient}
              >
                <IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />
                <Text style={styles.newAccountButtonText}>{t.newAccount}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Account Modal */}
      <Modal
        visible={showNewAccountModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.newAccount}
              </Text>
              <TouchableOpacity onPress={() => setShowNewAccountModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#808080' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.accountName}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#FFFFFF' : '#111827',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                value={newAccountName}
                onChangeText={setNewAccountName}
                placeholder={t.accountName}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.description}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#FFFFFF' : '#111827',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                value={newAccountDesc}
                onChangeText={setNewAccountDesc}
                placeholder={t.description}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                  onPress={() => setShowNewAccountModal(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { opacity: newAccountName.trim() ? 1 : 0.5 },
                  ]}
                  onPress={handleCreateAccount}
                  disabled={!newAccountName.trim()}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitButtonGradient}
                  >
                    <Text style={styles.submitButtonText}>{t.create}</Text>
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
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accountIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 2,
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
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
    shadowColor: '#10B981',
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
    shadowColor: '#10B981',
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
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    gap: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  balanceContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  noData: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  lineChart: {
    borderRadius: 16,
    marginTop: 8,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieLegendContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  pieLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pieLegendText: {
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
  accountList: {
    maxHeight: 300,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  accountItemInfo: {
    flex: 1,
    gap: 2,
  },
  accountItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountItemDesc: {
    fontSize: 13,
  },
  newAccountButton: {
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  newAccountButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  newAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
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
