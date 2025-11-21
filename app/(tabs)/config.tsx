import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';
import { type Language, type Currency } from '@/types/settings';

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

  const translations = {
    en: {
      title: 'Settings',
      languageLabel: 'Language',
      currencyLabel: 'Currency',
      languageHelp: 'Choose your preferred UI language',
      currencyHelp: 'Choose your preferred currency',
    },
    pt: {
      title: 'Configurações',
      languageLabel: 'Idioma',
      currencyLabel: 'Moeda',
      languageHelp: 'Escolha seu idioma preferido',
      currencyHelp: 'Escolha sua moeda preferida',
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
});
