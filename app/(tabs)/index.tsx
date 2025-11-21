import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { useAccount } from '@/contexts/account-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';

export default function HomeScreen() {
  const { account } = useAccount();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const translations = {
    en: {
      noAccount: 'No account selected',
      welcomeBack: 'Welcome back,',
      level: 'Level',
      xpToNext: 'XP to next level',
      finance: 'Finance',
      financeDesc: 'Track your expenses',
      investments: 'Investments',
      investmentsDesc: 'Track your portfolio',
      tasks: 'Tasks',
      tasksDesc: 'Manage your to-dos',
      books: 'Books',
      booksDesc: 'Track your reading',
      mood: 'Mood',
      moodDesc: 'Track your feelings',
      training: 'Training',
      trainingDesc: 'Log your workouts',
      focus: 'Focus',
      focusDesc: 'Stay concentrated',
      modules: 'Modules',
    },
    pt: {
      noAccount: 'Nenhuma conta selecionada',
      welcomeBack: 'Bem-vindo de volta,',
      level: 'Nível',
      xpToNext: 'XP para próximo nível',
      finance: 'Finanças',
      financeDesc: 'Controle seus gastos',
      investments: 'Investimentos',
      investmentsDesc: 'Acompanhe seu portfólio',
      tasks: 'Tarefas',
      tasksDesc: 'Gerencie suas tarefas',
      books: 'Livros',
      booksDesc: 'Acompanhe sua leitura',
      mood: 'Humor',
      moodDesc: 'Registre seus sentimentos',
      training: 'Treino',
      trainingDesc: 'Registre seus treinos',
      focus: 'Foco',
      focusDesc: 'Mantenha a concentração',
      modules: 'Módulos',
    },
  };

  const t = translations[settings.language];

  if (!account) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} />
        <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
          {t.noAccount}
        </Text>
      </ThemedView>
    );
  }

  const level = Math.floor(account.xp / 1000);
  const xpProgress = (account.xp % 1000) / 1000;
  const xpToNext = 1000 - (account.xp % 1000);

  const modules = [
    {
      key: 'finance',
      title: t.finance,
      desc: t.financeDesc,
      icon: 'dollarsign.circle.fill',
      gradient: ['#10B981', '#059669'],
      route: '/finance',
    },
    {
      key: 'investments',
      title: t.investments,
      desc: t.investmentsDesc,
      icon: 'chart.line.uptrend.xyaxis',
      gradient: ['#3B82F6', '#2563EB'],
      route: '/investments',
    },
    {
      key: 'tasks',
      title: t.tasks,
      desc: t.tasksDesc,
      icon: 'checklist',
      gradient: ['#F59E0B', '#D97706'],
      route: '/tasks',
    },
    {
      key: 'books',
      title: t.books,
      desc: t.booksDesc,
      icon: 'book.fill',
      gradient: ['#8B5CF6', '#7C3AED'],
      route: '/books',
    },
    {
      key: 'mood',
      title: t.mood,
      desc: t.moodDesc,
      icon: 'face.smiling.fill',
      gradient: ['#FBBF24', '#F59E0B'],
      route: '/mood',
    },
    {
      key: 'training',
      title: t.training,
      desc: t.trainingDesc,
      icon: 'dumbbell.fill',
      gradient: ['#22C55E', '#16A34A'],
      route: '/training',
    },
    {
      key: 'focus',
      title: t.focus,
      desc: t.focusDesc,
      icon: 'clock.fill',
      gradient: ['#EF4444', '#DC2626'],
      route: '/focus',
    },
  ];

  const enabledModules = modules.filter(
    (m) => settings.modules?.[m.key as keyof typeof settings.modules] !== false
  );

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={8} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <TouchableOpacity
          onPress={() => router.push('/profile')}
          activeOpacity={0.9}
        >
          <View
            style={[
              styles.profileCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <View style={styles.profileTop}>
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

              <View style={styles.profileInfo}>
                <Text style={[styles.welcomeText, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.welcomeBack}
                </Text>
                <Text style={[styles.nameText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {account.name}
                </Text>
              </View>

              <View style={styles.levelBadge}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.levelGradient}
                >
                  <Text style={styles.levelNumber}>{level}</Text>
                </LinearGradient>
                <Text style={[styles.levelLabel, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {t.level}
                </Text>
              </View>
            </View>

            {/* XP Progress Bar */}
            <View style={styles.xpSection}>
              <View style={styles.xpLabels}>
                <Text style={[styles.xpText, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                  {account.xp.toLocaleString()} XP
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
                  style={[styles.progressFill, { width: `${xpProgress * 100}%` }]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Modules Section */}
        {enabledModules.length > 0 && (
          <View style={styles.modulesSection}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.modules}
            </Text>

            <View style={styles.modulesGrid}>
              {enabledModules.map((module, index) => (
                <TouchableOpacity
                  key={module.key}
                  style={[
                    styles.moduleCard,
                    {
                      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  ]}
                  onPress={() => router.push(module.route as any)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={module.gradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.moduleIconContainer}
                  >
                    <IconSymbol name={module.icon as any} size={24} color="#fff" />
                  </LinearGradient>

                  <View style={styles.moduleTextContainer}>
                    <Text style={[styles.moduleTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {module.title}
                    </Text>
                    <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                      {module.desc}
                    </Text>
                  </View>

                  <IconSymbol
                    name="chevron.right"
                    size={16}
                    color={isDark ? '#4B5563' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              ))}
            </View>
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
  profileCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 22,
    fontWeight: '700',
  },
  levelBadge: {
    alignItems: 'center',
    gap: 4,
  },
  levelGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  xpSection: {
    marginTop: 20,
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
  modulesSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 4,
  },
  modulesGrid: {
    gap: 12,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  moduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTextContainer: {
    flex: 1,
    gap: 2,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  moduleDesc: {
    fontSize: 13,
  },
});
