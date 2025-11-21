import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAccount } from '@/contexts/account-context';
import { useBooks } from '@/contexts/books-context';
import { useFinance } from '@/contexts/finance-context';
import { useInvestment } from '@/contexts/investment-context';
import { useSettings } from '@/contexts/settings-context';
import { useTasks } from '@/contexts/tasks-context';
import { useTraining } from '@/contexts/training-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const { account, updateAccount } = useAccount();
  const { settings } = useSettings();
  const { activeBankAccount, ensureMonth, getMonthSummary } = useFinance();
  const { portfolioTotal, investments } = useInvestment();
  const { todayProgress } = useTasks();
  const { chaptersReadThisMonth, inProgressBooks } = useBooks();
  const { sessions } = useTraining();
  const colorScheme = useColorScheme();

  const sessionsThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return sessions.filter((s) => s.date.startsWith(monthPrefix)).length;
  }, [sessions]);
  const isDark = colorScheme === 'dark';

  const [monthBalance, setMonthBalance] = useState<number | null>(null);

  const loadBalance = useCallback(async () => {
    if (!activeBankAccount) {
      setMonthBalance(null);
      return;
    }

    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const { financeMonth } = await ensureMonth(year, month);
      const summary = await getMonthSummary(financeMonth.id);
      setMonthBalance(summary.balance);
    } catch (error) {
      console.error('Error loading balance:', error);
      setMonthBalance(null);
    }
  }, [activeBankAccount, ensureMonth, getMonthSummary]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await updateAccount({ avatar: result.assets[0].uri });
    }
  };

  const translations = {
    en: {
      level: 'Level',
      xp: 'XP',
      monthBalance: 'Month Balance',
      currentMonth: 'Current month',
      completedTasks: 'Completed Tasks',
      allTime: 'All time',
      portfolioTotal: 'Portfolio',
      investmentsCount: 'investments',
      todayProgress: "Today's Progress",
      tasksCompleted: 'completed',
      overdueCount: 'overdue',
      changePhoto: 'Tap to change photo',
      chaptersRead: 'Chapters Read',
      thisMonth: 'This month',
      booksInProgress: 'in progress',
      trainingSessions: 'Training Sessions',
      sessionsCount: 'sessions',
    },
    pt: {
      level: 'Nível',
      xp: 'XP',
      monthBalance: 'Saldo do Mês',
      currentMonth: 'Mês atual',
      completedTasks: 'Tarefas Concluídas',
      allTime: 'Total',
      portfolioTotal: 'Portfólio',
      investmentsCount: 'investimentos',
      todayProgress: 'Progresso de Hoje',
      tasksCompleted: 'concluídas',
      overdueCount: 'atrasadas',
      changePhoto: 'Toque para mudar foto',
      chaptersRead: 'Capítulos Lidos',
      thisMonth: 'Este mês',
      booksInProgress: 'em progresso',
      trainingSessions: 'Treinos',
      sessionsCount: 'sessões',
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

  if (!account) {
    return (
      <ThemedView style={styles.container}>
        <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
          No account
        </Text>
      </ThemedView>
    );
  }

  const level = Math.floor(account.xp / 1000);
  const currentProgress = account.xp % 1000;
  const progressPercent = Math.min(100, (currentProgress / 1000) * 100);

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarContainer}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5' },
              ]}
            >
              {account.avatar ? (
                <Image source={{ uri: account.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {account.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.cameraOverlay}>
              <IconSymbol name="plus" size={20} color="#fff" />
            </View>
          </TouchableOpacity>

          <Text style={[styles.nameText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {account.name}
          </Text>
        </View>

        <View
          style={[
            styles.levelCard,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <View style={styles.levelHeader}>
            <Text style={[styles.levelText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.level} {level}
            </Text>
          </View>
          <Text style={[styles.xpText, { color: isDark ? '#999' : '#666' }]}>
            {currentProgress}/1000 {t.xp}
          </Text>

          <View style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: '#007AFF',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          {settings.modules?.finance !== false && monthBalance !== null && (
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.monthBalance}
              </Text>
              <Text
                style={[
                  styles.statValue,
                  { color: monthBalance >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {formatCurrency(monthBalance)}
              </Text>
              <Text style={[styles.statHint, { color: isDark ? '#666' : '#999' }]}>
                {t.currentMonth}
              </Text>
            </View>
          )}

          {settings.modules?.investments !== false && portfolioTotal > 0 && (
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.portfolioTotal}
              </Text>
              <Text style={[styles.statValue, { color: '#36A2EB' }]}>
                {formatCurrency(portfolioTotal)}
              </Text>
              <Text style={[styles.statHint, { color: isDark ? '#666' : '#999' }]}>
                {investments.length} {t.investmentsCount}
              </Text>
            </View>
          )}

          {settings.modules?.tasks !== false && todayProgress.total > 0 && (
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.todayProgress}
              </Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {todayProgress.completed}/{todayProgress.total}
              </Text>
              <Text style={[styles.statHint, { color: isDark ? '#666' : '#999' }]}>
                {t.tasksCompleted}
                {todayProgress.overdue > 0 && (
                  <Text style={{ color: '#EF4444' }}>
                    {' '}({todayProgress.overdue} {t.overdueCount})
                  </Text>
                )}
              </Text>
            </View>
          )}

          {settings.modules?.books !== false && chaptersReadThisMonth > 0 && (
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.chaptersRead}
              </Text>
              <Text style={[styles.statValue, { color: '#6C5CE7' }]}>
                {chaptersReadThisMonth}
              </Text>
              <Text style={[styles.statHint, { color: isDark ? '#666' : '#999' }]}>
                {t.thisMonth} ({inProgressBooks.length} {t.booksInProgress})
              </Text>
            </View>
          )}

          {settings.modules?.training !== false && sessionsThisMonth > 0 && (
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: isDark ? '#999' : '#666' }]}>
                {t.trainingSessions}
              </Text>
              <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                {sessionsThisMonth}
              </Text>
              <Text style={[styles.statHint, { color: isDark ? '#666' : '#999' }]}>
                {t.thisMonth}
              </Text>
            </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  profileSection: {
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  levelCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelText: {
    fontSize: 18,
    fontWeight: '600',
  },
  xpText: {
    fontSize: 14,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statHint: {
    fontSize: 12,
  },
});
