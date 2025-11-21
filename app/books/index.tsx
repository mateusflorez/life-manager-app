import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useBooks } from '@/contexts/books-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDate } from '@/types/books';
import type { BookWithProgress } from '@/types/books';

export default function BooksScreen() {
  const { inProgressBooks, completedBooks, droppedBooks, loading } = useBooks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const translations = {
    en: {
      inProgress: 'In Progress',
      completed: 'Completed',
      dropped: 'Dropped',
      noBooks: 'No books yet. Tap + to add your first book!',
      ongoing: 'Ongoing',
      chapter: 'Chapter',
      lastChapter: 'Last: Chapter',
      completedBadge: 'Completed',
      droppedAt: 'Dropped at chapter',
    },
    pt: {
      inProgress: 'Em Progresso',
      completed: 'Concluídos',
      dropped: 'Abandonados',
      noBooks: 'Nenhum livro ainda. Toque em + para adicionar!',
      ongoing: 'Em andamento',
      chapter: 'Capítulo',
      lastChapter: 'Último: Capítulo',
      completedBadge: 'Concluído',
      droppedAt: 'Abandonado no capítulo',
    },
  };

  const t = translations[settings.language];

  const hasBooks = inProgressBooks.length > 0 || completedBooks.length > 0 || droppedBooks.length > 0;

  const renderBookCard = (book: BookWithProgress) => {
    const isOngoing = book.isOngoing;
    const showProgress = !isOngoing && book.totalChapters !== null;

    return (
      <TouchableOpacity
        key={book.id}
        style={[
          styles.bookCard,
          {
            backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
            borderColor: isDark ? '#333' : '#E0E0E0',
          },
        ]}
        onPress={() => router.push(`/books/${book.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.bookHeader}>
          <Text
            style={[styles.bookTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}
            numberOfLines={1}
          >
            {book.name}
          </Text>
          <Text style={[styles.chapterCount, { color: isDark ? '#999' : '#666' }]}>
            {showProgress
              ? `${book.readChapters}/${book.totalChapters}`
              : `Ch. ${book.readChapters}`}
          </Text>
        </View>

        {showProgress && !book.isDropped && (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${book.progressPercent}%`,
                    backgroundColor: book.isCompleted ? '#10B981' : '#6C5CE7',
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: isDark ? '#999' : '#666' }]}>
              {book.progressPercent}%
            </Text>
          </View>
        )}

        {isOngoing && !book.isDropped && (
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: '#36A2EB20' }]}>
              <Text style={[styles.badgeText, { color: '#36A2EB' }]}>{t.ongoing}</Text>
            </View>
          </View>
        )}

        {book.isCompleted && !book.isDropped && (
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: '#10B98120' }]}>
              <Text style={[styles.badgeText, { color: '#10B981' }]}>✓ {t.completedBadge}</Text>
            </View>
          </View>
        )}

        {book.isDropped && (
          <View style={styles.badgeContainer}>
            <View style={[styles.badge, { backgroundColor: '#F59E0B20' }]}>
              <Text style={[styles.badgeText, { color: '#F59E0B' }]}>
                ⊘ {t.droppedAt} {book.readChapters}
              </Text>
            </View>
          </View>
        )}

        {book.lastChapter && (
          <Text style={[styles.lastRead, { color: isDark ? '#666' : '#999' }]}>
            {t.lastChapter} {book.lastChapter.chapterNumber} · {formatDate(book.lastChapter.finishedAt, settings.language)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, books: BookWithProgress[]) => {
    if (books.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#999' : '#666' }]}>
          {title}
        </Text>
        {books.map(renderBookCard)}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {!hasBooks ? (
          <Text style={[styles.emptyText, { color: isDark ? '#999' : '#666' }]}>
            {t.noBooks}
          </Text>
        ) : (
          <>
            {renderSection(t.inProgress, inProgressBooks)}
            {renderSection(t.completed, completedBooks)}
            {renderSection(t.dropped, droppedBooks)}
          </>
        )}
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
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 60,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bookCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chapterCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '500',
    width: 36,
    textAlign: 'right',
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastRead: {
    fontSize: 12,
  },
});
