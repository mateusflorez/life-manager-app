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
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useFinance } from '@/contexts/finance-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BankAccount, getMonthName } from '@/types/finance';

export default function FinanceOverviewScreen() {
  const {
    bankAccounts,
    activeBankAccount,
    setActiveBankAccount,
    createBankAccount,
    ensureMonth,
    getMonthSummary,
    getYearSummary,
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

  const loadSummaries = useCallback(async () => {
    if (!activeBankAccount) return;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    try {
      // Ensure current month exists and get summary
      const { financeMonth } = await ensureMonth(year, month);
      const monthSum = await getMonthSummary(financeMonth.id);
      setCurrentMonthSummary(monthSum);

      // Get year summary
      const yearSum = await getYearSummary(year);
      setYearSummary(yearSum);
    } catch (error) {
      console.error('Error loading summaries:', error);
    }
  }, [activeBankAccount, ensureMonth, getMonthSummary, getYearSummary]);

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
        {/* Account Selector */}
        <TouchableOpacity
          style={[
            styles.accountSelector,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
          onPress={() => setShowAccountModal(true)}
        >
          <View style={styles.accountInfo}>
            <Text style={[styles.accountLabel, { color: isDark ? '#999' : '#666' }]}>
              {t.account}
            </Text>
            <Text style={[styles.accountName, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {activeBankAccount?.name || t.selectAccount}
            </Text>
          </View>
          <IconSymbol name="chevron.down" size={20} color={isDark ? '#999' : '#666'} />
        </TouchableOpacity>

        {!activeBankAccount ? (
          <View style={styles.emptyState}>
            <IconSymbol name="building.columns" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.noAccounts}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#999' : '#666' }]}>
              {t.createFirst}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowNewAccountModal(true)}
            >
              <Text style={styles.createButtonText}>{t.createAccount}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Current Month Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.currentMonth} - {currentMonthName} {currentYear}
              </Text>

              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t.income}
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                    {formatCurrency(currentMonthSummary.income)}
                  </Text>
                </View>

                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t.expenses}
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                    {formatCurrency(currentMonthSummary.expenses)}
                  </Text>
                </View>
              </View>

              <View style={styles.balanceContainer}>
                <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                  {t.balance}
                </Text>
                <Text
                  style={[
                    styles.balanceValue,
                    {
                      color:
                        currentMonthSummary.balance >= 0 ? '#10B981' : '#EF4444',
                    },
                  ]}
                >
                  {formatCurrency(currentMonthSummary.balance)}
                </Text>
              </View>
            </View>

            {/* Year Summary */}
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.yearSummary} {currentYear}
              </Text>

              {yearSummary.months.length === 0 ? (
                <Text style={[styles.noData, { color: isDark ? '#666' : '#999' }]}>
                  {t.noData}
                </Text>
              ) : (
                <>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                        {t.income}
                      </Text>
                      <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                        {formatCurrency(yearSummary.totalIncome)}
                      </Text>
                    </View>

                    <View style={styles.summaryItem}>
                      <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                        {t.expenses}
                      </Text>
                      <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                        {formatCurrency(yearSummary.totalExpenses)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.balanceContainer}>
                    <Text style={[styles.summaryLabel, { color: isDark ? '#999' : '#666' }]}>
                      {t.balance}
                    </Text>
                    <Text
                      style={[
                        styles.balanceValue,
                        {
                          color:
                            yearSummary.totalBalance >= 0 ? '#10B981' : '#EF4444',
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
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.selectAccount}
              </Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
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
                            ? '#333'
                            : '#E8F4FD'
                          : 'transparent',
                      borderColor: isDark ? '#333' : '#E0E0E0',
                    },
                  ]}
                  onPress={() => handleSelectAccount(account)}
                >
                  <View style={[styles.accountAvatar, { backgroundColor: '#10B981' }]}>
                    <Text style={styles.accountAvatarText}>
                      {account.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.accountItemInfo}>
                    <Text
                      style={[styles.accountItemName, { color: isDark ? '#ECEDEE' : '#11181C' }]}
                    >
                      {account.name}
                    </Text>
                    {account.description && (
                      <Text style={[styles.accountItemDesc, { color: isDark ? '#999' : '#666' }]}>
                        {account.description}
                      </Text>
                    )}
                  </View>
                  {activeBankAccount?.id === account.id && (
                    <IconSymbol name="checkmark" size={20} color="#007AFF" />
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
            >
              <IconSymbol name="plus.circle.fill" size={24} color="#007AFF" />
              <Text style={styles.newAccountButtonText}>{t.newAccount}</Text>
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
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.newAccount}
              </Text>
              <TouchableOpacity onPress={() => setShowNewAccountModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.accountName}
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
                value={newAccountName}
                onChangeText={setNewAccountName}
                placeholder={t.accountName}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.description}
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
                value={newAccountDesc}
                onChangeText={setNewAccountDesc}
                placeholder={t.description}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                  onPress={() => setShowNewAccountModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
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
                >
                  <Text style={styles.submitButtonText}>{t.create}</Text>
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
  },
  accountSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  accountInfo: {
    gap: 4,
  },
  accountLabel: {
    fontSize: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
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
    gap: 16,
  },
  cardTitle: {
    fontSize: 16,
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
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  noData: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
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
  accountList: {
    maxHeight: 300,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  accountAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountItemInfo: {
    flex: 1,
  },
  accountItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountItemDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  newAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  newAccountButtonText: {
    color: '#007AFF',
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
