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
import { ThemedView } from '@/components/themed-view';
import { useFinance } from '@/contexts/finance-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCurrentMonthKey } from '@/types/finance';

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
  const [startMonth, setStartMonth] = useState(getCurrentMonthKey());
  const [note, setNote] = useState('');

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
    if (!title.trim() || !amount || !category) return;
    try {
      await createRecurringExpense(
        title.trim(),
        category,
        parseFloat(amount),
        startMonth,
        note.trim() || undefined
      );
      setTitle('');
      setAmount('');
      setCategory('');
      setNote('');
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
                backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                borderColor: isDark ? '#333' : '#E0E0E0',
              },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
              {t.totalActive}
            </Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              {formatCurrency(totalActive)}{t.perMonth}
            </Text>
          </View>
        )}

        {recurringExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="arrow.2.squarepath" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.noExpenses}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#999' : '#666' }]}>
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
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                    opacity: expense.isActive ? 1 : 0.6,
                  },
                ]}
              >
                <View style={styles.expenseHeader}>
                  <View style={styles.expenseTitleRow}>
                    <IconSymbol
                      name="arrow.2.squarepath"
                      size={20}
                      color={expense.isActive ? '#10B981' : '#999'}
                    />
                    <Text style={[styles.expenseTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                      {expense.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: expense.isActive ? '#10B98120' : '#99999920' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: expense.isActive ? '#10B981' : '#999' },
                      ]}
                    >
                      {expense.isActive ? t.active : t.paused}
                    </Text>
                  </View>
                </View>

                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseCategory, { color: isDark ? '#999' : '#666' }]}>
                    {expense.category}
                  </Text>
                  <Text style={[styles.expenseAmount, { color: '#EF4444' }]}>
                    {formatCurrency(expense.amount)}{t.perMonth}
                  </Text>
                </View>

                <Text style={[styles.expenseSince, { color: isDark ? '#666' : '#999' }]}>
                  {t.since}: {expense.startMonth}
                </Text>

                {expense.note && (
                  <Text style={[styles.expenseNote, { color: isDark ? '#999' : '#666' }]}>
                    {expense.note}
                  </Text>
                )}

                <View style={styles.expenseActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                    onPress={() => handleToggle(expense.id)}
                  >
                    <Text style={[styles.actionButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                      {expense.isActive ? t.pause : t.resume}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { borderColor: '#EF4444' }]}
                    onPress={() => handleDelete(expense.id)}
                  >
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>
                      {t.delete}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewModal(true)}
      >
        <IconSymbol name="plus" size={24} color="#fff" />
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
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.newExpense}
              </Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.title}
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
                value={title}
                onChangeText={setTitle}
                placeholder="Netflix, Spotify, etc."
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.amount}
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
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#666' : '#999'}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.category}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                {categories.expenseCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: category === cat ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                        borderColor: category === cat ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: category === cat ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.startMonth}
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
                value={startMonth}
                onChangeText={setStartMonth}
                placeholder="YYYY-MM"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.note}
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
                value={note}
                onChangeText={setNote}
                placeholder={t.note}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                  onPress={() => setShowNewModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { opacity: title.trim() && amount && category ? 1 : 0.5 },
                  ]}
                  onPress={handleCreate}
                  disabled={!title.trim() || !amount || !category}
                >
                  <Text style={styles.submitButtonText}>{t.save}</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
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
  expenseItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
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
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
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
