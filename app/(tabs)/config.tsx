import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { type Language, type Currency, type ModulesConfig } from '@/types/settings';

export default function ConfigScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings, updateSettings } = useSettings();

  const [saveStatus, setSaveStatus] = useState<string>('');

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
    },
  };

  const t = translations[settings.language];

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
          {t.title}
        </Text>

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F0F8FF',
              borderColor: isDark ? '#333' : '#B0D4FF',
            },
          ]}
        >
          <Text style={[styles.infoText, { color: isDark ? '#999' : '#4A7BA7' }]}>
            {t.languageHelp}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t.languageLabel}
          </Text>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
                borderColor: isDark ? '#333' : '#E0E0E0',
              },
            ]}
          >
            <Picker
              selectedValue={settings.language}
              onValueChange={(value) => handleLanguageChange(value as Language)}
              style={[
                styles.picker,
                { color: isDark ? '#ECEDEE' : '#11181C' },
              ]}
              dropdownIconColor={isDark ? '#ECEDEE' : '#11181C'}
            >
              <Picker.Item label="English" value="en" />
              <Picker.Item label="Português" value="pt" />
            </Picker>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t.currencyLabel}
          </Text>

          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
                borderColor: isDark ? '#333' : '#E0E0E0',
              },
            ]}
          >
            <Picker
              selectedValue={settings.currency}
              onValueChange={(value) => handleCurrencyChange(value as Currency)}
              style={[
                styles.picker,
                { color: isDark ? '#ECEDEE' : '#11181C' },
              ]}
              dropdownIconColor={isDark ? '#ECEDEE' : '#11181C'}
            >
              <Picker.Item label="Real (R$)" value="BRL" />
              <Picker.Item label="Dollar ($)" value="USD" />
            </Picker>
          </View>
        </View>

        {/* Modules Section */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
          {t.modulesTitle}
        </Text>

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F0F8FF',
              borderColor: isDark ? '#333' : '#B0D4FF',
            },
          ]}
        >
          <Text style={[styles.infoText, { color: isDark ? '#999' : '#4A7BA7' }]}>
            {t.modulesHelp}
          </Text>
        </View>

        <View
          style={[
            styles.moduleItem,
            {
              backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <View style={styles.moduleInfo}>
            <Text style={[styles.moduleName, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.financeModule}
            </Text>
            <Text style={[styles.moduleDesc, { color: isDark ? '#999' : '#666' }]}>
              {t.financeModuleDesc}
            </Text>
          </View>
          <Switch
            value={settings.modules?.finance ?? true}
            onValueChange={(value) => handleModuleToggle('finance', value)}
            trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#81C784' }}
            thumbColor={settings.modules?.finance ? '#4CAF50' : isDark ? '#666' : '#f4f3f4'}
          />
        </View>

        <View
          style={[
            styles.moduleItem,
            {
              backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <View style={styles.moduleInfo}>
            <Text style={[styles.moduleName, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.investmentsModule}
            </Text>
            <Text style={[styles.moduleDesc, { color: isDark ? '#999' : '#666' }]}>
              {t.investmentsModuleDesc}
            </Text>
          </View>
          <Switch
            value={settings.modules?.investments ?? true}
            onValueChange={(value) => handleModuleToggle('investments', value)}
            trackColor={{ false: isDark ? '#333' : '#D0D0D0', true: '#81C784' }}
            thumbColor={settings.modules?.investments ? '#4CAF50' : isDark ? '#666' : '#f4f3f4'}
          />
        </View>

        {saveStatus ? (
          <Text style={[styles.status, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
            {saveStatus}
          </Text>
        ) : null}
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  status: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 16,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  moduleInfo: {
    flex: 1,
    marginRight: 12,
  },
  moduleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 13,
  },
});
