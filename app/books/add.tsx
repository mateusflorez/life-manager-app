import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useBooks } from '@/contexts/books-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function AddBookScreen() {
  const { createBook } = useBooks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [name, setName] = useState('');
  const [totalChapters, setTotalChapters] = useState('');
  const [currentChapter, setCurrentChapter] = useState('');
  const [saving, setSaving] = useState(false);

  const translations = {
    en: {
      bookTitle: 'Book Title',
      bookTitlePlaceholder: 'Enter book title...',
      totalChapters: 'Total Chapters',
      totalChaptersPlaceholder: 'Leave empty for ongoing series',
      totalChaptersHint: 'For manga/series with no end, leave empty',
      currentChapter: 'Current Chapter',
      currentChapterPlaceholder: '0',
      currentChapterHint: "If you've already read some chapters",
      addBook: 'Add Book',
      saving: 'Saving...',
      titleRequired: 'Please enter a book title',
      bookCreated: 'Book added!',
      invalidCurrentChapter: 'Current chapter cannot exceed total chapters',
    },
    pt: {
      bookTitle: 'Título do Livro',
      bookTitlePlaceholder: 'Digite o título do livro...',
      totalChapters: 'Total de Capítulos',
      totalChaptersPlaceholder: 'Deixe vazio para séries em andamento',
      totalChaptersHint: 'Para mangás/séries sem fim, deixe vazio',
      currentChapter: 'Capítulo Atual',
      currentChapterPlaceholder: '0',
      currentChapterHint: 'Se você já leu alguns capítulos',
      addBook: 'Adicionar Livro',
      saving: 'Salvando...',
      titleRequired: 'Por favor, insira o título do livro',
      bookCreated: 'Livro adicionado!',
      invalidCurrentChapter: 'Capítulo atual não pode exceder o total',
    },
  };

  const t = translations[settings.language];

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('', t.titleRequired);
      return;
    }

    const total = totalChapters.trim() ? parseInt(totalChapters, 10) : null;
    const current = currentChapter.trim() ? parseInt(currentChapter, 10) : 0;

    if (total !== null && current > total) {
      Alert.alert('', t.invalidCurrentChapter);
      return;
    }

    setSaving(true);
    try {
      await createBook(trimmedName, total, current);
      router.back();
    } catch (error) {
      console.error('Error creating book:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.bookTitle} *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                  color: isDark ? '#ECEDEE' : '#11181C',
                },
              ]}
              placeholder={t.bookTitlePlaceholder}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.totalChapters}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                  color: isDark ? '#ECEDEE' : '#11181C',
                },
              ]}
              placeholder={t.totalChaptersPlaceholder}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={totalChapters}
              onChangeText={setTotalChapters}
              keyboardType="number-pad"
            />
            <Text style={[styles.hint, { color: isDark ? '#666' : '#999' }]}>
              {t.totalChaptersHint}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.currentChapter}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                  color: isDark ? '#ECEDEE' : '#11181C',
                },
              ]}
              placeholder={t.currentChapterPlaceholder}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={currentChapter}
              onChangeText={setCurrentChapter}
              keyboardType="number-pad"
            />
            <Text style={[styles.hint, { color: isDark ? '#666' : '#999' }]}>
              {t.currentChapterHint}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{saving ? t.saving : t.addBook}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
