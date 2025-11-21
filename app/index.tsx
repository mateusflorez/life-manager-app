import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { AccountForm } from '@/components/account-form';
import { useRouter } from 'expo-router';
import { accountStorage } from '@/services/account-storage';
import { type Account } from '@/types/account';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAccount } from '@/contexts/account-context';
import { useSettings } from '@/contexts/settings-context';

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
      subtitle: 'Your manager to make life easier',
      subtitleCreate: 'Create a new account',
      selectAccount: 'Select your account',
      createNew: '+ Create new account',
      deleteTitle: 'Delete Account',
      deleteMessage: (name: string) =>
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      cancel: 'Cancel',
      delete: 'Delete',
      created: 'Created',
    },
    pt: {
      title: 'Life Manager',
      subtitle: 'Seu gerenciador para facilitar a vida',
      subtitleCreate: 'Criar uma nova conta',
      selectAccount: 'Selecione sua conta',
      createNew: '+ Criar nova conta',
      deleteTitle: 'Excluir Conta',
      deleteMessage: (name: string) =>
        `Tem certeza que deseja excluir "${name}"? Esta ação não pode ser desfeita.`,
      cancel: 'Cancelar',
      delete: 'Excluir',
      created: 'Criada em',
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
        <ActivityIndicator size="large" color="#007AFF" />
      </ThemedView>
    );
  }

  if (showCreateForm || accounts.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t.title}</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#999' : '#666' }]}>
            {accounts.length === 0 ? t.subtitle : t.subtitleCreate}
          </Text>

          <AccountForm
            onSubmit={handleCreateAccount}
            onCancel={accounts.length > 0 ? () => setShowCreateForm(false) : undefined}
          />
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#999' : '#666' }]}>
          {t.selectAccount}
        </Text>

        <View style={styles.accountsList}>
          {accounts.map((account) => (
            <View
              key={account.id}
              style={[
                styles.accountCard,
                {
                  backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
            >
              <TouchableOpacity
                style={styles.accountContent}
                onPress={() => handleSelectAccount(account)}
              >
                <Text
                  style={[styles.accountName, { color: isDark ? '#ECEDEE' : '#11181C' }]}
                >
                  {account.name}
                </Text>
                <Text style={styles.accountDate}>
                  {t.created} {new Date(account.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteAccount(account.id, account.name)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.createNewButton]}
            onPress={() => setShowCreateForm(true)}
          >
            <Text style={styles.createNewButtonText}>{t.createNew}</Text>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
  },
  accountsList: {
    width: '100%',
    gap: 12,
  },
  accountCard: {
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accountContent: {
    flex: 1,
    padding: 20,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountDate: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    width: 48,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  createNewButton: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  createNewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
});
