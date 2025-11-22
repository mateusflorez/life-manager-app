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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useBooks } from '@/contexts/books-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAlert } from '@/contexts/alert-context';

export default function AddBookScreen() {
  const { createBook } = useBooks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { showToast } = useAlert();

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
      cancel: 'Cancel',
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
      cancel: 'Cancelar',
    },
  };

  const t = translations[settings.language];

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showToast({ message: t.titleRequired, type: 'warning' });
      return;
    }

    const total = totalChapters.trim() ? parseInt(totalChapters, 10) : null;
    const current = currentChapter.trim() ? parseInt(currentChapter, 10) : 0;

    if (total !== null && current > total) {
      showToast({ message: t.invalidCurrentChapter, type: 'warning' });
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
      <RippleBackground isDark={isDark} rippleCount={6} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Book Title Card */}
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
                colors={['#6C5CE7', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconContainer}
              >
                <IconSymbol name="book.fill" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.bookTitle} *
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#FFFFFF' : '#111827',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              placeholder={t.bookTitlePlaceholder}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          {/* Total Chapters Card */}
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
                colors={['#36A2EB', '#4BC0C0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardIconContainer}
              >
                <IconSymbol name="list.bullet" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.totalChapters}
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#FFFFFF' : '#111827',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              placeholder={t.totalChaptersPlaceholder}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={totalChapters}
              onChangeText={setTotalChapters}
              keyboardType="number-pad"
            />
            <Text style={[styles.hint, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.totalChaptersHint}
            </Text>
          </View>

          {/* Current Chapter Card */}
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
                <IconSymbol name="checkmark.circle" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.currentChapter}
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDark ? '#FFFFFF' : '#111827',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              ]}
              placeholder={t.currentChapterPlaceholder}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={currentChapter}
              onChangeText={setCurrentChapter}
              keyboardType="number-pad"
            />
            <Text style={[styles.hint, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.currentChapterHint}
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
              ]}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.cancel}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { opacity: name.trim() && !saving ? 1 : 0.5 }]}
              onPress={handleSubmit}
              disabled={!name.trim() || saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6C5CE7', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {saving ? t.saving : t.addBook}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  hint: {
    fontSize: 13,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
