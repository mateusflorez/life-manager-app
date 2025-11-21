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
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useInvestment } from '@/contexts/investment-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { CurrencyInput, currencyToFloat, floatToCurrency } from '@/components/ui/currency-input';
import {
  t,
  formatDate,
  formatPercentChange,
  calculatePercentChange,
  InvestmentWithTotal,
  InvestmentMovement,
} from '@/types/investment';

export default function InvestmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getInvestment, addContribution, deleteInvestment, deleteMovement, refreshData } =
    useInvestment();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [investment, setInvestment] = useState<InvestmentWithTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newTotalValue, setNewTotalValue] = useState('0');
  const [newTag, setNewTag] = useState('');
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
      Alert.alert('', t('valueMatchesCurrent', lang));
      return;
    }

    setSaving(true);
    try {
      await addContribution(investment.id, newTotalFloat, newTag.trim() || undefined);
      setNewTag('');
      await loadInvestment();
      Alert.alert('', t('contributionAdded', lang));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage === 'VALUE_MATCHES_CURRENT') {
        Alert.alert('', t('valueMatchesCurrent', lang));
      } else {
        Alert.alert('', t('errorSaving', lang));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvestment = () => {
    Alert.alert(t('delete', lang), t('confirmDelete', lang), [
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
    ]);
  };

  const handleDeleteMovement = (movement: InvestmentMovement) => {
    Alert.alert(t('delete', lang), `${formatCurrency(movement.amount)}?`, [
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
    ]);
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  if (!investment) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            Investment not found
          </Text>
        </View>
      </ThemedView>
    );
  }

  const movementsWithTotals = getMovementsWithTotals();

  return (
    <ThemedView style={styles.container}>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Total Summary */}
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
            {t('totalInvested', lang)}
          </Text>
          <Text style={[styles.totalValue, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
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
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t('addContribution', lang)}
          </Text>

          <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
            {t('newTotalValue', lang)}
          </Text>
          <CurrencyInput
            value={newTotalValue}
            onChangeValue={setNewTotalValue}
            currency={settings.currency}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#333' : '#F5F5F5',
                color: isDark ? '#ECEDEE' : '#11181C',
                borderColor: isDark ? '#444' : '#E0E0E0',
              },
            ]}
            placeholderTextColor={isDark ? '#666' : '#999'}
          />

          {Math.abs(currencyToFloat(newTotalValue) - investment.total) > 0.01 && (
            <Text
              style={[
                styles.deltaPreview,
                { color: currencyToFloat(newTotalValue) > investment.total ? '#10B981' : '#EF4444' },
              ]}
            >
              {currencyToFloat(newTotalValue) > investment.total ? '+' : ''}
              {formatCurrency(currencyToFloat(newTotalValue) - investment.total)}
            </Text>
          )}

          <Text style={[styles.inputLabel, { color: isDark ? '#999' : '#666' }]}>
            {t('optionalTag', lang)}
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
            value={newTag}
            onChangeText={setNewTag}
            placeholder="bonus, dividends..."
            placeholderTextColor={isDark ? '#666' : '#999'}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { opacity: Math.abs(currencyToFloat(newTotalValue) - investment.total) > 0.01 && !saving ? 1 : 0.5 },
            ]}
            onPress={handleAddContribution}
            disabled={Math.abs(currencyToFloat(newTotalValue) - investment.total) < 0.01 || saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? t('saving', lang) : t('addContribution', lang)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Movements History */}
        <View style={styles.movementsSection}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t('movements', lang)}
          </Text>

          {movementsWithTotals.length === 0 ? (
            <View
              style={[
                styles.emptyMovements,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.emptyMovementsText, { color: isDark ? '#999' : '#666' }]}>
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
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                  },
                ]}
                onLongPress={() => handleDeleteMovement(movement)}
              >
                <View style={styles.movementHeader}>
                  <View style={styles.movementAmountRow}>
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
                  <Text style={[styles.movementDate, { color: isDark ? '#999' : '#666' }]}>
                    {formatDate(movement.date, lang)}
                  </Text>
                </View>

                {movement.tags.length > 0 && (
                  <View style={styles.tagsRow}>
                    {movement.tags.map((tag, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.tag,
                          { backgroundColor: isDark ? '#333' : '#E8E8E8' },
                        ]}
                      >
                        <Text style={[styles.tagText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={[styles.movementTotal, { color: isDark ? '#666' : '#999' }]}>
                  Total: {formatCurrency(movement.newTotal)}
                </Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  headerButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
  deltaPreview: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: '600',
  },
  emptyMovements: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  emptyMovementsText: {
    fontSize: 14,
  },
  movementCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  movementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  movementAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  movementAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  movementPercent: {
    fontSize: 14,
  },
  movementDate: {
    fontSize: 13,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
  },
  movementTotal: {
    fontSize: 12,
  },
});
