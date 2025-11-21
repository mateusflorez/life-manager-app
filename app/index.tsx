import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { AccountForm } from '@/components/account-form';
import { useRouter } from 'expo-router';
import { accountStorage } from '@/services/account-storage';
import { type Account } from '@/types/account';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccount } from '@/contexts/account-context';
import { useSettings } from '@/contexts/settings-context';
import { RippleBackground } from '@/components/ui/ripple-background';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function WelcomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setAccount } = useAccount();
  const { settings } = useSettings();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const translations = {
    en: {
      title: 'Life Manager',
      subtitle: 'Your personal life organizer',
      subtitleCreate: 'Create your first account',
      selectAccount: 'Select your account',
      createNew: 'Create new account',
      deleteTitle: 'Delete Account',
      deleteMessage: (name: string) =>
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      cancel: 'Cancel',
      delete: 'Delete',
      created: 'Created',
      level: 'Level',
      xp: 'XP',
    },
    pt: {
      title: 'Life Manager',
      subtitle: 'Seu organizador pessoal',
      subtitleCreate: 'Crie sua primeira conta',
      selectAccount: 'Selecione sua conta',
      createNew: 'Criar nova conta',
      deleteTitle: 'Excluir Conta',
      deleteMessage: (name: string) =>
        `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
      cancel: 'Cancelar',
      delete: 'Excluir',
      created: 'Criada em',
      level: 'Nível',
      xp: 'XP',
    },
  };

  const t = translations[settings.language];

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const loadedAccounts = await accountStorage.getAccounts();
      setAccounts(loadedAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (name: string) => {
    try {
      const newAccount = await accountStorage.saveAccount(name);
      await setAccount(newAccount);
      setAccounts([...accounts, newAccount]);
      setShowCreateForm(false);
      router.push('/(tabs)');
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleSelectAccount = async (account: Account) => {
    try {
      await setAccount(account);
      router.push('/(tabs)');
    } catch (error) {
      console.error('Failed to select account:', error);
    }
  };

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    Alert.alert(
      t.deleteTitle,
      t.deleteMessage(accountName),
      [
        {
          text: t.cancel,
          style: 'cancel',
        },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await accountStorage.deleteAccount(accountId);
              const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
              setAccounts(updatedAccounts);
            } catch (error) {
              console.error('Failed to delete account:', error);
            }
          },
        },
      ]
    );
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

  if (showCreateForm || accounts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <IconSymbol name="sparkles" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.title}
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
              {accounts.length === 0 ? t.subtitle : t.subtitleCreate}
            </Text>
          </View>

          {/* Form Card */}
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <AccountForm
              onSubmit={handleCreateAccount}
              onCancel={accounts.length > 0 ? () => setShowCreateForm(false) : undefined}
            />
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={8} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoContainer}
          >
            <IconSymbol name="sparkles" size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {t.title}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
            {t.selectAccount}
          </Text>
        </View>

        {/* Accounts List */}
        <View style={styles.accountsList}>
          {accounts.map((account) => {
            const level = Math.floor(account.xp / 1000);
            return (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
                onPress={() => handleSelectAccount(account)}
                activeOpacity={0.8}
              >
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

                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {account.name}
                  </Text>
                  <View style={styles.accountMeta}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>{t.level} {level}</Text>
                    </View>
                    <Text style={[styles.xpText, { color: isDark ? '#808080' : '#9CA3AF' }]}>
                      {account.xp.toLocaleString()} {t.xp}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAccount(account.id, account.name)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <IconSymbol name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {/* Create New Account Button */}
          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
                borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
              },
            ]}
            onPress={() => setShowCreateForm(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.createIconContainer}
            >
              <IconSymbol name="plus" size={20} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.createButtonText}>{t.createNew}</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  formCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  accountsList: {
    width: '100%',
    gap: 12,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountInfo: {
    flex: 1,
    gap: 6,
  },
  accountName: {
    fontSize: 17,
    fontWeight: '600',
  },
  accountMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  xpText: {
    fontSize: 13,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: 12,
    marginTop: 8,
  },
  createIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
});
