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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
} from '@/types/investment';

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getInvestment, addContribution, deleteInvestment, deleteMovement, refreshData } =
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
            <TouchableOpacity onPress={handleDeleteInvestment} style={styles.headerButton}>
              <IconSymbol name="trash" size={20} color="#EF4444" />
            </TouchableOpacity>
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
});
