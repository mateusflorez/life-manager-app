import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useAccount } from '@/contexts/account-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function HomeScreen() {
  const { account } = useAccount();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const translations = {
    en: {
      noAccount: 'No account selected',
      welcomeBack: 'Welcome back,',
      level: 'Level',
      xp: 'XP',
      completedTasks: 'Completed tasks',
      allTime: 'All time',
    },
    pt: {
      noAccount: 'Nenhuma conta selecionada',
      welcomeBack: 'Bem-vindo de volta,',
      level: 'Nível',
      xp: 'XP',
      completedTasks: 'Tarefas concluídas',
      allTime: 'Total',
    },
  };

  const t = translations[settings.language];

  if (!account) {
    return (
      <ThemedView style={styles.container}>
        <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
          {t.noAccount}
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
        <View style={[styles.overview, { borderColor: isDark ? '#333' : '#E0E0E0' }]}>
          <View style={styles.header}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5' },
              ]}
            >
              <Text style={[styles.avatarText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {account.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={[styles.welcomeText, { color: isDark ? '#999' : '#666' }]}>
                {t.welcomeBack}
              </Text>
              <Text style={[styles.nameText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {account.name}
              </Text>
            </View>
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
                {t.completedTasks}
              </Text>
              <Text style={[styles.statValue, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {account.completedTasks}
              </Text>
              <Text style={[styles.statHint, { color: isDark ? '#666' : '#999' }]}>
                {t.allTime}
              </Text>
            </View>
          </View>
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
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  overview: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  levelCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelText: {
    fontSize: 16,
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
    borderRadius: 8,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statHint: {
    fontSize: 12,
  },
});
