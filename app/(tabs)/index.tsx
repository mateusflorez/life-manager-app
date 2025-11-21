import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useAccount } from '@/contexts/account-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

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
      finance: 'Finance',
      financeDesc: 'Track your expenses',
      investments: 'Investments',
      investmentsDesc: 'Track your portfolio',
      tasks: 'Tasks',
      tasksDesc: 'Manage your to-dos',
    },
    pt: {
      noAccount: 'Nenhuma conta selecionada',
      welcomeBack: 'Bem-vindo de volta,',
      level: 'Nível',
      finance: 'Finanças',
      financeDesc: 'Controle seus gastos',
      investments: 'Investimentos',
      investmentsDesc: 'Acompanhe seu portfólio',
      tasks: 'Tarefas',
      tasksDesc: 'Gerencie suas tarefas',
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={[styles.profileHeader, { borderColor: isDark ? '#333' : '#E0E0E0' }]}
          onPress={() => router.push('/profile')}
          activeOpacity={0.7}
        >
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

          <View style={styles.headerInfo}>
            <Text style={[styles.welcomeText, { color: isDark ? '#999' : '#666' }]}>
              {t.welcomeBack}
            </Text>
            <Text style={[styles.nameText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {account.name}
            </Text>
            <Text style={[styles.levelText, { color: isDark ? '#007AFF' : '#007AFF' }]}>
              {t.level} {level}
            </Text>
          </View>

          <IconSymbol name="chevron.right" size={20} color={isDark ? '#666' : '#999'} />
        </TouchableOpacity>

        {(settings.modules?.finance !== false || settings.modules?.investments !== false || settings.modules?.tasks !== false) && (
          <View style={styles.modulesGrid}>
            {settings.modules?.finance !== false && (
              <TouchableOpacity
                style={[
                  styles.moduleCard,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                  },
                ]}
                onPress={() => router.push('/finance')}
                activeOpacity={0.7}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#10B981' }]}>
                  <IconSymbol name="dollarsign.circle.fill" size={28} color="#fff" />
                </View>
                <Text style={[styles.moduleTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {t.finance}
                </Text>
                <Text style={[styles.moduleDesc, { color: isDark ? '#999' : '#666' }]}>
                  {t.financeDesc}
                </Text>
              </TouchableOpacity>
            )}

            {settings.modules?.investments !== false && (
              <TouchableOpacity
                style={[
                  styles.moduleCard,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                  },
                ]}
                onPress={() => router.push('/investments')}
                activeOpacity={0.7}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#36A2EB' }]}>
                  <IconSymbol name="chart.line.uptrend.xyaxis" size={28} color="#fff" />
                </View>
                <Text style={[styles.moduleTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {t.investments}
                </Text>
                <Text style={[styles.moduleDesc, { color: isDark ? '#999' : '#666' }]}>
                  {t.investmentsDesc}
                </Text>
              </TouchableOpacity>
            )}

            {settings.modules?.tasks !== false && (
              <TouchableOpacity
                style={[
                  styles.moduleCard,
                  {
                    backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                  },
                ]}
                onPress={() => router.push('/tasks')}
                activeOpacity={0.7}
              >
                <View style={[styles.moduleIcon, { backgroundColor: '#F59E0B' }]}>
                  <IconSymbol name="checklist" size={28} color="#fff" />
                </View>
                <Text style={[styles.moduleTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                  {t.tasks}
                </Text>
                <Text style={[styles.moduleDesc, { color: isDark ? '#999' : '#666' }]}>
                  {t.tasksDesc}
                </Text>
              </TouchableOpacity>
            )}
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
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  welcomeText: {
    fontSize: 13,
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moduleCard: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  moduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  moduleDesc: {
    fontSize: 13,
  },
});
