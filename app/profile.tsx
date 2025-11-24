import { ThemedView } from '@/components/themed-view';
import { FlavoredMarkdown } from '@/components/ui/flavored-markdown';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBirthDate, setEditBirthDate] = useState<Date | null>(null);
  const [editBio, setEditBio] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const calculateAge = useCallback((birthDateStr: string) => {
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  const handleOpenEditModal = useCallback(() => {
    if (account) {
      setEditName(account.name);
      setEditBirthDate(account.birthDate ? new Date(account.birthDate) : null);
      setEditBio(account.bio || '');
      setShowEditModal(true);
    }
  }, [account]);

  const handleSaveProfile = async () => {
    if (!editName.trim()) return;

    await updateAccount({
      name: editName.trim(),
      birthDate: editBirthDate ? editBirthDate.toISOString().split('T')[0] : undefined,
      bio: editBio.trim() || undefined,
    });
    setShowEditModal(false);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setEditBirthDate(selectedDate);
    }
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString(settings.language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

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
      editProfile: 'Edit Profile',
      name: 'Name',
      namePlaceholder: 'Enter your name',
      birthDate: 'Birth Date',
      birthDatePlaceholder: 'Select your birth date (optional)',
      bio: 'Bio',
      bioPlaceholder: 'Write something about yourself...',
      bioHelp: 'Supports Anilist-style markdown: __bold__, _italic_, ~~strikethrough~~, <center>, img(url), img500(url)',
      save: 'Save',
      cancel: 'Cancel',
      yearsOld: 'years old',
      clearDate: 'Clear',
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
      editProfile: 'Editar Perfil',
      name: 'Nome',
      namePlaceholder: 'Digite seu nome',
      birthDate: 'Data de Nascimento',
      birthDatePlaceholder: 'Selecione sua data de nascimento (opcional)',
      bio: 'Bio',
      bioPlaceholder: 'Escreva algo sobre você...',
      bioHelp: 'Suporta markdown estilo Anilist: __negrito__, _itálico_, ~~riscado~~, <center>, img(url), img500(url)',
      save: 'Salvar',
      cancel: 'Cancelar',
      yearsOld: 'anos',
      clearDate: 'Limpar',
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

          <View style={styles.nameSection}>
            <Text style={[styles.nameText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {account.name}
            </Text>
            {account.birthDate && (
              <Text style={[styles.ageText, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                {calculateAge(account.birthDate)} {t.yearsOld}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleOpenEditModal}
            style={[styles.editButton, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)' }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="pencil" size={16} color="#6366F1" />
            <Text style={styles.editButtonText}>{t.editProfile}</Text>
          </TouchableOpacity>
        </View>

        {/* Bio Section */}
        {account.bio && (
          <View
            style={[
              styles.bioCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <FlavoredMarkdown content={account.bio} isDark={isDark} />
          </View>
        )}

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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.editProfile}
              </Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.name}
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder={t.namePlaceholder}
                  placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                />
              </View>

              {/* Birth Date Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.birthDate}
                </Text>
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    style={[
                      styles.dateButton,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="calendar" size={18} color="#6366F1" />
                    <Text style={[styles.dateText, { color: editBirthDate ? (isDark ? '#FFFFFF' : '#111827') : (isDark ? '#666' : '#9CA3AF') }]}>
                      {editBirthDate ? formatDateDisplay(editBirthDate) : t.birthDatePlaceholder}
                    </Text>
                  </TouchableOpacity>
                  {editBirthDate && (
                    <TouchableOpacity
                      style={[styles.clearDateButton, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)' }]}
                      onPress={() => setEditBirthDate(null)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol name="xmark" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
                {showDatePicker && (
                  <DateTimePicker
                    value={editBirthDate || new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}
                {Platform.OS === 'ios' && showDatePicker && (
                  <TouchableOpacity
                    style={styles.iosDateDone}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.iosDateDoneGradient}
                    >
                      <Text style={styles.iosDateDoneText}>OK</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>

              {/* Bio Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.bio}
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      color: isDark ? '#FFFFFF' : '#111827',
                    },
                  ]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder={t.bioPlaceholder}
                  placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <Text style={[styles.inputHint, { color: isDark ? '#666' : '#9CA3AF' }]}>
                  {t.bioHelp}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { opacity: editName.trim() ? 1 : 0.5 }]}
                onPress={handleSaveProfile}
                disabled={!editName.trim()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>{t.save}</Text>
                </LinearGradient>
              </TouchableOpacity>
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
  nameSection: {
    alignItems: 'center',
    gap: 4,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  ageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  bioCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalScroll: {
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    flex: 1,
    fontSize: 15,
  },
  clearDateButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosDateDone: {
    alignSelf: 'center',
    marginTop: 10,
  },
  iosDateDoneGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  iosDateDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
