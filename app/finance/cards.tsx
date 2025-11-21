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
import { CreditCard, CardCharge, getCurrentMonthKey, translateCategory } from '@/types/finance';

export default function CardsScreen() {
  const {
    activeBankAccount,
    creditCards,
    createCreditCard,
    deleteCreditCard,
    getCardCharges,
    createCardCharge,
    getCardSummary,
    categories,
    refreshData,
  } = useFinance();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
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
  const [chargeMonth, setChargeMonth] = useState(getCurrentMonthKey());
  const [chargeNote, setChargeNote] = useState('');

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
      deleteCard: 'Delete',
      upcomingStatements: 'Upcoming',
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
      deleteCard: 'Excluir',
      upcomingStatements: 'Próximas faturas',
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
    if (!selectedCard || amount <= 0 || !chargeCategory) return;
    try {
      await createCardCharge(
        selectedCard.id,
        amount,
        chargeCategory,
        chargeMonth,
        chargeNote.trim() || undefined
      );
      setChargeAmount('');
      setChargeCategory('');
      setChargeNote('');
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
    setChargeMonth(getCurrentMonthKey());
    setShowChargeModal(true);
  };

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
              <View
                key={card.id}
                style={[
                  styles.cardItem,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                  },
                ]}
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
              </View>
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
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#333' : '#F5F5F5',
                    color: isDark ? '#ECEDEE' : '#11181C',
                    borderColor: isDark ? '#444' : '#E0E0E0',
                  },
                ]}
                value={chargeMonth}
                onChangeText={setChargeMonth}
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
