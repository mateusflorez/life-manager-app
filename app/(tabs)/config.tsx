import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { CurrencyInput, currencyToFloat, floatToCurrency } from '@/components/ui/currency-input';
import { useAlert } from '@/contexts/alert-context';
import { useSettings } from '@/contexts/settings-context';
import { useAccount } from '@/contexts/account-context';
import { useFinance } from '@/contexts/finance-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getDataStats, importData, saveExportedData } from '@/services/data-export';
import { type Currency, type Language, type ModulesConfig, type ThemeMode } from '@/types/settings';
import { getAccountGradient } from '@/types/finance';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Module configuration with icons and gradients
const MODULE_CONFIG = {
  finance: {
    icon: 'dollarsign.circle.fill',
    gradient: ['#10B981', '#059669'] as [string, string],
  },
  investments: {
    icon: 'chart.line.uptrend.xyaxis',
    gradient: ['#3B82F6', '#2563EB'] as [string, string],
  },
  tasks: {
    icon: 'checklist',
    gradient: ['#F59E0B', '#D97706'] as [string, string],
  },
  books: {
    icon: 'book.fill',
    gradient: ['#8B5CF6', '#7C3AED'] as [string, string],
  },
  mood: {
    icon: 'face.smiling.fill',
    gradient: ['#FBBF24', '#F59E0B'] as [string, string],
  },
  training: {
    icon: 'dumbbell.fill',
    gradient: ['#22C55E', '#16A34A'] as [string, string],
  },
  focus: {
    icon: 'clock.fill',
    gradient: ['#EF4444', '#DC2626'] as [string, string],
  },
};

export default function ConfigScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings, updateSettings } = useSettings();
  const { account } = useAccount();
  const { bankAccounts, updateBankAccount } = useFinance();
  const { showToast, showConfirm } = useAlert();

  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dataStats, setDataStats] = useState<{ keys: number; sizeKB: number }>({ keys: 0, sizeKB: 0 });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [salaryValues, setSalaryValues] = useState<Record<string, string>>({});
  const [savingAccountId, setSavingAccountId] = useState<string | null>(null);
  const [showReleaseNotesModal, setShowReleaseNotesModal] = useState(false);

  useEffect(() => {
    loadDataStats();
  }, []);

  useEffect(() => {
    const values: Record<string, string> = {};
    bankAccounts.forEach((acc) => {
      values[acc.id] = floatToCurrency(acc.salary ?? 0);
    });
    setSalaryValues(values);
  }, [bankAccounts]);

  const loadDataStats = async () => {
    const stats = await getDataStats();
    setDataStats(stats);
  };

  const handleLanguageChange = async (language: Language) => {
    try {
      await updateSettings({ language });
      setShowLanguageModal(false);
      setSaveStatus(language === 'pt' ? 'Idioma atualizado!' : 'Language updated!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to update language:', error);
      setSaveStatus(language === 'pt' ? 'Erro ao salvar' : 'Failed to save');
    }
  };

  const handleCurrencyChange = async (currency: Currency) => {
    try {
      await updateSettings({ currency });
      setShowCurrencyModal(false);
      setSaveStatus(
        settings.language === 'pt' ? 'Moeda atualizada!' : 'Currency updated!'
      );
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to update currency:', error);
      setSaveStatus(
        settings.language === 'pt' ? 'Erro ao salvar' : 'Failed to save'
      );
    }
  };

  const handleThemeChange = async (theme: ThemeMode) => {
    try {
      await updateSettings({ theme });
      setShowThemeModal(false);
      setSaveStatus(
        settings.language === 'pt' ? 'Tema atualizado!' : 'Theme updated!'
      );
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to update theme:', error);
      setSaveStatus(
        settings.language === 'pt' ? 'Erro ao salvar' : 'Failed to save'
      );
    }
  };

  const handleSalarySave = async (accountId: string) => {
    const bankAccount = bankAccounts.find((acc) => acc.id === accountId);
    if (!bankAccount) return;

    const salaryFloat = currencyToFloat(salaryValues[accountId] || '0');
    if (salaryFloat === (bankAccount.salary ?? 0)) return;

    setSavingAccountId(accountId);
    try {
      await updateBankAccount({ ...bankAccount, salary: salaryFloat });
      setSaveStatus(
        settings.language === 'pt' ? 'Salário atualizado!' : 'Salary updated!'
      );
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to update salary:', error);
      setSaveStatus(
        settings.language === 'pt' ? 'Erro ao salvar' : 'Failed to save'
      );
    } finally {
      setSavingAccountId(null);
    }
  };

  const handleSalaryChange = (accountId: string, value: string) => {
    setSalaryValues((prev) => ({ ...prev, [accountId]: value }));
  };

  const handleModuleToggle = async (module: keyof ModulesConfig, enabled: boolean) => {
    try {
      const updatedModules = { ...settings.modules, [module]: enabled };
      await updateSettings({ modules: updatedModules });
      setSaveStatus(
        settings.language === 'pt' ? 'Módulo atualizado!' : 'Module updated!'
      );
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Failed to update module:', error);
      setSaveStatus(
        settings.language === 'pt' ? 'Erro ao salvar' : 'Failed to save'
      );
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await saveExportedData();
      if (result.success) {
        showToast({
          message: settings.language === 'pt'
            ? 'Backup salvo com sucesso!'
            : 'Backup saved successfully!',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Failed to export:', error);
      showToast({
        message: settings.language === 'pt'
          ? 'Falha ao exportar dados. Tente novamente.'
          : 'Failed to export data. Please try again.',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    showConfirm({
      title: settings.language === 'pt' ? 'Importar Dados' : 'Import Data',
      message: settings.language === 'pt'
        ? 'Isso substituirá todos os dados existentes. Deseja continuar?'
        : 'This will replace all existing data. Do you want to continue?',
      buttons: [
        {
          text: settings.language === 'pt' ? 'Cancelar' : 'Cancel',
          style: 'cancel',
        },
        {
          text: settings.language === 'pt' ? 'Importar' : 'Import',
          style: 'destructive',
          onPress: async () => {
            setIsImporting(true);
            try {
              const result = await importData();
              if (result.success) {
                await loadDataStats();
                showToast({
                  message: settings.language === 'pt'
                    ? `${result.keysImported} itens importados. Reinicie o app para ver as mudanças.`
                    : `${result.keysImported} items imported. Restart the app to see changes.`,
                  type: 'success',
                  duration: 5000,
                });
              }
            } catch (error) {
              console.error('Failed to import:', error);
              showToast({
                message: settings.language === 'pt'
                  ? 'Falha ao importar dados. Verifique se o arquivo é válido.'
                  : 'Failed to import data. Please check if the file is valid.',
                type: 'error',
              });
            } finally {
              setIsImporting(false);
            }
          },
        },
      ],
    });
  };

  const translations = {
    en: {
      title: 'Settings',
      languageLabel: 'Language',
      currencyLabel: 'Currency',
      themeLabel: 'Theme',
      languageHelp: 'Choose your preferred UI language',
      currencyHelp: 'Choose your preferred currency',
      themeHelp: 'Choose your preferred appearance',
      selectLanguage: 'Select Language',
      selectCurrency: 'Select Currency',
      selectTheme: 'Select Theme',
      english: 'English',
      englishDesc: 'Use English for the interface',
      portuguese: 'Português',
      portugueseDesc: 'Use Portuguese for the interface',
      usd: 'US Dollar',
      usdDesc: 'Display values in USD ($)',
      brl: 'Brazilian Real',
      brlDesc: 'Display values in BRL (R$)',
      themeLight: 'Light',
      themeLightDesc: 'Always use light mode',
      themeDark: 'Dark',
      themeDarkDesc: 'Always use dark mode',
      themeSystem: 'System',
      themeSystemDesc: 'Follow system settings',
      modulesTitle: 'Modules',
      modulesHelp: 'Enable or disable app modules. Disabling a module hides it from the home screen but keeps your data.',
      financeModule: 'Finance',
      financeModuleDesc: 'Track expenses, income, and credit cards',
      investmentsModule: 'Investments',
      investmentsModuleDesc: 'Track your investments and contributions',
      tasksModule: 'Tasks',
      tasksModuleDesc: 'Manage your to-dos and recurring tasks',
      booksModule: 'Books',
      booksModuleDesc: 'Track your reading progress and reviews',
      moodModule: 'Mood',
      moodModuleDesc: 'Track your daily mood and emotional patterns',
      trainingModule: 'Training',
      trainingModuleDesc: 'Log your workouts and track progress',
      focusModule: 'Focus',
      focusModuleDesc: 'Stay concentrated with timers',
      dataTitle: 'Data Management',
      dataHelp: 'Export your data to backup or transfer to another device. Import to restore from a backup.',
      exportData: 'Export Data',
      exportDataDesc: 'Save backup to your device',
      importData: 'Import Data',
      importDataDesc: 'Restore from backup file',
      dataStats: 'items stored',
      exporting: 'Exporting...',
      importing: 'Importing...',
      salaryLabel: 'Monthly Salary',
      salaryHelp: 'Set salary per bank account. It will be auto-added as income when creating a new finance month.',
      salaryPlaceholder: 'Enter your monthly salary',
      saveSalary: 'Save',
      saving: 'Saving...',
      noAccounts: 'No bank accounts yet. Create one in the Finance module.',
      releaseNotes: 'Release Notes',
      version: 'Version',
    },
    pt: {
      title: 'Configurações',
      languageLabel: 'Idioma',
      currencyLabel: 'Moeda',
      themeLabel: 'Tema',
      languageHelp: 'Escolha seu idioma preferido',
      currencyHelp: 'Escolha sua moeda preferida',
      themeHelp: 'Escolha a aparência do app',
      selectLanguage: 'Selecionar Idioma',
      selectCurrency: 'Selecionar Moeda',
      selectTheme: 'Selecionar Tema',
      english: 'English',
      englishDesc: 'Usar inglês na interface',
      portuguese: 'Português',
      portugueseDesc: 'Usar português na interface',
      usd: 'Dólar Americano',
      usdDesc: 'Exibir valores em USD ($)',
      brl: 'Real Brasileiro',
      brlDesc: 'Exibir valores em BRL (R$)',
      themeLight: 'Claro',
      themeLightDesc: 'Sempre usar modo claro',
      themeDark: 'Escuro',
      themeDarkDesc: 'Sempre usar modo escuro',
      themeSystem: 'Sistema',
      themeSystemDesc: 'Seguir configuração do sistema',
      modulesTitle: 'Módulos',
      modulesHelp: 'Habilite ou desabilite módulos do app. Desabilitar um módulo oculta ele da tela inicial mas mantém seus dados.',
      financeModule: 'Finanças',
      financeModuleDesc: 'Controle gastos, receitas e cartões',
      investmentsModule: 'Investimentos',
      investmentsModuleDesc: 'Acompanhe seus investimentos e aportes',
      tasksModule: 'Tarefas',
      tasksModuleDesc: 'Gerencie suas tarefas e rotinas',
      booksModule: 'Livros',
      booksModuleDesc: 'Acompanhe sua leitura e resenhas',
      moodModule: 'Humor',
      moodModuleDesc: 'Registre seu humor diário e padrões emocionais',
      trainingModule: 'Treino',
      trainingModuleDesc: 'Registre seus treinos e acompanhe seu progresso',
      focusModule: 'Foco',
      focusModuleDesc: 'Mantenha a concentração com timers',
      dataTitle: 'Gerenciamento de Dados',
      dataHelp: 'Exporte seus dados para backup ou transferência para outro dispositivo. Importe para restaurar de um backup.',
      exportData: 'Exportar Dados',
      exportDataDesc: 'Salvar backup no dispositivo',
      importData: 'Importar Dados',
      importDataDesc: 'Restaurar de arquivo de backup',
      dataStats: 'itens armazenados',
      exporting: 'Exportando...',
      importing: 'Importando...',
      salaryLabel: 'Salário Mensal',
      salaryHelp: 'Defina o salário por conta bancária. Será adicionado automaticamente como receita ao criar um novo mês financeiro.',
      salaryPlaceholder: 'Digite seu salário mensal',
      saveSalary: 'Salvar',
      saving: 'Salvando...',
      noAccounts: 'Nenhuma conta bancária ainda. Crie uma no módulo de Finanças.',
      releaseNotes: 'Notas de Versão',
      version: 'Versão',
    },
  };

  const t = translations[settings.language];

  // Module list configuration
  const modules: {
    key: keyof ModulesConfig;
    name: string;
    desc: string;
    isLast?: boolean;
  }[] = [
    { key: 'finance', name: t.financeModule, desc: t.financeModuleDesc },
    { key: 'investments', name: t.investmentsModule, desc: t.investmentsModuleDesc },
    { key: 'tasks', name: t.tasksModule, desc: t.tasksModuleDesc },
    { key: 'books', name: t.booksModule, desc: t.booksModuleDesc },
    { key: 'mood', name: t.moodModule, desc: t.moodModuleDesc },
    { key: 'training', name: t.trainingModule, desc: t.trainingModuleDesc },
    { key: 'focus', name: t.focusModule, desc: t.focusModuleDesc, isLast: true },
  ];

  const getLanguageDisplay = () => {
    return settings.language === 'en' ? 'English' : 'Português';
  };

  const getCurrencyDisplay = () => {
    return settings.currency === 'USD' ? 'Dollar ($)' : 'Real (R$)';
  };

  const getThemeDisplay = () => {
    const theme = settings.theme ?? 'system';
    if (theme === 'light') return t.themeLight;
    if (theme === 'dark') return t.themeDark;
    return t.themeSystem;
  };

  const getThemeIcon = () => {
    const theme = settings.theme ?? 'system';
    if (theme === 'light') return 'sun.max.fill';
    if (theme === 'dark') return 'moon.fill';
    return 'circle.lefthalf.filled';
  };

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          {t.title}
        </Text>

        {/* Language Section */}
        <View
          style={[
            styles.card,
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
              <IconSymbol name="globe" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.languageLabel}
              </Text>
              <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.languageHelp}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.selector,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              },
            ]}
            onPress={() => setShowLanguageModal(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectorIcon}
            >
              <Text style={styles.selectorEmoji}>{settings.language === 'en' ? '🇺🇸' : '🇧🇷'}</Text>
            </LinearGradient>
            <Text style={[styles.selectorText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {getLanguageDisplay()}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={isDark ? '#808080' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* Currency Section */}
        <View
          style={[
            styles.card,
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
              <IconSymbol name="dollarsign.circle.fill" size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.currencyLabel}
              </Text>
              <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.currencyHelp}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.selector,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              },
            ]}
            onPress={() => setShowCurrencyModal(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectorIcon}
            >
              <Text style={styles.selectorEmoji}>{settings.currency === 'USD' ? '$' : 'R$'}</Text>
            </LinearGradient>
            <Text style={[styles.selectorText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {getCurrencyDisplay()}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={isDark ? '#808080' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* Theme Section */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconContainer}
            >
              <IconSymbol name={getThemeIcon() as any} size={18} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.themeLabel}
              </Text>
              <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.themeHelp}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.selector,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
              },
            ]}
            onPress={() => setShowThemeModal(true)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.selectorIcon}
            >
              <IconSymbol name={getThemeIcon() as any} size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.selectorText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {getThemeDisplay()}
            </Text>
            <IconSymbol name="chevron.right" size={16} color={isDark ? '#808080' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* Salary Section */}
        {account && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconContainer}
              >
                <IconSymbol name="banknote.fill" size={18} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.salaryLabel}
                </Text>
                <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.salaryHelp}
                </Text>
              </View>
            </View>

            {bankAccounts.length === 0 ? (
              <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280', textAlign: 'center', paddingVertical: 12 }]}>
                {t.noAccounts}
              </Text>
            ) : (
              bankAccounts.map((bankAccount, index) => (
                <View
                  key={bankAccount.id}
                  style={[
                    styles.salaryAccountItem,
                    index < bankAccounts.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <View style={styles.salaryAccountHeader}>
                    <LinearGradient
                      colors={getAccountGradient(bankAccount.color)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.salaryAccountIcon}
                    >
                      <IconSymbol name={bankAccount.icon || 'building.columns'} size={14} color="#FFFFFF" />
                    </LinearGradient>
                    <Text style={[styles.salaryAccountName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {bankAccount.name}
                    </Text>
                  </View>
                  <View style={styles.salaryInputRow}>
                    <CurrencyInput
                      value={salaryValues[bankAccount.id] || '0'}
                      onChangeValue={(value) => handleSalaryChange(bankAccount.id, value)}
                      currency={settings.currency}
                      containerStyle={[
                        styles.salaryInput,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                        },
                      ]}
                      textColor={isDark ? '#FFFFFF' : '#111827'}
                      prefixColor={isDark ? '#999' : '#666'}
                      placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                    />
                    <TouchableOpacity
                      style={[
                        styles.salarySaveButton,
                        { opacity: savingAccountId === bankAccount.id ? 0.7 : 1 },
                      ]}
                      onPress={() => handleSalarySave(bankAccount.id)}
                      disabled={savingAccountId === bankAccount.id}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#8B5CF6', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.salarySaveButtonGradient}
                      >
                        {savingAccountId === bankAccount.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.salarySaveButtonText}>{t.saveSalary}</Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Modules Section */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          {t.modulesTitle}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280', marginBottom: 16 }]}>
            {t.modulesHelp}
          </Text>

          {modules.map((module) => {
            const config = MODULE_CONFIG[module.key];
            const isEnabled = settings.modules?.[module.key] ?? true;

            return (
              <View
                key={module.key}
                style={[
                  styles.moduleItem,
                  module.isLast && styles.moduleItemLast,
                ]}
              >
                <LinearGradient
                  colors={isEnabled ? config.gradient : ['#4B5563', '#374151']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.moduleIconContainer}
                >
                  <IconSymbol name={config.icon as any} size={18} color="#FFFFFF" />
                </LinearGradient>

                <View style={styles.moduleInfo}>
                  <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {module.name}
                  </Text>
                  <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                    {module.desc}
                  </Text>
                </View>

                <Switch
                  value={isEnabled}
                  onValueChange={(value) => handleModuleToggle(module.key, value)}
                  trackColor={{ false: isDark ? '#3F3F46' : '#D1D5DB', true: '#818CF8' }}
                  thumbColor={isEnabled ? '#6366F1' : isDark ? '#71717A' : '#F9FAFB'}
                  ios_backgroundColor={isDark ? '#3F3F46' : '#D1D5DB'}
                />
              </View>
            );
          })}
        </View>

        {/* Data Management Section */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          {t.dataTitle}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280', marginBottom: 16 }]}>
            {t.dataHelp}
          </Text>

          {/* Data Stats */}
          <View style={[styles.statsContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)' }]}>
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statsIconContainer}
            >
              <IconSymbol name="chart.pie.fill" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.statsText, { color: '#6366F1' }]}>
              {dataStats.keys} {t.dataStats} ({dataStats.sizeKB} KB)
            </Text>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleExport}
            disabled={isExporting || isImporting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isExporting ? ['#6B7280', '#4B5563'] : ['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dataButtonGradient}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol name="square.and.arrow.down" size={20} color="#FFFFFF" />
              )}
              <View style={styles.dataButtonText}>
                <Text style={styles.dataButtonTitle}>
                  {isExporting ? t.exporting : t.exportData}
                </Text>
                <Text style={styles.dataButtonDesc}>{t.exportDataDesc}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="rgba(255, 255, 255, 0.6)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Import Button */}
          <TouchableOpacity
            style={styles.dataButton}
            onPress={handleImport}
            disabled={isExporting || isImporting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={isImporting ? ['#6B7280', '#4B5563'] : ['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dataButtonGradient}
            >
              {isImporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
              )}
              <View style={styles.dataButtonText}>
                <Text style={styles.dataButtonTitle}>
                  {isImporting ? t.importing : t.importData}
                </Text>
                <Text style={styles.dataButtonDesc}>{t.importDataDesc}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color="rgba(255, 255, 255, 0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {saveStatus ? (
          <View style={styles.statusContainer}>
            <LinearGradient
              colors={['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.15)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statusGradient}
            >
              <IconSymbol name="checkmark.circle.fill" size={16} color="#6366F1" />
              <Text style={[styles.status, { color: '#6366F1' }]}>
                {saveStatus}
              </Text>
            </LinearGradient>
          </View>
        ) : null}

        {/* Version */}
        <TouchableOpacity
          style={styles.versionContainer}
          onPress={() => setShowReleaseNotesModal(true)}
          activeOpacity={0.6}
        >
          <Text style={[styles.versionText, { color: isDark ? '#666' : '#9CA3AF' }]}>
            v1.0.2-alpha
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.selectLanguage}
              </Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* English Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                settings.language === 'en' && styles.modalOptionSelected,
              ]}
              onPress={() => handleLanguageChange('en')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalOptionIcon}
              >
                <Text style={styles.modalOptionEmoji}>🇺🇸</Text>
              </LinearGradient>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.english}
                </Text>
                <Text style={[styles.modalOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.englishDesc}
                </Text>
              </View>
              {settings.language === 'en' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>

            {/* Portuguese Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                settings.language === 'pt' && styles.modalOptionSelected,
              ]}
              onPress={() => handleLanguageChange('pt')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalOptionIcon}
              >
                <Text style={styles.modalOptionEmoji}>🇧🇷</Text>
              </LinearGradient>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.portuguese}
                </Text>
                <Text style={[styles.modalOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.portugueseDesc}
                </Text>
              </View>
              {settings.language === 'pt' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Currency Selection Modal */}
      <Modal
        visible={showCurrencyModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCurrencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.selectCurrency}
              </Text>
              <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* USD Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                settings.currency === 'USD' && styles.modalOptionSelected,
              ]}
              onPress={() => handleCurrencyChange('USD')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalOptionIcon}
              >
                <Text style={styles.modalOptionCurrency}>$</Text>
              </LinearGradient>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.usd}
                </Text>
                <Text style={[styles.modalOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.usdDesc}
                </Text>
              </View>
              {settings.currency === 'USD' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
              )}
            </TouchableOpacity>

            {/* BRL Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                settings.currency === 'BRL' && styles.modalOptionSelected,
              ]}
              onPress={() => handleCurrencyChange('BRL')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalOptionIcon}
              >
                <Text style={styles.modalOptionCurrency}>R$</Text>
              </LinearGradient>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.brl}
                </Text>
                <Text style={[styles.modalOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.brlDesc}
                </Text>
              </View>
              {settings.currency === 'BRL' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.selectTheme}
              </Text>
              <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            {/* Light Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                (settings.theme ?? 'system') === 'light' && styles.modalOptionSelected,
              ]}
              onPress={() => handleThemeChange('light')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalOptionIcon}
              >
                <IconSymbol name="sun.max.fill" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.themeLight}
                </Text>
                <Text style={[styles.modalOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.themeLightDesc}
                </Text>
              </View>
              {(settings.theme ?? 'system') === 'light' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#F59E0B" />
              )}
            </TouchableOpacity>

            {/* Dark Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                (settings.theme ?? 'system') === 'dark' && styles.modalOptionSelected,
              ]}
              onPress={() => handleThemeChange('dark')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalOptionIcon}
              >
                <IconSymbol name="moon.fill" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.themeDark}
                </Text>
                <Text style={[styles.modalOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.themeDarkDesc}
                </Text>
              </View>
              {(settings.theme ?? 'system') === 'dark' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#6366F1" />
              )}
            </TouchableOpacity>

            {/* System Option */}
            <TouchableOpacity
              style={[
                styles.modalOption,
                (settings.theme ?? 'system') === 'system' && styles.modalOptionSelected,
              ]}
              onPress={() => handleThemeChange('system')}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalOptionIcon}
              >
                <IconSymbol name="circle.lefthalf.filled" size={24} color="#FFFFFF" />
              </LinearGradient>
              <View style={styles.modalOptionText}>
                <Text style={[styles.modalOptionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.themeSystem}
                </Text>
                <Text style={[styles.modalOptionDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.themeSystemDesc}
                </Text>
              </View>
              {(settings.theme ?? 'system') === 'system' && (
                <IconSymbol name="checkmark.circle.fill" size={24} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Release Notes Modal */}
      <Modal
        visible={showReleaseNotesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReleaseNotesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.releaseNotesModalContent, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.releaseNotes}
              </Text>
              <TouchableOpacity onPress={() => setShowReleaseNotesModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={isDark ? '#666' : '#9CA3AF'} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.releaseNotesScroll}>
              {/* v1.0.2-alpha */}
              <View style={[styles.releaseNoteCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <View style={styles.releaseNoteHeader}>
                  <LinearGradient
                    colors={['#6366F1', '#8B5CF6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.releaseNoteVersionBadge}
                  >
                    <Text style={styles.releaseNoteVersionText}>v1.0.2-alpha</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.releaseNoteSection, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {settings.language === 'en' ? 'New Features' : 'Novas Funcionalidades'}
                </Text>
                <Text style={[styles.releaseNoteItem, { color: isDark ? '#999' : '#6B7280' }]}>
                  {settings.language === 'en'
                    ? '• Added markdown help modal with formatting examples (bold, italic, quotes, nested quotes)\n• Enhanced FlavoredMarkdown component with bold+italic and nested quote support'
                    : '• Modal de ajuda de markdown com exemplos de formatação (negrito, itálico, citações, citações aninhadas)\n• Componente FlavoredMarkdown aprimorado com suporte a negrito+itálico e citações aninhadas'}
                </Text>
                <Text style={[styles.releaseNoteSection, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {settings.language === 'en' ? 'Edit Functionality' : 'Funcionalidade de Edição'}
                </Text>
                <Text style={[styles.releaseNoteItem, { color: isDark ? '#999' : '#6B7280' }]}>
                  {settings.language === 'en'
                    ? '• Added edit functionality for tasks\n• Added edit functionality for books and reviews\n• Added edit functionality for investment movements and investments\n• Added edit functionality for finance entries and recurring expenses\n• Added session editing in Training module'
                    : '• Edição de tarefas\n• Edição de livros e resenhas\n• Edição de movimentações e investimentos\n• Edição de lançamentos financeiros e despesas recorrentes\n• Edição de sessões no módulo de Treino'}
                </Text>
                <Text style={[styles.releaseNoteSection, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {settings.language === 'en' ? 'UI Improvements' : 'Melhorias de Interface'}
                </Text>
                <Text style={[styles.releaseNoteItem, { color: isDark ? '#999' : '#6B7280' }]}>
                  {settings.language === 'en'
                    ? '• Replaced RippleBackground with ColorWavesBackground for enhanced visuals'
                    : '• Substituído RippleBackground por ColorWavesBackground para visuais aprimorados'}
                </Text>
              </View>

              {/* v1.0.1-alpha */}
              <View style={[styles.releaseNoteCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <View style={styles.releaseNoteHeader}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.releaseNoteVersionBadge}
                  >
                    <Text style={styles.releaseNoteVersionText}>v1.0.1-alpha</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.releaseNoteItem, { color: isDark ? '#999' : '#6B7280' }]}>
                  {settings.language === 'en'
                    ? '• Added salary on configuration\n• Added optional end month on recurring expense\n• Recurring expenses and card charges added in the current month are automatically added to expenses\n• Added deposit and dividend options on new contribution on investments\n• Improved light mode UI'
                    : '• Salário adicionado nas configurações\n• Mês final opcional em despesas recorrentes\n• Despesas recorrentes e cobranças de cartão adicionadas no mês atual são automaticamente adicionadas às despesas\n• Opções de depósito e dividendo em novos aportes de investimentos\n• Interface do modo claro aprimorada'}
                </Text>
              </View>

              {/* v1.0.0-alpha */}
              <View style={[styles.releaseNoteCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
                <View style={styles.releaseNoteHeader}>
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.releaseNoteVersionBadge}
                  >
                    <Text style={styles.releaseNoteVersionText}>v1.0.0-alpha</Text>
                  </LinearGradient>
                </View>
                <Text style={[styles.releaseNoteItem, { color: isDark ? '#999' : '#6B7280' }]}>
                  {settings.language === 'en'
                    ? '• Life Manager now delivers a complete and local experience: accounts with XP/levels, light/dark themes, and language/currency preferences (EN/PT, USD/BRL) without relying on the cloud.\n• Finances: manage bank accounts, cards with limits/bills, recurring expenses, and monthly entries with categories and quick charts.\n• Investments: track portfolios, record contributions via "new total," view deltas and history with tags and a 12-month chart.\n• Tasks: create one-off or recurring tasks (daily/weekly/monthly) with today/overdue reminders, completing them earns XP.\n• Books: track your progress in books/manga, record chapters, write reviews, and mark works as completed or abandoned.\n• Mood: record mood (1–5) with ratings, keep streaks, and view 60-day trends with history search.\n• Training: Register exercises, record sessions (load/reps), track volume, statistics, and a 60-day heatmap.\n• Focus: Use Pomodoro, countdown timer, or stopwatch, with background notifications, completion alerts, and detailed history.\n• Achievements: View automatic milestones by level, chapters read, invested, tasks, workouts, focus minutes, and mood logs.\n• Quick controls: Enable/disable modules without losing data and use native toasts/dialogs for clearer confirmations throughout navigation.'
                    : '• Life Manager agora oferece uma experiência completa e local: contas com XP/níveis, temas claro/escuro e preferências de idioma/moeda (EN/PT, USD/BRL) sem depender da nuvem.\n• Finanças: gerencie contas bancárias, cartões com limites/faturas, despesas recorrentes e lançamentos mensais com categorias e gráficos rápidos.\n• Investimentos: acompanhe portfólios, registre aportes via "novo total", veja deltas e histórico com tags e gráfico de 12 meses.\n• Tarefas: crie tarefas únicas ou recorrentes (diárias/semanais/mensais) com lembretes de hoje/atrasadas, completá-las ganha XP.\n• Livros: acompanhe seu progresso em livros/mangás, registre capítulos, escreva resenhas e marque obras como concluídas ou abandonadas.\n• Humor: registre humor (1–5) com avaliações, mantenha sequências e veja tendências de 60 dias com busca no histórico.\n• Treino: Registre exercícios, grave sessões (carga/reps), acompanhe volume, estatísticas e heatmap de 60 dias.\n• Foco: Use Pomodoro, timer regressivo ou cronômetro, com notificações em segundo plano, alertas de conclusão e histórico detalhado.\n• Conquistas: Veja marcos automáticos por nível, capítulos lidos, investido, tarefas, treinos, minutos de foco e logs de humor.\n• Controles rápidos: Habilite/desabilite módulos sem perder dados e use toasts/dialogs nativos para confirmações mais claras em toda navegação.'}
                </Text>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
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
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  selectorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectorEmoji: {
    fontSize: 18,
  },
  selectorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.15)',
  },
  moduleItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  moduleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleInfo: {
    flex: 1,
    gap: 2,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '600',
  },
  moduleDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  statsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dataButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dataButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  dataButtonText: {
    flex: 1,
  },
  dataButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  dataButtonDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  statusGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  status: {
    fontSize: 14,
    fontWeight: '600',
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
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionEmoji: {
    fontSize: 24,
  },
  modalOptionCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalOptionDesc: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  salaryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  salaryInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  salarySaveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    height: 48,
    width: 72,
  },
  salarySaveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  salarySaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  salaryAccountItem: {
    paddingVertical: 14,
    gap: 10,
  },
  salaryAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  salaryAccountIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  salaryAccountName: {
    fontSize: 15,
    fontWeight: '600',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  releaseNotesModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  releaseNotesScroll: {
    maxHeight: SCREEN_HEIGHT * 0.65,
  },
  releaseNoteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  releaseNoteHeader: {
    marginBottom: 12,
  },
  releaseNoteVersionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  releaseNoteVersionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  releaseNoteSection: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  releaseNoteItem: {
    fontSize: 14,
    lineHeight: 22,
  },
});
