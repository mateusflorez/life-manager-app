import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
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

  const [expandedSections, setExpandedSections] = useState({
    inProgress: true,
    completed: true,
    dropped: true,
  });

  const translations = {
    en: {
      inProgress: 'In Progress',
      completed: 'Completed',
      dropped: 'Dropped',
      noBooks: 'No books yet',
      noBooksDesc: 'Tap + to add your first book!',
      addBook: 'Add Book',
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
      noBooks: 'Nenhum livro ainda',
      noBooksDesc: 'Toque em + para adicionar!',
      addBook: 'Adicionar Livro',
      ongoing: 'Em andamento',
      chapter: 'Capítulo',
      lastChapter: 'Último: Capítulo',
      completedBadge: 'Concluído',
      droppedAt: 'Abandonado no capítulo',
    },
  };

  const t = translations[settings.language];

  const hasBooks = inProgressBooks.length > 0 || completedBooks.length > 0 || droppedBooks.length > 0;

  const toggleSection = (section: 'inProgress' | 'completed' | 'dropped') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const renderBookCard = (book: BookWithProgress) => {
    const isOngoing = book.isOngoing;
    const showProgress = !isOngoing && book.totalChapters !== null;

    return (
      <TouchableOpacity
        key={book.id}
        style={[
          styles.bookCard,
          {
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
          },
        ]}
        onPress={() => router.push(`/books/${book.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.bookHeader}>
          <View style={styles.bookTitleContainer}>
            <LinearGradient
              colors={book.isCompleted ? ['#10B981', '#059669'] : ['#6C5CE7', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bookIcon}
            >
              <IconSymbol name="book.fill" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text
              style={[styles.bookTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}
              numberOfLines={1}
            >
              {book.name}
            </Text>
          </View>
          <View
            style={[
              styles.chapterBadge,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
            ]}
          >
            <Text style={[styles.chapterCount, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {showProgress
                ? `${book.readChapters}/${book.totalChapters}`
                : `Ch. ${book.readChapters}`}
            </Text>
          </View>
        </View>

        {showProgress && !book.isDropped && (
          <View style={styles.progressContainer}>
            <View
              style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}
            >
              <LinearGradient
                colors={book.isCompleted ? ['#10B981', '#059669'] : ['#6C5CE7', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${book.progressPercent}%` }]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: isDark ? '#808080' : '#6B7280' }]}>
              {book.progressPercent}%
            </Text>
          </View>
        )}

        <View style={styles.badgeRow}>
          {isOngoing && !book.isDropped && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(54, 162, 235, 0.15)' }]}>
              <Text style={[styles.statusText, { color: '#36A2EB' }]}>{t.ongoing}</Text>
            </View>
          )}

          {book.isCompleted && !book.isDropped && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <IconSymbol name="checkmark" size={10} color="#10B981" />
              <Text style={[styles.statusText, { color: '#10B981' }]}>{t.completedBadge}</Text>
            </View>
          )}

          {book.isDropped && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.statusText, { color: '#F59E0B' }]}>
                {t.droppedAt} {book.readChapters}
              </Text>
            </View>
          )}
        </View>

        {book.lastChapter && (
          <Text style={[styles.lastRead, { color: isDark ? '#666' : '#9CA3AF' }]}>
            {t.lastChapter} {book.lastChapter.chapterNumber} · {formatDate(book.lastChapter.finishedAt, settings.language)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSection = (
    key: 'inProgress' | 'completed' | 'dropped',
    title: string,
    books: BookWithProgress[],
    gradientColors: [string, string],
    iconName: string
  ) => {
    if (books.length === 0) return null;
    const isExpanded = expandedSections[key];

    return (
      <View key={key} style={styles.section}>
        <TouchableOpacity
          style={[
            styles.sectionHeader,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
          onPress={() => toggleSection(key)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sectionIconContainer}
          >
            <IconSymbol name={iconName as any} size={16} color="#FFFFFF" />
          </LinearGradient>

          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
            {title}
          </Text>

          <View
            style={[
              styles.countBadge,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
            ]}
          >
            <Text style={[styles.countText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {books.length}
            </Text>
          </View>

          <IconSymbol
            name={isExpanded ? 'chevron.down' : 'chevron.right'}
            size={16}
            color={isDark ? '#808080' : '#6B7280'}
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {books.map(renderBookCard)}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#6C5CE7', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!hasBooks ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#6C5CE7', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <IconSymbol name="book.fill" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.noBooks}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.noBooksDesc}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/books/add')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#6C5CE7', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.createButtonGradient}
              >
                <IconSymbol name="plus" size={18} color="#FFFFFF" />
                <Text style={styles.createButtonText}>{t.addBook}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderSection('inProgress', t.inProgress, inProgressBooks, ['#6C5CE7', '#8B5CF6'], 'book.fill')}
            {renderSection('completed', t.completed, completedBooks, ['#10B981', '#059669'], 'checkmark.circle.fill')}
            {renderSection('dropped', t.dropped, droppedBooks, ['#F59E0B', '#D97706'], 'xmark.circle.fill')}
          </>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      {hasBooks && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/books/add')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6C5CE7', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <IconSymbol name="plus" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 100,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionContent: {
    gap: 10,
    paddingLeft: 12,
  },
  bookCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  bookTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bookIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chapterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chapterCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastRead: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  createButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 28,
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
