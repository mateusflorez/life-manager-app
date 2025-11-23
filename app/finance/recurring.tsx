import { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { useFinance } from '@/contexts/finance-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { CurrencyInput, currencyToFloat } from '@/components/ui/currency-input';
import { getNextMonthKey, getMonthOptions, formatMonthKey, translateCategory } from '@/types/finance';

export default function RecurringScreen() {
  const {
    activeBankAccount,
    recurringExpenses,
    createRecurringExpense,
    toggleRecurringExpense,
    deleteRecurringExpense,
    categories,
    refreshData,
  } = useFinance();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showNewModal, setShowNewModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [startMonth, setStartMonth] = useState(getNextMonthKey());
  const [endMonth, setEndMonth] = useState<string | null>(null);
  const [note, setNote] = useState('');

  // Month options for selector
  const monthOptions = getMonthOptions(6);

  const translations = {
    en: {
      noAccount: 'Select an account first',
      noExpenses: 'No recurring expenses yet',
      addFirst: 'Add recurring expenses to auto-track monthly bills',
      addExpense: 'Add Expense',
      newExpense: 'New Recurring Expense',
      title: 'Title',
      amount: 'Amount',
      category: 'Category',
      startMonth: 'Start month',
      endMonth: 'End month (optional)',
      noEndMonth: 'Indefinite',
      note: 'Note (optional)',
      cancel: 'Cancel',
      save: 'Save',
      active: 'Active',
      paused: 'Paused',
      pause: 'Pause',
      resume: 'Resume',
      delete: 'Delete',
      perMonth: '/month',
      since: 'Since',
      until: 'Until',
      totalActive: 'Total active',
    },
    pt: {
      noAccount: 'Selecione uma conta primeiro',
      noExpenses: 'Nenhuma despesa recorrente ainda',
      addFirst: 'Adicione despesas recorrentes para acompanhar contas mensais',
      addExpense: 'Adicionar Despesa',
      newExpense: 'Nova Despesa Recorrente',
      title: 'Título',
      amount: 'Valor',
      category: 'Categoria',
      startMonth: 'Mês inicial',
      endMonth: 'Mês final (opcional)',
      noEndMonth: 'Indefinido',
      note: 'Nota (opcional)',
      cancel: 'Cancelar',
      save: 'Salvar',
      active: 'Ativa',
      paused: 'Pausada',
      pause: 'Pausar',
      resume: 'Retomar',
      delete: 'Excluir',
      perMonth: '/mês',
      since: 'Desde',
      until: 'Até',
      totalActive: 'Total ativo',
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

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    const amountValue = currencyToFloat(amount);
    if (!title.trim() || amountValue <= 0 || !category) return;
    try {
      await createRecurringExpense(
        title.trim(),
        category,
        amountValue,
        startMonth,
        note.trim() || undefined,
        endMonth || undefined
      );
      setTitle('');
      setAmount('');
      setCategory('');
      setNote('');
      setEndMonth(null);
      setShowNewModal(false);
    } catch (error) {
      console.error('Error creating recurring expense:', error);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleRecurringExpense(id);
    } catch (error) {
      console.error('Error toggling expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecurringExpense(id);
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const activeExpenses = recurringExpenses.filter((e) => e.isActive);
  const totalActive = activeExpenses.reduce((sum, e) => sum + e.amount, 0);

  if (!activeBankAccount) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.emptyState}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emptyIconContainer}
          >
            <IconSymbol name="building.columns" size={32} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {t.noAccount}
          </Text>
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
        {/* Total Active Summary */}
        {recurringExpenses.length > 0 && (
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.summaryHeader}>
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryIconContainer}
              >
                <IconSymbol name="arrow.2.squarepath" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.summaryLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                {t.totalActive}
              </Text>
            </View>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {formatCurrency(totalActive)}{t.perMonth}
            </Text>
          </View>
        )}

        {recurringExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <IconSymbol name="arrow.2.squarepath" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.noExpenses}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
              {t.addFirst}
            </Text>
          </View>
        ) : (
          recurringExpenses
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((expense) => (
              <View
                key={expense.id}
                style={[
                  styles.expenseItem,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    opacity: expense.isActive ? 1 : 0.6,
                  },
                ]}
              >
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseTitleRow}>
                    <LinearGradient
                      colors={expense.isActive ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.expenseIconContainer}
                    >
                      <IconSymbol name="arrow.2.squarepath" size={16} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.expenseTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {expense.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: expense.isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(107, 114, 128, 0.15)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: expense.isActive ? '#10B981' : '#6B7280' },
                      ]}
                    >
                      {expense.isActive ? t.active : t.paused}
                    </Text>
                  </View>
                </View>

                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                    {translateCategory(expense.category, settings.language)}
                  </Text>
                  <Text style={[styles.expenseAmount, { color: '#EF4444' }]}>
                    {formatCurrency(expense.amount)}{t.perMonth}
                  </Text>
                </View>

                <Text style={[styles.expenseSince, { color: isDark ? '#666' : '#9CA3AF' }]}>
                  {t.since}: {formatMonthKey(expense.startMonth, settings.language)}
                  {expense.endMonth && ` • ${t.until}: ${formatMonthKey(expense.endMonth, settings.language)}`}
                </Text>

                {expense.note && (
                  <Text style={[styles.expenseNote, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                    {expense.note}
                  </Text>
                )}

                <View style={styles.expenseActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]}
                    onPress={() => handleToggle(expense.id)}
                  >
                    <Text style={[styles.actionButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {expense.isActive ? t.pause : t.resume}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteActionButton]}
                    onPress={() => handleDelete(expense.id)}
                  >
                    <Text style={styles.deleteActionButtonText}>{t.delete}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => setShowNewModal(true)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* New Expense Modal */}
      <Modal
        visible={showNewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)' },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIconContainer}
                >
                  <IconSymbol name="arrow.2.squarepath" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.newExpense}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#A0A0A0' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.title}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      color: isDark ? '#FFFFFF' : '#111827',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Netflix, Spotify, etc."
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />

                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.amount}
                </Text>
                <View
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                >
                  <CurrencyInput
                    value={amount}
                    onChangeValue={setAmount}
                    currency={settings.currency}
                    textColor={isDark ? '#FFFFFF' : '#111827'}
                    prefixColor={isDark ? '#A0A0A0' : '#6B7280'}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.category}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipList}>
                  {categories.expenseCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: category === cat
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                          borderColor: category === cat
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: category === cat ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {translateCategory(cat, settings.language)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.startMonth}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipList}>
                  {monthOptions.map((monthKey) => (
                    <TouchableOpacity
                      key={monthKey}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: startMonth === monthKey
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                          borderColor: startMonth === monthKey
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                      onPress={() => {
                        setStartMonth(monthKey);
                        // Reset endMonth if it's before the new startMonth
                        if (endMonth && endMonth < monthKey) {
                          setEndMonth(null);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: startMonth === monthKey ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {formatMonthKey(monthKey, settings.language)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.endMonth}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipList}>
                  <TouchableOpacity
                    style={[
                      styles.chip,
                      {
                        backgroundColor: endMonth === null
                          ? '#6366F1'
                          : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        borderColor: endMonth === null
                          ? '#6366F1'
                          : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                    onPress={() => setEndMonth(null)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: endMonth === null ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
                      ]}
                    >
                      {t.noEndMonth}
                    </Text>
                  </TouchableOpacity>
                  {monthOptions.filter((m) => m >= startMonth).map((monthKey) => (
                    <TouchableOpacity
                      key={monthKey}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: endMonth === monthKey
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                          borderColor: endMonth === monthKey
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                      onPress={() => setEndMonth(monthKey)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: endMonth === monthKey ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {formatMonthKey(monthKey, settings.language)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.note}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      color: isDark ? '#FFFFFF' : '#111827',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                  value={note}
                  onChangeText={setNote}
                  placeholder={t.note}
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]}
                    onPress={() => setShowNewModal(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {t.cancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButtonContainer, { opacity: title.trim() && currencyToFloat(amount) > 0 && category ? 1 : 0.5 }]}
                    onPress={handleCreate}
                    disabled={!title.trim() || currencyToFloat(amount) <= 0 || !category}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitButton}
                    >
                      <Text style={styles.submitButtonText}>{t.save}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
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
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
  },
  expenseItem: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expenseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expenseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCategory: {
    fontSize: 14,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  expenseSince: {
    fontSize: 12,
  },
  expenseNote: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
  },
  deleteActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  formScroll: {
    maxHeight: 400,
  },
  form: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  chipList: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
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
  submitButtonContainer: {
    flex: 1,
  },
  submitButton: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
