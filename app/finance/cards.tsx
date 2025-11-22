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
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { useFinance } from '@/contexts/finance-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { CurrencyInput, currencyToFloat } from '@/components/ui/currency-input';
import { CreditCard, CardCharge, getNextMonthKey, getMonthOptions, getCurrentMonthKey, formatMonthKey, addMonthsToKey, translateCategory } from '@/types/finance';

export default function CardsScreen() {
  const {
    activeBankAccount,
    creditCards,
    createCreditCard,
    deleteCreditCard,
    getCardCharges,
    createCardCharge,
    deleteCardCharge,
    getCardSummary,
    categories,
    refreshData,
  } = useFinance();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showChargesViewModal, setShowChargesViewModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [viewingCard, setViewingCard] = useState<CreditCard | null>(null);
  const [viewMonth, setViewMonth] = useState(getCurrentMonthKey());
  const [cardCharges, setCardCharges] = useState<CardCharge[]>([]);
  const [cardSummaries, setCardSummaries] = useState<Map<string, { totalUsed: number }>>(
    new Map()
  );
  const [refreshing, setRefreshing] = useState(false);

  // New card form
  const [cardName, setCardName] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [closeDay, setCloseDay] = useState('15');
  const [dueDay, setDueDay] = useState('22');

  // New charge form
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeCategory, setChargeCategory] = useState('');
  const [chargeMonth, setChargeMonth] = useState(getNextMonthKey());
  const [chargeNote, setChargeNote] = useState('');
  const [chargeInstallments, setChargeInstallments] = useState('1');

  // Month options for selector
  const monthOptions = getMonthOptions(12);

  const translations = {
    en: {
      noAccount: 'Select an account first',
      noCards: 'No credit cards yet',
      addFirst: 'Add your first credit card to track expenses',
      addCard: 'Add Card',
      newCard: 'New Credit Card',
      cardName: 'Card name',
      limit: 'Limit',
      closeDay: 'Closing day',
      dueDay: 'Due day',
      cancel: 'Cancel',
      save: 'Save',
      used: 'Used',
      of: 'of',
      addCharge: 'Add Charge',
      newCharge: 'New Charge',
      amount: 'Amount',
      category: 'Category',
      month: 'Statement month',
      note: 'Note (optional)',
      installments: 'Installments',
      deleteCard: 'Delete',
      upcomingStatements: 'Upcoming',
      viewCharges: 'View Charges',
      charges: 'Charges',
      noCharges: 'No charges this month',
      total: 'Total',
    },
    pt: {
      noAccount: 'Selecione uma conta primeiro',
      noCards: 'Nenhum cartão de crédito ainda',
      addFirst: 'Adicione seu primeiro cartão para controlar gastos',
      addCard: 'Adicionar Cartão',
      newCard: 'Novo Cartão de Crédito',
      cardName: 'Nome do cartão',
      limit: 'Limite',
      closeDay: 'Dia de fechamento',
      dueDay: 'Dia de vencimento',
      cancel: 'Cancelar',
      save: 'Salvar',
      used: 'Usado',
      of: 'de',
      addCharge: 'Adicionar Gasto',
      newCharge: 'Novo Gasto',
      amount: 'Valor',
      category: 'Categoria',
      month: 'Mês da fatura',
      note: 'Nota (opcional)',
      installments: 'Parcelas',
      deleteCard: 'Excluir',
      upcomingStatements: 'Próximas faturas',
      viewCharges: 'Ver Gastos',
      charges: 'Gastos',
      noCharges: 'Nenhum gasto neste mês',
      total: 'Total',
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

  const loadCardSummaries = useCallback(async () => {
    const summaries = new Map<string, { totalUsed: number }>();
    for (const card of creditCards) {
      const summary = await getCardSummary(card.id);
      summaries.set(card.id, { totalUsed: summary.totalUsed });
    }
    setCardSummaries(summaries);
  }, [creditCards, getCardSummary]);

  useEffect(() => {
    loadCardSummaries();
  }, [loadCardSummaries]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadCardSummaries();
    setRefreshing(false);
  };

  const handleCreateCard = async () => {
    const limit = currencyToFloat(cardLimit);
    if (!cardName.trim() || limit <= 0) return;
    try {
      await createCreditCard(
        cardName.trim(),
        limit,
        parseInt(closeDay) || 15,
        parseInt(dueDay) || 22
      );
      setCardName('');
      setCardLimit('');
      setCloseDay('15');
      setDueDay('22');
      setShowNewCardModal(false);
      await loadCardSummaries();
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleAddCharge = async () => {
    const amount = currencyToFloat(chargeAmount);
    const installments = Math.max(1, parseInt(chargeInstallments) || 1);
    if (!selectedCard || amount <= 0 || !chargeCategory) return;
    try {
      for (let i = 0; i < installments; i++) {
        const month = addMonthsToKey(chargeMonth, i);
        const note = installments > 1
          ? `${chargeNote.trim() ? chargeNote.trim() + ' - ' : ''}${i + 1}/${installments}`
          : chargeNote.trim() || undefined;
        await createCardCharge(
          selectedCard.id,
          amount,
          chargeCategory,
          month,
          note
        );
      }
      setChargeAmount('');
      setChargeCategory('');
      setChargeNote('');
      setChargeInstallments('1');
      setShowChargeModal(false);
      await loadCardSummaries();
    } catch (error) {
      console.error('Error adding charge:', error);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await deleteCreditCard(cardId);
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const openChargeModal = (card: CreditCard) => {
    setSelectedCard(card);
    setChargeMonth(getNextMonthKey());
    setChargeInstallments('1');
    setShowChargeModal(true);
  };

  const openChargesViewModal = async (card: CreditCard) => {
    setViewingCard(card);
    setViewMonth(getCurrentMonthKey());
    const charges = await getCardCharges(card.id);
    setCardCharges(charges);
    setShowChargesViewModal(true);
  };

  const handleViewMonthChange = async (monthKey: string) => {
    setViewMonth(monthKey);
  };

  const handleDeleteCharge = async (chargeId: string) => {
    try {
      await deleteCardCharge(chargeId);
      if (viewingCard) {
        const charges = await getCardCharges(viewingCard.id);
        setCardCharges(charges);
      }
      await loadCardSummaries();
    } catch (error) {
      console.error('Error deleting charge:', error);
    }
  };

  const filteredCharges = cardCharges.filter((charge) => charge.statementMonth === viewMonth);
  const filteredTotal = filteredCharges.reduce((sum, charge) => sum + charge.amount, 0);

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
        {creditCards.length === 0 ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <IconSymbol name="creditcard" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.noCards}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
              {t.addFirst}
            </Text>
          </View>
        ) : (
          creditCards.map((card) => {
            const summary = cardSummaries.get(card.id);
            const usedPercent = card.limit > 0
              ? Math.min(100, ((summary?.totalUsed || 0) / card.limit) * 100)
              : 0;

            return (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.cardItem,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                onPress={() => openChargesViewModal(card)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardIconContainer}
                    >
                      <IconSymbol name="creditcard.fill" size={18} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.cardName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {card.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteCard(card.id)}
                  >
                    <IconSymbol name="trash" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLimit, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                    {t.limit}: {formatCurrency(card.limit)}
                  </Text>
                  <Text style={[styles.cardDays, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                    {t.closeDay}: {card.closeDay} | {t.dueDay}: {card.dueDay}
                  </Text>
                </View>

                <View style={styles.usageSection}>
                  <View style={styles.usageHeader}>
                    <Text style={[styles.usageLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                      {t.used}: {formatCurrency(summary?.totalUsed || 0)} {t.of} {formatCurrency(card.limit)}
                    </Text>
                    <Text style={[styles.usagePercent, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {usedPercent.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
                    <LinearGradient
                      colors={usedPercent > 80 ? ['#EF4444', '#DC2626'] : usedPercent > 50 ? ['#F59E0B', '#D97706'] : ['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.progressFill, { width: `${usedPercent}%` }]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.addChargeButton, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}
                  onPress={() => openChargeModal(card)}
                >
                  <IconSymbol name="plus.circle.fill" size={18} color="#6366F1" />
                  <Text style={styles.addChargeText}>{t.addCharge}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fabContainer}
        onPress={() => setShowNewCardModal(true)}
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

      {/* New Card Modal */}
      <Modal
        visible={showNewCardModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewCardModal(false)}
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
                  <IconSymbol name="creditcard.fill" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.newCard}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowNewCardModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#A0A0A0' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                {t.cardName}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: isDark ? '#FFFFFF' : '#111827',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                value={cardName}
                onChangeText={setCardName}
                placeholder={t.cardName}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                {t.limit}
              </Text>
              <View
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
              >
                <CurrencyInput
                  value={cardLimit}
                  onChangeValue={setCardLimit}
                  currency={settings.currency}
                  textColor={isDark ? '#FFFFFF' : '#111827'}
                  prefixColor={isDark ? '#A0A0A0' : '#6B7280'}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                    {t.closeDay}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        color: isDark ? '#FFFFFF' : '#111827',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                    value={closeDay}
                    onChangeText={setCloseDay}
                    placeholder="15"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                    {t.dueDay}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        color: isDark ? '#FFFFFF' : '#111827',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                    value={dueDay}
                    onChangeText={setDueDay}
                    placeholder="22"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]}
                  onPress={() => setShowNewCardModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButtonContainer, { opacity: cardName.trim() && currencyToFloat(cardLimit) > 0 ? 1 : 0.5 }]}
                  onPress={handleCreateCard}
                  disabled={!cardName.trim() || currencyToFloat(cardLimit) <= 0}
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
          </View>
        </View>
      </Modal>

      {/* Add Charge Modal */}
      <Modal
        visible={showChargeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChargeModal(false)}
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
                  <IconSymbol name="plus.circle.fill" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.newCharge} - {selectedCard?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowChargeModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#A0A0A0' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.form}>
                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.amount}
                </Text>
                <View
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                >
                  <CurrencyInput
                    value={chargeAmount}
                    onChangeValue={setChargeAmount}
                    currency={settings.currency}
                    textColor={isDark ? '#FFFFFF' : '#111827'}
                    prefixColor={isDark ? '#A0A0A0' : '#6B7280'}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.installments}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipList}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: chargeInstallments === String(num)
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          borderColor: chargeInstallments === String(num)
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                      onPress={() => setChargeInstallments(String(num))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: chargeInstallments === String(num) ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {num}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

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
                          backgroundColor: chargeCategory === cat
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          borderColor: chargeCategory === cat
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                      onPress={() => setChargeCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: chargeCategory === cat ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
                        ]}
                      >
                        {translateCategory(cat, settings.language)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.month}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipList}>
                  {monthOptions.map((monthKey) => (
                    <TouchableOpacity
                      key={monthKey}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: chargeMonth === monthKey
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          borderColor: chargeMonth === monthKey
                            ? '#6366F1'
                            : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        },
                      ]}
                      onPress={() => setChargeMonth(monthKey)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: chargeMonth === monthKey ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
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
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      color: isDark ? '#FFFFFF' : '#111827',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                  value={chargeNote}
                  onChangeText={setChargeNote}
                  placeholder={t.note}
                  placeholderTextColor={isDark ? '#666' : '#999'}
                />

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' }]}
                    onPress={() => setShowChargeModal(false)}
                  >
                    <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {t.cancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButtonContainer, { opacity: currencyToFloat(chargeAmount) > 0 && chargeCategory ? 1 : 0.5 }]}
                    onPress={handleAddCharge}
                    disabled={currencyToFloat(chargeAmount) <= 0 || !chargeCategory}
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

      {/* View Charges Modal */}
      <Modal
        visible={showChargesViewModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChargesViewModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.chargesModalContent,
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
                  <IconSymbol name="creditcard.fill" size={18} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {viewingCard?.name} - {t.charges}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowChargesViewModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#A0A0A0' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chargesMonthSelector}
              contentContainerStyle={styles.chargesMonthSelectorContent}
            >
              {monthOptions.map((monthKey) => (
                <TouchableOpacity
                  key={monthKey}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: viewMonth === monthKey
                        ? '#6366F1'
                        : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      borderColor: viewMonth === monthKey
                        ? '#6366F1'
                        : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                  onPress={() => handleViewMonthChange(monthKey)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: viewMonth === monthKey ? '#FFFFFF' : isDark ? '#FFFFFF' : '#111827' },
                    ]}
                  >
                    {formatMonthKey(monthKey, settings.language)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredCharges.length > 0 && (
              <View style={[styles.chargesTotal, { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
                <Text style={[styles.chargesTotalLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.total}
                </Text>
                <Text style={[styles.chargesTotalValue, { color: '#EF4444' }]}>
                  {formatCurrency(filteredTotal)}
                </Text>
              </View>
            )}

            {filteredCharges.length === 0 ? (
              <View style={styles.noChargesContainer}>
                <IconSymbol name="creditcard" size={32} color={isDark ? '#666' : '#999'} />
                <Text style={[styles.noChargesText, { color: isDark ? '#666' : '#999' }]}>
                  {t.noCharges}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.chargesList}
                contentContainerStyle={styles.chargesListContent}
                showsVerticalScrollIndicator={false}
              >
                {filteredCharges.map((charge) => (
                  <View
                    key={charge.id}
                    style={[
                      styles.chargeItem,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <View style={styles.chargeItemHeader}>
                      <View style={styles.chargeItemInfo}>
                        <Text style={[styles.chargeCategory, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                          {translateCategory(charge.category, settings.language)}
                        </Text>
                        {charge.note && (
                          <Text style={[styles.chargeNote, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                            {charge.note}
                          </Text>
                        )}
                      </View>
                      <View style={styles.chargeItemActions}>
                        <Text style={[styles.chargeAmount, { color: '#EF4444' }]}>
                          {formatCurrency(charge.amount)}
                        </Text>
                        <TouchableOpacity
                          style={styles.chargeDeleteButton}
                          onPress={() => handleDeleteCharge(charge.id)}
                        >
                          <IconSymbol name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
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
  cardItem: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    gap: 4,
  },
  cardLimit: {
    fontSize: 14,
  },
  cardDays: {
    fontSize: 13,
  },
  usageSection: {
    gap: 8,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usageLabel: {
    fontSize: 13,
  },
  usagePercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  addChargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  addChargeText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '600',
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
    flex: 1,
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
    flex: 1,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    gap: 8,
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
  chargesModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    minHeight: 300,
  },
  chargesMonthSelector: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 16,
  },
  chargesMonthSelectorContent: {
    paddingRight: 20,
    alignItems: 'center',
  },
  chargesTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  chargesTotalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  chargesTotalValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  chargesList: {
    flexGrow: 1,
  },
  chargesListContent: {
    paddingBottom: 20,
    gap: 10,
  },
  noChargesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noChargesText: {
    fontSize: 15,
  },
  chargeItem: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  chargeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chargeItemInfo: {
    flex: 1,
    gap: 4,
  },
  chargeItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chargeCategory: {
    fontSize: 15,
    fontWeight: '600',
  },
  chargeAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  chargeNote: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  chargeDeleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
