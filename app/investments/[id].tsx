import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useInvestment } from '@/contexts/investment-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { CurrencyInput, currencyToFloat, floatToCurrency } from '@/components/ui/currency-input';
import { useAlert } from '@/contexts/alert-context';
import {
  t,
  formatDate,
  formatPercentChange,
  calculatePercentChange,
  InvestmentWithTotal,
  InvestmentMovement,
  MovementType,
  INVESTMENT_COLORS,
} from '@/types/investment';

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getInvestment, addContribution, deleteInvestment, deleteMovement, updateMovement, updateInvestment, refreshData } =
    useInvestment();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showToast, showConfirm } = useAlert();

  const [investment, setInvestment] = useState<InvestmentWithTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTotalValue, setNewTotalValue] = useState('0');
  const [newTag, setNewTag] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('deposit');
  const [saving, setSaving] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMovement, setEditingMovement] = useState<InvestmentMovement | null>(null);
  const [editAmount, setEditAmount] = useState('0');
  const [editDate, setEditDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [editTag, setEditTag] = useState('');
  const [editMovementType, setEditMovementType] = useState<MovementType>('deposit');
  const [editSaving, setEditSaving] = useState(false);

  // Edit investment modal state
  const [editInvestmentModalVisible, setEditInvestmentModalVisible] = useState(false);
  const [editInvestmentName, setEditInvestmentName] = useState('');
  const [editInvestmentColor, setEditInvestmentColor] = useState(INVESTMENT_COLORS[0]);
  const [editInvestmentSaving, setEditInvestmentSaving] = useState(false);

  const lang = settings.language;

  const formatCurrency = (value: number) => {
    const locale = settings.currency === 'BRL' ? 'pt-BR' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: settings.currency,
    }).format(value);
  };

  const loadInvestment = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getInvestment(id);
      setInvestment(data);
      if (data) {
        setNewTotalValue(floatToCurrency(data.total));
      }
    } catch (error) {
      console.error('Error loading investment:', error);
    } finally {
      setLoading(false);
    }
  }, [id, getInvestment]);

  useEffect(() => {
    loadInvestment();
  }, [loadInvestment]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    await loadInvestment();
    setRefreshing(false);
  };

  const handleAddContribution = async () => {
    if (!investment) return;

    const newTotalFloat = currencyToFloat(newTotalValue);
    const delta = newTotalFloat - investment.total;
    if (Math.abs(delta) < 0.01) {
      showToast({ message: t('valueMatchesCurrent', lang), type: 'warning' });
      return;
    }

    setSaving(true);
    try {
      await addContribution(investment.id, newTotalFloat, newTag.trim() || undefined, movementType);
      setNewTag('');
      setMovementType('deposit');
      await loadInvestment();
      showToast({ message: t('contributionAdded', lang), type: 'success' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'VALUE_MATCHES_CURRENT') {
        showToast({ message: t('valueMatchesCurrent', lang), type: 'warning' });
      } else {
        showToast({ message: t('errorSaving', lang), type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvestment = () => {
    showConfirm({
      title: t('delete', lang),
      message: t('confirmDelete', lang),
      buttons: [
        { text: t('cancel', lang), style: 'cancel' },
        {
          text: t('delete', lang),
          style: 'destructive',
          onPress: async () => {
            if (!investment) return;
            try {
              await deleteInvestment(investment.id);
              router.back();
            } catch (error) {
              console.error('Error deleting investment:', error);
            }
          },
        },
      ],
    });
  };

  const handleDeleteMovement = (movement: InvestmentMovement) => {
    showConfirm({
      title: t('delete', lang),
      message: `${formatCurrency(movement.amount)}?`,
      buttons: [
        { text: t('cancel', lang), style: 'cancel' },
        {
          text: t('delete', lang),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMovement(movement.id);
              await loadInvestment();
            } catch (error) {
              console.error('Error deleting movement:', error);
            }
          },
        },
      ],
    });
  };

  const handleEditMovement = (movement: InvestmentMovement) => {
    setEditingMovement(movement);
    setEditAmount(floatToCurrency(Math.abs(movement.amount)));
    // Parse date string (YYYY-MM-DD) to Date object
    const [year, month, day] = movement.date.split('-').map(Number);
    setEditDate(new Date(year, month - 1, day));
    setEditTag(movement.tags.join(', '));
    setEditMovementType(movement.movementType || 'deposit');
    setEditModalVisible(true);
  };

  const handleEditDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setEditDate(selectedDate);
    }
  };

  const formatEditDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSaveEdit = async () => {
    if (!editingMovement) return;

    setEditSaving(true);
    try {
      const amountFloat = currencyToFloat(editAmount);
      const finalAmount = editingMovement.amount >= 0 ? amountFloat : -amountFloat;
      const tags = editTag
        .split(',')
        .map((t) => t.trim().toLowerCase().replace(/\s+/g, '-'))
        .filter((t) => t.length > 0);

      await updateMovement(editingMovement.id, {
        amount: finalAmount,
        date: formatEditDate(editDate),
        tags,
        movementType: editMovementType,
      });

      setEditModalVisible(false);
      setEditingMovement(null);
      await loadInvestment();
      showToast({ message: t('movementUpdated', lang), type: 'success' });
    } catch (error) {
      console.error('Error updating movement:', error);
      showToast({ message: t('errorUpdating', lang), type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleOpenEditInvestment = () => {
    if (!investment) return;
    setEditInvestmentName(investment.name);
    setEditInvestmentColor(investment.color || INVESTMENT_COLORS[0]);
    setEditInvestmentModalVisible(true);
  };

  const handleSaveEditInvestment = async () => {
    if (!investment || !editInvestmentName.trim()) return;

    setEditInvestmentSaving(true);
    try {
      await updateInvestment({
        ...investment,
        name: editInvestmentName.trim(),
        color: editInvestmentColor,
      });

      setEditInvestmentModalVisible(false);
      await loadInvestment();
      showToast({ message: t('investmentUpdated', lang), type: 'success' });
    } catch (error) {
      console.error('Error updating investment:', error);
      showToast({ message: t('errorUpdatingInvestment', lang), type: 'error' });
    } finally {
      setEditInvestmentSaving(false);
    }
  };

  // Calculate movements with running totals for display
  const getMovementsWithTotals = () => {
    if (!investment) return [];

    const sorted = [...investment.movements].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let runningTotal = 0;
    const withTotals = sorted.map((m) => {
      const previousTotal = runningTotal;
      runningTotal += m.amount;
      const percentChange = calculatePercentChange(m.amount, previousTotal);
      return { ...m, previousTotal, newTotal: runningTotal, percentChange };
    });

    // Return in reverse order (most recent first)
    return withTotals.reverse();
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

  if (!investment) {
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
            <IconSymbol name="exclamationmark.triangle" size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            Investment not found
          </Text>
        </View>
      </ThemedView>
    );
  }

  const movementsWithTotals = getMovementsWithTotals();

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <Stack.Screen
        options={{
          title: investment.name,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={handleOpenEditInvestment} style={styles.headerButton}>
                <IconSymbol name="pencil" size={20} color={isDark ? '#ECEDEE' : '#11181C'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteInvestment} style={styles.headerButton}>
                <IconSymbol name="trash" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Total Summary */}
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
              {t('totalInvested', lang)}
            </Text>
          </View>

          <Text style={[styles.totalValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {formatCurrency(investment.total)}
          </Text>

          {investment.lastMovement && investment.lastMovement.percentChange !== null && (
            <Text
              style={[
                styles.changeText,
                {
                  color:
                    investment.lastMovement.percentChange >= 0 ? '#10B981' : '#EF4444',
                },
              ]}
            >
              {formatPercentChange(investment.lastMovement.percentChange)}{' '}
              {t('vsLastTotal', lang)}
            </Text>
          )}
        </View>

        {/* Add Contribution Form */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconContainer}
            >
              <IconSymbol name="plus.circle.fill" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t('addContribution', lang)}
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t('newTotalValue', lang)}
          </Text>
          <CurrencyInput
            value={newTotalValue}
            onChangeValue={setNewTotalValue}
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

          {Math.abs(currencyToFloat(newTotalValue) - investment.total) > 0.01 && (
            <View
              style={[
                styles.deltaPreviewContainer,
                {
                  backgroundColor:
                    currencyToFloat(newTotalValue) > investment.total
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                },
              ]}
            >
              <Text
                style={[
                  styles.deltaPreview,
                  { color: currencyToFloat(newTotalValue) > investment.total ? '#10B981' : '#EF4444' },
                ]}
              >
                {currencyToFloat(newTotalValue) > investment.total ? '+' : ''}
                {formatCurrency(currencyToFloat(newTotalValue) - investment.total)}
              </Text>
            </View>
          )}

          <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t('movementType', lang)}
          </Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                {
                  backgroundColor: movementType === 'deposit'
                    ? 'rgba(16, 185, 129, 0.15)'
                    : isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                  borderColor: movementType === 'deposit'
                    ? '#10B981'
                    : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              onPress={() => setMovementType('deposit')}
              activeOpacity={0.8}
            >
              <IconSymbol
                name="arrow.down.circle.fill"
                size={18}
                color={movementType === 'deposit' ? '#10B981' : isDark ? '#666' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  { color: movementType === 'deposit' ? '#10B981' : isDark ? '#FFFFFF' : '#111827' },
                ]}
              >
                {t('deposit', lang)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                {
                  backgroundColor: movementType === 'dividend'
                    ? 'rgba(99, 102, 241, 0.15)'
                    : isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                  borderColor: movementType === 'dividend'
                    ? '#6366F1'
                    : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              onPress={() => setMovementType('dividend')}
              activeOpacity={0.8}
            >
              <IconSymbol
                name="sparkles"
                size={18}
                color={movementType === 'dividend' ? '#6366F1' : isDark ? '#666' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.typeOptionText,
                  { color: movementType === 'dividend' ? '#6366F1' : isDark ? '#FFFFFF' : '#111827' },
                ]}
              >
                {t('dividend', lang)}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t('optionalTag', lang)}
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
            value={newTag}
            onChangeText={setNewTag}
            placeholder="bonus, dividends..."
            placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { opacity: Math.abs(currencyToFloat(newTotalValue) - investment.total) > 0.01 && !saving ? 1 : 0.5 },
            ]}
            onPress={handleAddContribution}
            disabled={Math.abs(currencyToFloat(newTotalValue) - investment.total) < 0.01 || saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>
                {saving ? t('saving', lang) : t('addContribution', lang)}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Movements History */}
        <View style={styles.movementsSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {t('movements', lang)}
          </Text>

          {movementsWithTotals.length === 0 ? (
            <View
              style={[
                styles.emptyMovements,
                {
                  backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <IconSymbol name="tray" size={32} color={isDark ? '#808080' : '#9CA3AF'} />
              <Text style={[styles.emptyMovementsText, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t('noMovements', lang)}
              </Text>
            </View>
          ) : (
            movementsWithTotals.map((movement) => (
              <TouchableOpacity
                key={movement.id}
                style={[
                  styles.movementCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
                onPress={() => handleEditMovement(movement)}
                onLongPress={() => handleDeleteMovement(movement)}
                activeOpacity={0.8}
              >
                <View style={styles.movementHeader}>
                  <View style={styles.movementAmountRow}>
                    <View
                      style={[
                        styles.movementIndicator,
                        { backgroundColor: movement.amount >= 0 ? '#10B981' : '#EF4444' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.movementAmount,
                        { color: movement.amount >= 0 ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      {movement.amount >= 0 ? '+' : ''}
                      {formatCurrency(movement.amount)}
                    </Text>
                    {movement.percentChange !== null && (
                      <Text
                        style={[
                          styles.movementPercent,
                          { color: movement.percentChange >= 0 ? '#10B981' : '#EF4444' },
                        ]}
                      >
                        ({formatPercentChange(movement.percentChange)})
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.movementDate, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {formatDate(movement.date, lang)}
                  </Text>
                </View>

                <View style={styles.tagsRow}>
                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor: (movement.movementType || 'deposit') === 'deposit'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(99, 102, 241, 0.15)',
                      },
                    ]}
                  >
                    <IconSymbol
                      name={(movement.movementType || 'deposit') === 'deposit' ? 'arrow.down.circle.fill' : 'sparkles'}
                      size={12}
                      color={(movement.movementType || 'deposit') === 'deposit' ? '#10B981' : '#6366F1'}
                    />
                    <Text
                      style={[
                        styles.typeBadgeText,
                        { color: (movement.movementType || 'deposit') === 'deposit' ? '#10B981' : '#6366F1' },
                      ]}
                    >
                      {t((movement.movementType || 'deposit') as 'deposit' | 'dividend', lang)}
                    </Text>
                  </View>
                  {movement.tags.map((tag, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tag,
                        { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' },
                      ]}
                    >
                      <Text style={[styles.tagText, { color: '#6366F1' }]}>
                        #{tag}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={[styles.movementTotalRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                  <Text style={[styles.movementTotalLabel, { color: isDark ? '#666' : '#9CA3AF' }]}>
                    Total:
                  </Text>
                  <Text style={[styles.movementTotal, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {formatCurrency(movement.newTotal)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit Movement Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconContainer}
              >
                <IconSymbol name="pencil" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('editMovement', lang)}
              </Text>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={20} color={isDark ? '#808080' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('amount', lang)}
            </Text>
            <CurrencyInput
              value={editAmount}
              onChangeValue={setEditAmount}
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

            <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('date', lang)}
            </Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              onPress={() => setShowEditDatePicker(true)}
              activeOpacity={0.8}
            >
              <IconSymbol name="calendar" size={18} color={isDark ? '#808080' : '#6B7280'} />
              <Text style={[styles.datePickerText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {formatDate(formatEditDate(editDate), lang)}
              </Text>
            </TouchableOpacity>
            {showEditDatePicker && (
              <DateTimePicker
                value={editDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEditDateChange}
              />
            )}

            <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('movementType', lang)}
            </Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: editMovementType === 'deposit'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: editMovementType === 'deposit'
                      ? '#10B981'
                      : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={() => setEditMovementType('deposit')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="arrow.down.circle.fill"
                  size={18}
                  color={editMovementType === 'deposit' ? '#10B981' : isDark ? '#666' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    { color: editMovementType === 'deposit' ? '#10B981' : isDark ? '#FFFFFF' : '#111827' },
                  ]}
                >
                  {t('deposit', lang)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: editMovementType === 'dividend'
                      ? 'rgba(99, 102, 241, 0.15)'
                      : isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: editMovementType === 'dividend'
                      ? '#6366F1'
                      : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={() => setEditMovementType('dividend')}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="sparkles"
                  size={18}
                  color={editMovementType === 'dividend' ? '#6366F1' : isDark ? '#666' : '#9CA3AF'}
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    { color: editMovementType === 'dividend' ? '#6366F1' : isDark ? '#FFFFFF' : '#111827' },
                  ]}
                >
                  {t('dividend', lang)}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('optionalTag', lang)}
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
              value={editTag}
              onChangeText={setEditTag}
              placeholder="bonus, dividends..."
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={() => setEditModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('cancel', lang)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, { opacity: editSaving ? 0.5 : 1 }]}
                onPress={handleSaveEdit}
                disabled={editSaving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalSaveButtonGradient}
                >
                  <Text style={styles.modalSaveButtonText}>
                    {editSaving ? t('saving', lang) : t('save', lang)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Investment Modal */}
      <Modal
        visible={editInvestmentModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditInvestmentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconContainer}
              >
                <IconSymbol name="pencil" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t('editInvestment', lang)}
              </Text>
              <TouchableOpacity
                onPress={() => setEditInvestmentModalVisible(false)}
                style={styles.closeButton}
              >
                <IconSymbol name="xmark" size={20} color={isDark ? '#808080' : '#6B7280'} />
              </TouchableOpacity>
            </View>

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
              value={editInvestmentName}
              onChangeText={setEditInvestmentName}
              placeholder={t('investmentName', lang)}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
            />

            <Text style={[styles.inputLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('color', lang)}
            </Text>
            <View style={styles.colorPickerContainer}>
              {INVESTMENT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    editInvestmentColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setEditInvestmentColor(color)}
                  activeOpacity={0.8}
                >
                  {editInvestmentColor === color && (
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalCancelButton,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  },
                ]}
                onPress={() => setEditInvestmentModalVisible(false)}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalCancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t('cancel', lang)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, { opacity: editInvestmentName.trim() && !editInvestmentSaving ? 1 : 0.5 }]}
                onPress={handleSaveEditInvestment}
                disabled={!editInvestmentName.trim() || editInvestmentSaving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalSaveButtonGradient}
                >
                  <Text style={styles.modalSaveButtonText}>
                    {editInvestmentSaving ? t('saving', lang) : t('save', lang)}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 12,
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
  totalValue: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  changeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  deltaPreviewContainer: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deltaPreview: {
    fontSize: 18,
    fontWeight: '700',
  },
  submitButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
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
  movementsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyMovements: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  emptyMovementsText: {
    fontSize: 15,
    fontWeight: '500',
  },
  movementCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  movementAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  movementIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
  },
  movementAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  movementPercent: {
    fontSize: 14,
    fontWeight: '500',
  },
  movementDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  movementTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  movementTotalLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  movementTotal: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  typeOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    gap: 14,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  datePickerText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalSaveButtonGradient: {
    padding: 16,
    alignItems: 'center',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  colorPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});
