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
      // Create charges for each installment
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
      // Refresh the charges list
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
        {creditCards.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="creditcard" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.noCards}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#999' : '#666' }]}>
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
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                  },
                ]}
                onPress={() => openChargesViewModal(card)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <IconSymbol name="creditcard.fill" size={24} color="#007AFF" />
                    <Text style={[styles.cardName, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                      {card.name}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCard(card.id)}>
                    <IconSymbol name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLimit, { color: isDark ? '#999' : '#666' }]}>
                    {t.limit}: {formatCurrency(card.limit)}
                  </Text>
                  <Text style={[styles.cardDays, { color: isDark ? '#999' : '#666' }]}>
                    {t.closeDay}: {card.closeDay} | {t.dueDay}: {card.dueDay}
                  </Text>
                </View>

                <View style={styles.usageSection}>
                  <View style={styles.usageHeader}>
                    <Text style={[styles.usageLabel, { color: isDark ? '#999' : '#666' }]}>
                      {t.used}: {formatCurrency(summary?.totalUsed || 0)} {t.of} {formatCurrency(card.limit)}
                    </Text>
                    <Text style={[styles.usagePercent, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                      {usedPercent.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${usedPercent}%`,
                          backgroundColor: usedPercent > 80 ? '#EF4444' : usedPercent > 50 ? '#F59E0B' : '#10B981',
                        },
                      ]}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addChargeButton}
                  onPress={() => openChargeModal(card)}
                >
                  <IconSymbol name="plus.circle.fill" size={20} color="#007AFF" />
                  <Text style={styles.addChargeText}>{t.addCharge}</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNewCardModal(true)}
      >
        <IconSymbol name="plus" size={24} color="#fff" />
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
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.newCard}
              </Text>
              <TouchableOpacity onPress={() => setShowNewCardModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.cardName}
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
                value={cardName}
                onChangeText={setCardName}
                placeholder={t.cardName}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.limit}
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
                  value={cardLimit}
                  onChangeValue={setCardLimit}
                  currency={settings.currency}
                  textColor={isDark ? '#ECEDEE' : '#11181C'}
                  prefixColor={isDark ? '#999' : '#666'}
                />
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t.closeDay}
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
                    value={closeDay}
                    onChangeText={setCloseDay}
                    placeholder="15"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                    {t.dueDay}
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
                  style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                  onPress={() => setShowNewCardModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { opacity: cardName.trim() && currencyToFloat(cardLimit) > 0 ? 1 : 0.5 },
                  ]}
                  onPress={handleCreateCard}
                  disabled={!cardName.trim() || currencyToFloat(cardLimit) <= 0}
                >
                  <Text style={styles.submitButtonText}>{t.save}</Text>
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
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.newCharge} - {selectedCard?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowChargeModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
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
                  value={chargeAmount}
                  onChangeValue={setChargeAmount}
                  currency={settings.currency}
                  textColor={isDark ? '#ECEDEE' : '#11181C'}
                  prefixColor={isDark ? '#999' : '#666'}
                />
              </View>

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.installments}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.installmentsList}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.installmentChip,
                      {
                        backgroundColor: chargeInstallments === String(num) ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                        borderColor: chargeInstallments === String(num) ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setChargeInstallments(String(num))}
                  >
                    <Text
                      style={[
                        styles.installmentChipText,
                        { color: chargeInstallments === String(num) ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                      ]}
                    >
                      {num}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
                        backgroundColor: chargeCategory === cat ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                        borderColor: chargeCategory === cat ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setChargeCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: chargeCategory === cat ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                      ]}
                    >
                      {translateCategory(cat, settings.language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.month}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthList}>
                {monthOptions.map((monthKey) => (
                  <TouchableOpacity
                    key={monthKey}
                    style={[
                      styles.monthChip,
                      {
                        backgroundColor: chargeMonth === monthKey ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                        borderColor: chargeMonth === monthKey ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
                      },
                    ]}
                    onPress={() => setChargeMonth(monthKey)}
                  >
                    <Text
                      style={[
                        styles.monthChipText,
                        { color: chargeMonth === monthKey ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                      ]}
                    >
                      {formatMonthKey(monthKey, settings.language)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

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
                value={chargeNote}
                onChangeText={setChargeNote}
                placeholder={t.note}
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: isDark ? '#444' : '#E0E0E0' }]}
                  onPress={() => setShowChargeModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { opacity: currencyToFloat(chargeAmount) > 0 && chargeCategory ? 1 : 0.5 },
                  ]}
                  onPress={handleAddCharge}
                  disabled={currencyToFloat(chargeAmount) <= 0 || !chargeCategory}
                >
                  <Text style={styles.submitButtonText}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
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
              { backgroundColor: isDark ? '#1A1A1A' : '#fff' },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {viewingCard?.name} - {t.charges}
              </Text>
              <TouchableOpacity onPress={() => setShowChargesViewModal(false)}>
                <IconSymbol name="xmark" size={24} color={isDark ? '#999' : '#666'} />
              </TouchableOpacity>
            </View>

            {/* Month Selector */}
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
                    styles.monthChip,
                    {
                      backgroundColor: viewMonth === monthKey ? '#007AFF' : isDark ? '#333' : '#F5F5F5',
                      borderColor: viewMonth === monthKey ? '#007AFF' : isDark ? '#444' : '#E0E0E0',
                    },
                  ]}
                  onPress={() => handleViewMonthChange(monthKey)}
                >
                  <Text
                    style={[
                      styles.monthChipText,
                      { color: viewMonth === monthKey ? '#fff' : isDark ? '#ECEDEE' : '#11181C' },
                    ]}
                  >
                    {formatMonthKey(monthKey, settings.language)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Total */}
            {filteredCharges.length > 0 && (
              <View style={[styles.chargesTotal, { borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                <Text style={[styles.chargesTotalLabel, { color: isDark ? '#999' : '#666' }]}>
                  {t.total}
                </Text>
                <Text style={[styles.chargesTotalValue, { color: '#EF4444' }]}>
                  {formatCurrency(filteredTotal)}
                </Text>
              </View>
            )}

            {/* Charges List */}
            {filteredCharges.length === 0 ? (
              <View style={styles.noChargesContainer}>
                <IconSymbol name="doc.text" size={32} color={isDark ? '#666' : '#999'} />
                <Text style={[styles.noChargesText, { color: isDark ? '#666' : '#999' }]}>
                  {t.noCharges}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.chargesList}
                contentContainerStyle={styles.chargesListContent}
              >
                {filteredCharges.map((charge) => (
                  <View
                    key={charge.id}
                    style={[
                      styles.chargeItem,
                      {
                        backgroundColor: isDark ? '#252525' : '#F5F5F5',
                        borderColor: isDark ? '#333' : '#E0E0E0',
                      },
                    ]}
                  >
                    <View style={styles.chargeItemHeader}>
                      <View style={styles.chargeItemInfo}>
                        <Text style={[styles.chargeCategory, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                          {translateCategory(charge.category, settings.language)}
                        </Text>
                        {charge.note && (
                          <Text style={[styles.chargeNote, { color: isDark ? '#999' : '#666' }]}>
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
    padding: 16,
    gap: 16,
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
  cardItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
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
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 4,
  },
  addChargeText: {
    color: '#007AFF',
    fontSize: 15,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
    gap: 4,
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
  monthList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthChipText: {
    fontSize: 13,
    textTransform: 'capitalize',
  },
  installmentsList: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  installmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  installmentChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chargesModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '85%',
    minHeight: 300,
  },
  chargesMonthSelector: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
  },
  chargesMonthSelectorContent: {
    paddingRight: 20,
    alignItems: 'center',
  },
  chargesTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  chargesTotalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  chargesTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chargesList: {
    flexGrow: 1,
  },
  chargesListContent: {
    paddingBottom: 20,
  },
  noChargesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noChargesText: {
    fontSize: 14,
  },
  chargeItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  chargeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chargeItemInfo: {
    flex: 1,
    gap: 2,
  },
  chargeItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chargeCategory: {
    fontSize: 15,
    fontWeight: '500',
  },
  chargeAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  chargeNote: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  chargeDeleteButton: {
    padding: 4,
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
