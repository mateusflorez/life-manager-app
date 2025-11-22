import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { type Language, type Currency, type ModulesConfig } from '@/types/settings';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { saveExportedData, importData, getDataStats } from '@/services/data-export';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useAlert } from '@/contexts/alert-context';

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
  const { showToast, showConfirm } = useAlert();

  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dataStats, setDataStats] = useState<{ keys: number; sizeKB: number }>({ keys: 0, sizeKB: 0 });
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  useEffect(() => {
    loadDataStats();
  }, []);

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
      languageHelp: 'Choose your preferred UI language',
      currencyHelp: 'Choose your preferred currency',
      selectLanguage: 'Select Language',
      selectCurrency: 'Select Currency',
      english: 'English',
      englishDesc: 'Use English for the interface',
      portuguese: 'Português',
      portugueseDesc: 'Use Portuguese for the interface',
      usd: 'US Dollar',
      usdDesc: 'Display values in USD ($)',
      brl: 'Brazilian Real',
      brlDesc: 'Display values in BRL (R$)',
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
    },
    pt: {
      title: 'Configurações',
      languageLabel: 'Idioma',
      currencyLabel: 'Moeda',
      languageHelp: 'Escolha seu idioma preferido',
      currencyHelp: 'Escolha sua moeda preferida',
      selectLanguage: 'Selecionar Idioma',
      selectCurrency: 'Selecionar Moeda',
      english: 'English',
      englishDesc: 'Usar inglês na interface',
      portuguese: 'Português',
      portugueseDesc: 'Usar português na interface',
      usd: 'Dólar Americano',
      usdDesc: 'Exibir valores em USD ($)',
      brl: 'Real Brasileiro',
      brlDesc: 'Exibir valores em BRL (R$)',
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
    },
  };

  const t = translations[settings.language];

  // Module list configuration
  const modules: Array<{
    key: keyof ModulesConfig;
    name: string;
    desc: string;
    isLast?: boolean;
  }> = [
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
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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

        {/* Modules Section */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
          {t.modulesTitle}
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
});
