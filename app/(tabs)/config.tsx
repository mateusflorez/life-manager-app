import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { type Language, type Currency, type ModulesConfig } from '@/types/settings';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { saveExportedData, importData, getDataStats } from '@/services/data-export';
import { RippleBackground } from '@/components/ui/ripple-background';

export default function ConfigScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings, updateSettings } = useSettings();

  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dataStats, setDataStats] = useState<{ keys: number; sizeKB: number }>({ keys: 0, sizeKB: 0 });

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
        Alert.alert(
          settings.language === 'pt' ? 'Sucesso' : 'Success',
          settings.language === 'pt'
            ? 'Backup salvo com sucesso!'
            : 'Backup saved successfully!'
        );
      }
    } catch (error) {
      console.error('Failed to export:', error);
      Alert.alert(
        settings.language === 'pt' ? 'Erro' : 'Error',
        settings.language === 'pt'
          ? 'Falha ao exportar dados. Tente novamente.'
          : 'Failed to export data. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    Alert.alert(
      settings.language === 'pt' ? 'Importar Dados' : 'Import Data',
      settings.language === 'pt'
        ? 'Isso substituirá todos os dados existentes. Deseja continuar?'
        : 'This will replace all existing data. Do you want to continue?',
      [
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
                Alert.alert(
                  settings.language === 'pt' ? 'Sucesso' : 'Success',
                  settings.language === 'pt'
                    ? `${result.keysImported} itens importados. Reinicie o app para ver as mudanças.`
                    : `${result.keysImported} items imported. Restart the app to see changes.`
                );
              }
            } catch (error) {
              console.error('Failed to import:', error);
              Alert.alert(
                settings.language === 'pt' ? 'Erro' : 'Error',
                settings.language === 'pt'
                  ? 'Falha ao importar dados. Verifique se o arquivo é válido.'
                  : 'Failed to import data. Please check if the file is valid.'
              );
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const translations = {
    en: {
      title: 'Settings',
      languageLabel: 'Language',
      currencyLabel: 'Currency',
      languageHelp: 'Choose your preferred UI language',
      currencyHelp: 'Choose your preferred currency',
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
      exportDataDesc: 'Choose where to save your backup file',
      importData: 'Import Data',
      importDataDesc: 'Restore data from a backup file',
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
      exportDataDesc: 'Escolha onde salvar seu arquivo de backup',
      importData: 'Importar Dados',
      importDataDesc: 'Restaure dados de um arquivo de backup',
      dataStats: 'itens armazenados',
      exporting: 'Exportando...',
      importing: 'Importando...',
    },
  };

  const t = translations[settings.language];

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={5} />

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
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {t.languageLabel}
          </Text>
          <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t.languageHelp}
          </Text>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
          >
            <Picker
              selectedValue={settings.language}
              onValueChange={(value) => handleLanguageChange(value as Language)}
              style={[styles.picker, { color: isDark ? '#FFFFFF' : '#111827' }]}
              dropdownIconColor={isDark ? '#FFFFFF' : '#111827'}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Português" value="pt" />
            </Picker>
          </View>
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
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {t.currencyLabel}
          </Text>
          <Text style={[styles.cardDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
            {t.currencyHelp}
          </Text>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
            ]}
          >
            <Picker
              selectedValue={settings.currency}
              onValueChange={(value) => handleCurrencyChange(value as Currency)}
              style={[styles.picker, { color: isDark ? '#FFFFFF' : '#111827' }]}
              dropdownIconColor={isDark ? '#FFFFFF' : '#111827'}
            >
              <Picker.Item label="Real (R$)" value="BRL" />
              <Picker.Item label="Dollar ($)" value="USD" />
            </Picker>
          </View>
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

          {/* Finance Module */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.financeModule}
              </Text>
              <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.financeModuleDesc}
              </Text>
            </View>
            <Switch
              value={settings.modules?.finance ?? true}
              onValueChange={(value) => handleModuleToggle('finance', value)}
              trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#818CF8' }}
              thumbColor={settings.modules?.finance ? '#6366F1' : isDark ? '#666' : '#f4f3f4'}
            />
          </View>

          {/* Investments Module */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.investmentsModule}
              </Text>
              <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.investmentsModuleDesc}
              </Text>
            </View>
            <Switch
              value={settings.modules?.investments ?? true}
              onValueChange={(value) => handleModuleToggle('investments', value)}
              trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#818CF8' }}
              thumbColor={settings.modules?.investments ? '#6366F1' : isDark ? '#666' : '#f4f3f4'}
            />
          </View>

          {/* Tasks Module */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.tasksModule}
              </Text>
              <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.tasksModuleDesc}
              </Text>
            </View>
            <Switch
              value={settings.modules?.tasks ?? true}
              onValueChange={(value) => handleModuleToggle('tasks', value)}
              trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#818CF8' }}
              thumbColor={settings.modules?.tasks ? '#6366F1' : isDark ? '#666' : '#f4f3f4'}
            />
          </View>

          {/* Books Module */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.booksModule}
              </Text>
              <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.booksModuleDesc}
              </Text>
            </View>
            <Switch
              value={settings.modules?.books ?? true}
              onValueChange={(value) => handleModuleToggle('books', value)}
              trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#818CF8' }}
              thumbColor={settings.modules?.books ? '#6366F1' : isDark ? '#666' : '#f4f3f4'}
            />
          </View>

          {/* Mood Module */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.moodModule}
              </Text>
              <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.moodModuleDesc}
              </Text>
            </View>
            <Switch
              value={settings.modules?.mood ?? true}
              onValueChange={(value) => handleModuleToggle('mood', value)}
              trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#818CF8' }}
              thumbColor={settings.modules?.mood ? '#6366F1' : isDark ? '#666' : '#f4f3f4'}
            />
          </View>

          {/* Training Module */}
          <View style={styles.moduleItem}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.trainingModule}
              </Text>
              <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.trainingModuleDesc}
              </Text>
            </View>
            <Switch
              value={settings.modules?.training ?? true}
              onValueChange={(value) => handleModuleToggle('training', value)}
              trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#818CF8' }}
              thumbColor={settings.modules?.training ? '#6366F1' : isDark ? '#666' : '#f4f3f4'}
            />
          </View>

          {/* Focus Module */}
          <View style={[styles.moduleItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.moduleInfo}>
              <Text style={[styles.moduleName, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.focusModule}
              </Text>
              <Text style={[styles.moduleDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.focusModuleDesc}
              </Text>
            </View>
            <Switch
              value={settings.modules?.focus ?? true}
              onValueChange={(value) => handleModuleToggle('focus', value)}
              trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#818CF8' }}
              thumbColor={settings.modules?.focus ? '#6366F1' : isDark ? '#666' : '#f4f3f4'}
            />
          </View>
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
          <View style={[styles.statsContainer, { backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)' }]}>
            <IconSymbol name="chart.pie.fill" size={20} color="#6366F1" />
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
              colors={['#10B981', '#059669']}
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
              colors={['#3B82F6', '#2563EB']}
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
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {saveStatus ? (
          <View style={styles.statusContainer}>
            <Text style={[styles.status, { color: '#6366F1' }]}>
              {saveStatus}
            </Text>
          </View>
        ) : null}

        <View style={{ height: 40 }} />
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
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  picker: {
    height: 50,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  moduleInfo: {
    flex: 1,
    marginRight: 12,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dataButton: {
    marginBottom: 12,
  },
  dataButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
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
  status: {
    fontSize: 14,
    fontWeight: '600',
  },
});
