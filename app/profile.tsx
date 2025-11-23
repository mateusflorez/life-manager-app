import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useAccount } from '@/contexts/account-context';
import { useBooks } from '@/contexts/books-context';
import { useFinance } from '@/contexts/finance-context';
import { useFocus } from '@/contexts/focus-context';
import { useInvestment } from '@/contexts/investment-context';
import { useSettings } from '@/contexts/settings-context';
import { useTasks } from '@/contexts/tasks-context';
import { useTraining } from '@/contexts/training-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { entries: focusEntries } = useFocus();
  const colorScheme = useColorScheme();

  const sessionsThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return sessions.filter((s) => s.date.startsWith(monthPrefix)).length;
  }, [sessions]);

  const focusMinutesThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    return focusEntries
      .filter((e) => e.date.startsWith(monthPrefix))
      .reduce((sum, e) => sum + e.durationMinutes, 0);
  }, [focusEntries]);

  const focusHoursThisMonth = Math.floor(focusMinutesThisMonth / 60);
  const focusRemainingMinutes = focusMinutesThisMonth % 60;

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
      focusTime: 'Focus Time',
      hours: 'h',
      minutes: 'min',
      xpToNext: 'XP to next level',
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
      focusTime: 'Tempo de Foco',
      hours: 'h',
      minutes: 'min',
      xpToNext: 'XP para próximo nível',
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
        <RippleBackground isDark={isDark} rippleCount={6} />
        <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
          No account
        </Text>
      </ThemedView>
    );
  }

  const level = Math.floor(account.xp / 1000);
  const currentProgress = account.xp % 1000;
  const progressPercent = Math.min(100, (currentProgress / 1000) * 100);
  const xpToNext = 1000 - currentProgress;

  // Stats configuration with gradients
  const statsConfig = [
    {
      key: 'finance',
      enabled: settings.modules?.finance !== false && monthBalance !== null,
      label: t.monthBalance,
      value: monthBalance !== null ? formatCurrency(monthBalance) : '',
      hint: t.currentMonth,
      gradient: ['#10B981', '#059669'] as [string, string],
      icon: 'dollarsign.circle.fill',
      valueColor: monthBalance !== null && monthBalance >= 0 ? '#10B981' : '#EF4444',
    },
    {
      key: 'investments',
      enabled: settings.modules?.investments !== false && portfolioTotal > 0,
      label: t.portfolioTotal,
      value: formatCurrency(portfolioTotal),
      hint: `${investments.length} ${t.investmentsCount}`,
      gradient: ['#3B82F6', '#2563EB'] as [string, string],
      icon: 'chart.line.uptrend.xyaxis',
      valueColor: '#3B82F6',
    },
    {
      key: 'tasks',
      enabled: settings.modules?.tasks !== false && todayProgress.total > 0,
      label: t.todayProgress,
      value: `${todayProgress.completed}/${todayProgress.total}`,
      hint: todayProgress.overdue > 0
        ? `${t.tasksCompleted} (${todayProgress.overdue} ${t.overdueCount})`
        : t.tasksCompleted,
      gradient: ['#F59E0B', '#D97706'] as [string, string],
      icon: 'checklist',
      valueColor: '#F59E0B',
      hasOverdue: todayProgress.overdue > 0,
    },
    {
      key: 'books',
      enabled: settings.modules?.books !== false && chaptersReadThisMonth > 0,
      label: t.chaptersRead,
      value: String(chaptersReadThisMonth),
      hint: `${t.thisMonth} (${inProgressBooks.length} ${t.booksInProgress})`,
      gradient: ['#8B5CF6', '#7C3AED'] as [string, string],
      icon: 'book.fill',
      valueColor: '#8B5CF6',
    },
    {
      key: 'training',
      enabled: settings.modules?.training !== false && sessionsThisMonth > 0,
      label: t.trainingSessions,
      value: String(sessionsThisMonth),
      hint: t.thisMonth,
      gradient: ['#22C55E', '#16A34A'] as [string, string],
      icon: 'dumbbell.fill',
      valueColor: '#22C55E',
    },
    {
      key: 'focus',
      enabled: settings.modules?.focus !== false && focusMinutesThisMonth > 0,
      label: t.focusTime,
      value: focusHoursThisMonth > 0
        ? `${focusHoursThisMonth}${t.hours} ${focusRemainingMinutes}${t.minutes}`
        : `${focusMinutesThisMonth}${t.minutes}`,
      hint: t.thisMonth,
      gradient: ['#EF4444', '#DC2626'] as [string, string],
      icon: 'clock.fill',
      valueColor: '#EF4444',
    },
  ];

  const enabledStats = statsConfig.filter((s) => s.enabled);

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={8} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarContainer}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              {account.avatar ? (
                <Image source={{ uri: account.avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {account.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </LinearGradient>
            <View style={styles.cameraOverlay}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cameraGradient}
              >
                <IconSymbol name="camera.fill" size={14} color="#FFFFFF" />
              </LinearGradient>
            </View>
          </TouchableOpacity>

          <Text style={[styles.nameText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {account.name}
          </Text>
        </View>

        {/* Level Card */}
        <View
          style={[
            styles.levelCard,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.levelHeader}>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                {t.level}
              </Text>
              <Text style={[styles.levelText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {level}
              </Text>
            </View>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.levelBadge}
            >
              <IconSymbol name="star.fill" size={20} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <View style={styles.xpSection}>
            <View style={styles.xpLabels}>
              <Text style={[styles.xpText, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                {account.xp.toLocaleString()} {t.xp}
              </Text>
              <Text style={[styles.xpText, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                {xpToNext} {t.xpToNext}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        {enabledStats.length > 0 && (
          <View style={styles.statsGrid}>
            {enabledStats.map((stat) => (
              <View
                key={stat.key}
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <View style={styles.statHeader}>
                  <LinearGradient
                    colors={stat.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statIconContainer}
                  >
                    <IconSymbol name={stat.icon as any} size={18} color="#FFFFFF" />
                  </LinearGradient>
                  <Text style={[styles.statLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                    {stat.label}
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: stat.valueColor }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statHint, { color: isDark ? '#666' : '#9CA3AF' }]}>
                  {stat.hint}
                </Text>
              </View>
            ))}
          </View>
        )}
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
    paddingTop: 60,
    gap: 24,
    paddingBottom: 40,
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
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 36,
  },
  avatarText: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraGradient: {
    width: 32,
    height: 32,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  levelCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelInfo: {
    gap: 4,
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  levelText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpSection: {
    gap: 8,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statHint: {
    fontSize: 13,
  },
});
