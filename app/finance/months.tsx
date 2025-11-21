import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useFinance } from '@/contexts/finance-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CurrencyInput, currencyToFloat } from '@/components/ui/currency-input';
import { FinanceMonth, FinanceEntry, getMonthName, translateCategory } from '@/types/finance';

type MonthWithSummary = FinanceMonth & {
  income: number;
  expenses: number;
  balance: number;
};

export default function MonthsScreen() {
  const {
    activeBankAccount,
    financeMonths,
    ensureMonth,
    getFinanceEntries,
    createFinanceEntry,
    deleteFinanceEntry,
    getMonthSummary,
    categories,
    refreshData,
  } = useFinance();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [monthsWithSummary, setMonthsWithSummary] = useState<MonthWithSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<FinanceMonth | null>(null);
  const [monthEntries, setMonthEntries] = useState<FinanceEntry[]>([]);
  const [showMonthDetail, setShowMonthDetail] = useState(false);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddMonthModal, setShowAddMonthModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Add month form
  const [newMonthYear, setNewMonthYear] = useState(new Date().getFullYear());
  const [newMonthMonth, setNewMonthMonth] = useState(new Date().getMonth() + 1);

  // Entry form
  const [entryType, setEntryType] = useState<'income' | 'expense'>('expense');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryCategory, setEntryCategory] = useState('');
  const [entryTag, setEntryTag] = useState('');

  const translations = {
    en: {
      noAccount: 'Select an account first',
      noMonths: 'No months yet',
      startTracking: 'Start tracking your finances',
      createMonth: 'Create Current Month',
      income: 'Income',
      expenses: 'Expenses',
      balance: 'Balance',
      monthDetail: 'Month Detail',
      addEntry: 'Add Entry',
      newEntry: 'New Entry',
      type: 'Type',
      amount: 'Amount',
      category: 'Category',
      tag: 'Tag (optional)',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      noEntries: 'No entries yet',
      manual: 'Manual',
      card: 'Card',
      recurring: 'Recurring',
      addMonth: 'Add Month',
      selectMonth: 'Select Month',
      year: 'Year',
      month: 'Month',
      monthExists: 'Month already exists',
      add: 'Add',
    },
    pt: {
      noAccount: 'Selecione uma conta primeiro',
      noMonths: 'Nenhum mês ainda',
      startTracking: 'Comece a controlar suas finanças',
      createMonth: 'Criar Mês Atual',
      income: 'Receitas',
      expenses: 'Despesas',
      balance: 'Saldo',
      monthDetail: 'Detalhe do Mês',
      addEntry: 'Adicionar Lançamento',
      newEntry: 'Novo Lançamento',
      type: 'Tipo',
      amount: 'Valor',
      category: 'Categoria',
      tag: 'Tag (opcional)',
      cancel: 'Cancelar',
      save: 'Salvar',
      delete: 'Excluir',
      noEntries: 'Nenhum lançamento ainda',
      manual: 'Manual',
      card: 'Cartão',
      recurring: 'Recorrente',
      addMonth: 'Adicionar Mês',
      selectMonth: 'Selecionar Mês',
      year: 'Ano',
      month: 'Mês',
      monthExists: 'Mês já existe',
      add: 'Adicionar',
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

  const loadMonthsWithSummary = useCallback(async () => {
    const yearMonths = financeMonths.filter((m) => m.year === selectedYear);
    const withSummary: MonthWithSummary[] = [];

    for (const month of yearMonths) {
      const summary = await getMonthSummary(month.id);
      withSummary.push({ ...month, ...summary });
    }

    withSummary.sort((a, b) => b.month - a.month);
    setMonthsWithSummary(withSummary);
  }, [financeMonths, selectedYear, getMonthSummary]);

  useEffect(() => {
    loadMonthsWithSummary();
  }, [loadMonthsWithSummary]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadMonthsWithSummary();
    setRefreshing(false);
  };

  const handleCreateCurrentMonth = async () => {
    const now = new Date();
    try {
      await ensureMonth(now.getFullYear(), now.getMonth() + 1);
      await loadMonthsWithSummary();
    } catch (error) {
      console.error('Error creating month:', error);
    }
  };

  const monthExists = (year: number, month: number): boolean => {
    return financeMonths.some((m) => m.year === year && m.month === month);
  };

  const isMonthFuture = (year: number, month: number): boolean => {
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
  };

  const canAddMonth = (year: number, month: number): boolean => {
    return !monthExists(year, month) && !isMonthFuture(year, month);
  };

  const handleAddMonth = async () => {
    if (!canAddMonth(newMonthYear, newMonthMonth)) {
      return;
    }
    try {
      await ensureMonth(newMonthYear, newMonthMonth);
      await loadMonthsWithSummary();
      setShowAddMonthModal(false);
      setSelectedYear(newMonthYear);
    } catch (error) {
      console.error('Error creating month:', error);
    }
  };

  const openMonthDetail = async (month: FinanceMonth) => {
    setSelectedMonth(month);
    const entries = await getFinanceEntries(month.id);
    setMonthEntries(entries);
    setShowMonthDetail(true);
  };

  const handleAddEntry = async () => {
    const amount = currencyToFloat(entryAmount);
    if (!selectedMonth || amount <= 0 || !entryCategory) return;
    try {
      await createFinanceEntry(
        selectedMonth.id,
        entryType,
        entryCategory,
        amount,
        entryTag.trim() || undefined
      );
      const entries = await getFinanceEntries(selectedMonth.id);
      setMonthEntries(entries);
      setEntryAmount('');
      setEntryCategory('');
      setEntryTag('');
      setShowAddEntry(false);
      await loadMonthsWithSummary();
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedMonth) return;
    try {
      await deleteFinanceEntry(entryId);
      const entries = await getFinanceEntries(selectedMonth.id);
      setMonthEntries(entries);
      await loadMonthsWithSummary();
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const years = Array.from(
    new Set(financeMonths.map((m) => m.year))
  ).sort((a, b) => b - a);

  if (!years.includes(selectedYear) && years.length > 0) {
    years.push(selectedYear);
    years.sort((a, b) => b - a);
  }

  const currentYear = new Date().getFullYear();
  if (!years.includes(currentYear)) {
    years.unshift(currentYear);
  }

  const incomeEntries = monthEntries.filter((e) => e.type === 'income');
  const expenseEntries = monthEntries.filter((e) => e.type === 'expense');
  const categoryList = entryType === 'income' ? categories.incomeCategories : categories.expenseCategories;

  if (!activeBankAccount) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyState}>
          <IconSymbol name="building.columns" size={48} color={isDark ? '#666' : '#999'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t.noAccount}
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Year Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.yearSelector}
        contentContainerStyle={styles.yearSelectorContent}
      >
        {years.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearChip,
              {
                backgroundColor: selectedYear === year ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                borderColor: selectedYear === year ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
              },
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Text
              style={[
                styles.yearChipText,
                { color: selectedYear === year ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
              ]}
            >
              {year}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {monthsWithSummary.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.noMonths}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#999' : '#666' }]}>
              {t.startTracking}
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateCurrentMonth}>
              <Text style={styles.createButtonText}>{t.createMonth}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          monthsWithSummary.map((month) => (
            <TouchableOpacity
              key={month.id}
              style={[
                styles.monthCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
              onPress={() => openMonthDetail(month)}
            >
              <View style={styles.monthHeader}>
                <Text style={[styles.monthName, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {getMonthName(month.month, settings.language)} {month.year}
                </Text>
                <IconSymbol name="chevron.right" size={20} color={isDark ? '#666' : '#999'} />
              </View>

              <View style={styles.monthSummary}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t.income}
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                    {formatCurrency(month.income)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t.expenses}
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                    {formatCurrency(month.expenses)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t.balance}
                  </Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      { color: month.balance >= 0 ? '#10B981' : '#EF4444' },
                    ]}
                  >
                    {formatCurrency(month.balance)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Floating Add Month Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddMonthModal(true)}>
        <IconSymbol name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Month Detail Modal */}
      <Modal
        visible={showMonthDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContentFull,
              { backgroundColor: isDark ? '#151718' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {selectedMonth && `${getMonthName(selectedMonth.month, settings.language)} ${selectedMonth.year}`}
              </Text>
              <TouchableOpacity onPress={() => setShowMonthDetail(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Income Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: '#10B981' }]}>
                    {t.income}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEntryType('income');
                      setShowAddEntry(true);
                    }}
                  >
                    <IconSymbol name="plus.circle.fill" size={24} color="#10B981" />
                  </TouchableOpacity>
                </View>
                {incomeEntries.length === 0 ? (
                  <Text style={[styles.noEntries, { color: isDark ? '#666' : '#999' }]}>
                    {t.noEntries}
                  </Text>
                ) : (
                  incomeEntries.map((entry) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.entryItem,
                        {
                          backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                          borderColor: isDark ? '#333' : '#E0E0E0',
                        },
                      ]}
                    >
                      <View style={styles.entryInfo}>
                        <Text style={[styles.entryCategory, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                          {translateCategory(entry.category, settings.language)}
                        </Text>
                        {entry.tag && (
                          <Text style={[styles.entryTag, { color: isDark ? '#666' : '#999' }]}>
                            #{entry.tag}
                          </Text>
                        )}
                        <Text style={[styles.entrySource, { color: isDark ? '#666' : '#999' }]}>
                          {entry.source === 'manual' ? t.manual : entry.source === 'card' ? t.card : t.recurring}
                        </Text>
                      </View>
                      <View style={styles.entryRight}>
                        <Text style={[styles.entryAmount, { color: '#10B981' }]}>
                          {formatCurrency(entry.amount)}
                        </Text>
                        {entry.source === 'manual' && (
                          <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                            <IconSymbol name="trash" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* Expense Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: '#EF4444' }]}>
                    {t.expenses}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEntryType('expense');
                      setShowAddEntry(true);
                    }}
                  >
                    <IconSymbol name="plus.circle.fill" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
                {expenseEntries.length === 0 ? (
                  <Text style={[styles.noEntries, { color: isDark ? '#666' : '#999' }]}>
                    {t.noEntries}
                  </Text>
                ) : (
                  expenseEntries.map((entry) => (
                    <View
                      key={entry.id}
                      style={[
                        styles.entryItem,
                        {
                          backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                          borderColor: isDark ? '#333' : '#E0E0E0',
                        },
                      ]}
                    >
                      <View style={styles.entryInfo}>
                        <Text style={[styles.entryCategory, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                          {translateCategory(entry.category, settings.language)}
                        </Text>
                        {entry.tag && (
                          <Text style={[styles.entryTag, { color: isDark ? '#666' : '#999' }]}>
                            #{entry.tag}
                          </Text>
                        )}
                        <Text style={[styles.entrySource, { color: isDark ? '#666' : '#999' }]}>
                          {entry.source === 'manual' ? t.manual : entry.source === 'card' ? t.card : t.recurring}
                        </Text>
                      </View>
                      <View style={styles.entryRight}>
                        <Text style={[styles.entryAmount, { color: '#EF4444' }]}>
                          {formatCurrency(entry.amount)}
                        </Text>
                        {entry.source === 'manual' && (
                          <TouchableOpacity onPress={() => handleDeleteEntry(entry.id)}>
                            <IconSymbol name="trash" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Entry Modal */}
      <Modal
        visible={showAddEntry}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddEntry(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.newEntry}
              </Text>
              <TouchableOpacity onPress={() => setShowAddEntry(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.type}
              </Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: entryType === 'income' ? '#10B981' : isDark ? '#333' : '#F5F5F5',
                      borderColor: entryType === 'income' ? '#10B981' : isDark ? '#444' : '#E0E0E0',
                    },
                  ]}
                  onPress={() => {
                    setEntryType('income');
                    setEntryCategory('');
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: entryType === 'income' ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                    ]}
                  >
                    {t.income}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: entryType === 'expense' ? '#EF4444' : isDark ? '#333' : '#F5F5F5',
                      borderColor: entryType === 'expense' ? '#EF4444' : isDark ? '#444' : '#E0E0E0',
                    },
                  ]}
                  onPress={() => {
                    setEntryType('expense');
                    setEntryCategory('');
                  }}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      { color: entryType === 'expense' ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                    ]}
                  >
                    {t.expenses}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.amount}
              </Text>
              <View
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#333' : '#F5F5F5',
                    borderColor: isDark ? '#444' : '#E0E0E0',
                  },
                ]}
              >
                <CurrencyInput
                  value={entryAmount}
                  onChangeValue={setEntryAmount}
                  currency={settings.currency}
                  textColor={isDark ? '#ECEDEE' : '#11181C'}
                  prefixColor={isDark ? '#999' : '#666'}
                />
              </View>

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.category}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                {categoryList.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: entryCategory === cat ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                        borderColor: entryCategory === cat ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setEntryCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: entryCategory === cat ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                      ]}
                    >
                      {translateCategory(cat, settings.language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.tag}
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
                value={entryTag}
                onChangeText={setEntryTag}
                placeholder={t.tag}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                  onPress={() => setShowAddEntry(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { opacity: currencyToFloat(entryAmount) > 0 && entryCategory ? 1 : 0.5 },
                  ]}
                  onPress={handleAddEntry}
                  disabled={currencyToFloat(entryAmount) <= 0 || !entryCategory}
                >
                  <Text style={styles.submitButtonText}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Month Modal */}
      <Modal
        visible={showAddMonthModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMonthModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.addMonth}
              </Text>
              <TouchableOpacity onPress={() => setShowAddMonthModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.year}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 4 + i).map(
                  (year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            newMonthYear === year ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                          borderColor:
                            newMonthYear === year ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
                        },
                      ]}
                      onPress={() => setNewMonthYear(year)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color:
                              newMonthYear === year ? '#fff' : isDark ? '#ECEDEE' : '#11181C',
                          },
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.month}
              </Text>
              <View style={styles.monthGrid}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const exists = monthExists(newMonthYear, month);
                  const now = new Date();
                  const isFuture =
                    newMonthYear > now.getFullYear() ||
                    (newMonthYear === now.getFullYear() && month > now.getMonth() + 1);
                  const isDisabled = exists || isFuture;
                  return (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.monthChip,
                        {
                          backgroundColor:
                            newMonthMonth === month && !isDisabled
                              ? '#007AFF'
                              : isDisabled
                              ? isDark
                                ? '#222'
                                : '#E8E8E8'
                              : isDark
                              ? '#333'
                              : '#F5F5F5',
                          borderColor:
                            newMonthMonth === month && !isDisabled
                              ? '#007AFF'
                              : isDisabled
                              ? isDark
                                ? '#333'
                                : '#CCC'
                              : isDark
                              ? '#444'
                              : '#E0E0E0',
                          opacity: isDisabled ? 0.5 : 1,
                        },
                      ]}
                      onPress={() => !isDisabled && setNewMonthMonth(month)}
                      disabled={isDisabled}
                    >
                      <Text
                        style={[
                          styles.monthChipText,
                          {
                            color:
                              newMonthMonth === month && !isDisabled
                                ? '#fff'
                                : isDisabled
                                ? isDark
                                  ? '#666'
                                  : '#999'
                                : isDark
                                ? '#ECEDEE'
                                : '#11181C',
                          },
                        ]}
                      >
                        {getMonthName(month, settings.language).substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                  onPress={() => setShowAddMonthModal(false)}
                >
                  <Text
                    style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}
                  >
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    {
                      opacity: canAddMonth(newMonthYear, newMonthMonth) ? 1 : 0.5,
                    },
                  ]}
                  onPress={handleAddMonth}
                  disabled={!canAddMonth(newMonthYear, newMonthMonth)}
                >
                  <Text style={styles.submitButtonText}>{t.add}</Text>
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
  yearSelector: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  yearSelectorContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
  },
  yearChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  yearChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 80,
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
  monthCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthName: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthSummary: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    gap: 2,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    maxHeight: '85%',
  },
  modalContentFull: {
    flex: 1,
    marginTop: 50,
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
    fontSize: 18,
    fontWeight: '600',
  },
  modalScroll: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  noEntries: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
    gap: 2,
  },
  entryCategory: {
    fontSize: 15,
    fontWeight: '500',
  },
  entryTag: {
    fontSize: 12,
  },
  entrySource: {
    fontSize: 11,
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryAmount: {
    fontSize: 15,
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
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  categoryList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  monthChip: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  monthChipText: {
    fontSize: 13,
    fontWeight: '500',
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
