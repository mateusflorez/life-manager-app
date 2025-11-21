import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/contexts/settings-context';

export type AccountFormProps = {
  onSubmit: (name: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function AccountForm({ onSubmit, onCancel, submitLabel }: AccountFormProps) {
  const [name, setName] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();

  const translations = {
    en: {
      label: 'Your name',
      placeholder: 'Enter your name',
      create: 'Create',
      cancel: 'Cancel',
    },
    pt: {
      label: 'Seu nome',
      placeholder: 'Digite seu nome',
      create: 'Criar',
      cancel: 'Cancelar',
    },
  };

  const t = translations[settings.language];
  const buttonLabel = submitLabel || t.create;

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name);
      setName('');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.form}>
        <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
          {t.label}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5',
              color: isDark ? '#ECEDEE' : '#11181C',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
          placeholder={t.placeholder}
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={name}
          onChangeText={setName}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSubmit}
            disabled={!name.trim()}
          >
            <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
          </TouchableOpacity>

          {onCancel && (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onCancel}
            >
              <Text style={[styles.secondaryButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  form: {
    width: '100%',
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
  },
  buttons: {
    gap: 12,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
