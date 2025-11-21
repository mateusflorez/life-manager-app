import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useBooks } from '@/contexts/books-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDateTime, BOOK_XP } from '@/types/books';
import { getChaptersForBook } from '@/services/books-storage';
import type { BookChapter, BookReview } from '@/types/books';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBook, logChapter, dropBook, addReview, deleteReview, deleteBook } = useBooks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [chapterStart, setChapterStart] = useState('');
  const [chapterEnd, setChapterEnd] = useState('');
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [saving, setSaving] = useState(false);

  const book = id ? getBook(id) : undefined;

  useEffect(() => {
    const loadChaptersData = async () => {
      if (!id) return;
      try {
        const data = await getChaptersForBook(id);
        setChapters(data);
      } catch (error) {
        console.error('Error loading chapters:', error);
      } finally {
        setLoadingChapters(false);
      }
    };
    loadChaptersData();
  }, [id]);

  const translations = {
    en: {
      progress: 'Progress',
      chapters: 'chapters',
      chapter: 'Chapter',
      ongoing: 'Ongoing series',
      readNextChapter: 'Read Next Chapter',
      dropReading: 'Drop Reading',
      stopFollowing: 'Stop Following',
      chapterHistory: 'Chapter History',
      noChapters: 'No chapters read yet',
      reviews: 'Reviews',
      addReview: 'Add Review',
      reviewPlaceholder: 'Share your thoughts...',
      chapterRange: 'Chapter Range (optional)',
      chapterStartPlaceholder: 'From',
      chapterEndPlaceholder: 'To',
      chapterRangeHint: 'Leave empty for general review, or specify a single chapter or range',
      saveReview: 'Save Review',
      saving: 'Saving...',
      noReviews: 'No reviews yet',
      dropConfirm: 'Mark this book as dropped?',
      dropConfirmMessage: 'This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete Book',
      deleteConfirm: 'Are you sure you want to delete this book?',
      deleteConfirmMessage: 'This will delete all chapter history and cannot be undone.',
      deleteReviewConfirm: 'Delete this review?',
      completed: 'Completed',
      droppedAt: 'Dropped at chapter',
      generalReview: 'General',
      chaptersLabel: 'Ch.',
    },
    pt: {
      progress: 'Progresso',
      chapters: 'capítulos',
      chapter: 'Capítulo',
      ongoing: 'Série em andamento',
      readNextChapter: 'Ler Próximo Capítulo',
      dropReading: 'Abandonar Leitura',
      stopFollowing: 'Parar de Acompanhar',
      chapterHistory: 'Histórico de Capítulos',
      noChapters: 'Nenhum capítulo lido ainda',
      reviews: 'Resenhas',
      addReview: 'Adicionar Resenha',
      reviewPlaceholder: 'Compartilhe o que achou...',
      chapterRange: 'Capítulos (opcional)',
      chapterStartPlaceholder: 'De',
      chapterEndPlaceholder: 'Até',
      chapterRangeHint: 'Deixe vazio para resenha geral, ou especifique um capítulo ou intervalo',
      saveReview: 'Salvar Resenha',
      saving: 'Salvando...',
      noReviews: 'Nenhuma resenha ainda',
      dropConfirm: 'Marcar este livro como abandonado?',
      dropConfirmMessage: 'Esta ação não pode ser desfeita.',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Excluir Livro',
      deleteConfirm: 'Tem certeza que deseja excluir este livro?',
      deleteConfirmMessage: 'Isso excluirá todo o histórico e não pode ser desfeito.',
      deleteReviewConfirm: 'Excluir esta resenha?',
      completed: 'Concluído',
      droppedAt: 'Abandonado no capítulo',
      generalReview: 'Geral',
      chaptersLabel: 'Cap.',
    },
  };

  const t = translations[settings.language];

  if (!book) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </ThemedView>
    );
  }

  const canReadMore = book.isOngoing || (book.totalChapters !== null && book.readChapters < book.totalChapters);
  const isOngoing = book.isOngoing;
  const showProgress = !isOngoing && book.totalChapters !== null;

  const handleLogChapter = async () => {
    if (!canReadMore || book.isDropped) return;
    setSaving(true);
    try {
      await logChapter(book.id);
      const updatedChapters = await getChaptersForBook(book.id);
      setChapters(updatedChapters);
    } catch (error) {
      console.error('Error logging chapter:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = () => {
    Alert.alert(t.dropConfirm, t.dropConfirmMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirm,
        style: 'destructive',
        onPress: async () => {
          await dropBook(book.id);
        },
      },
    ]);
  };

  const handleSaveReview = async () => {
    if (!reviewText.trim()) return;
    setSaving(true);
    try {
      const start = chapterStart.trim() ? parseInt(chapterStart, 10) : null;
      const end = chapterEnd.trim() ? parseInt(chapterEnd, 10) : null;
      await addReview(book.id, reviewText.trim(), start, end);
      setReviewText('');
      setChapterStart('');
      setChapterEnd('');
    } catch (error) {
      console.error('Error saving review:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReview = (review: BookReview) => {
    Alert.alert(t.deleteReviewConfirm, '', [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteReview(review.id);
        },
      },
    ]);
  };

  const handleDeleteBook = () => {
    Alert.alert(t.deleteConfirm, t.deleteConfirmMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteBook(book.id);
          router.back();
        },
      },
    ]);
  };

  const formatReviewChapters = (review: BookReview) => {
    if (review.chapterStart === null) {
      return t.generalReview;
    }
    if (review.chapterEnd === null || review.chapterEnd === review.chapterStart) {
      return `${t.chaptersLabel} ${review.chapterStart}`;
    }
    return `${t.chaptersLabel} ${review.chapterStart}-${review.chapterEnd}`;
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Progress Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t.progress}
          </Text>

          {showProgress ? (
            <>
              <Text style={[styles.progressText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {book.readChapters} / {book.totalChapters} {t.chapters}
              </Text>
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
            </>
          ) : (
            <>
              <Text style={[styles.progressText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {t.chapter} {book.readChapters}
              </Text>
              <View style={[styles.badge, { backgroundColor: '#36A2EB20' }]}>
                <Text style={[styles.badgeText, { color: '#36A2EB' }]}>{t.ongoing}</Text>
              </View>
            </>
          )}

          {book.isCompleted && !book.isDropped && (
            <View style={[styles.badge, { backgroundColor: '#10B98120', marginTop: 8 }]}>
              <Text style={[styles.badgeText, { color: '#10B981' }]}>✓ {t.completed}</Text>
            </View>
          )}

          {book.isDropped && (
            <View style={[styles.badge, { backgroundColor: '#F59E0B20', marginTop: 8 }]}>
              <Text style={[styles.badgeText, { color: '#F59E0B' }]}>
                ⊘ {t.droppedAt} {book.readChapters}
              </Text>
            </View>
          )}

          {!book.isDropped && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!canReadMore || saving) && styles.buttonDisabled,
                ]}
                onPress={handleLogChapter}
                disabled={!canReadMore || saving}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? t.saving : t.readNextChapter}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleDrop}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  {isOngoing ? t.stopFollowing : t.dropReading}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Reviews */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t.reviews}
          </Text>

          {/* Add Review Form */}
          <View style={styles.addReviewForm}>
            <TextInput
              style={[
                styles.reviewInput,
                {
                  backgroundColor: isDark ? '#0D0D0D' : '#fff',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                  color: isDark ? '#ECEDEE' : '#11181C',
                },
              ]}
              placeholder={t.reviewPlaceholder}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.chapterRangeLabel, { color: isDark ? '#999' : '#666' }]}>
              {t.chapterRange}
            </Text>
            <View style={styles.chapterRangeRow}>
              <TextInput
                style={[
                  styles.chapterInput,
                  {
                    backgroundColor: isDark ? '#0D0D0D' : '#fff',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                    color: isDark ? '#ECEDEE' : '#11181C',
                  },
                ]}
                placeholder={t.chapterStartPlaceholder}
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={chapterStart}
                onChangeText={setChapterStart}
                keyboardType="number-pad"
              />
              <Text style={[styles.chapterRangeSeparator, { color: isDark ? '#666' : '#999' }]}>
                —
              </Text>
              <TextInput
                style={[
                  styles.chapterInput,
                  {
                    backgroundColor: isDark ? '#0D0D0D' : '#fff',
                    borderColor: isDark ? '#333' : '#E0E0E0',
                    color: isDark ? '#ECEDEE' : '#11181C',
                  },
                ]}
                placeholder={t.chapterEndPlaceholder}
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={chapterEnd}
                onChangeText={setChapterEnd}
                keyboardType="number-pad"
              />
            </View>
            <Text style={[styles.chapterRangeHint, { color: isDark ? '#666' : '#999' }]}>
              {t.chapterRangeHint}
            </Text>

            <TouchableOpacity
              style={[styles.reviewButton, (saving || !reviewText.trim()) && styles.buttonDisabled]}
              onPress={handleSaveReview}
              disabled={saving || !reviewText.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.reviewButtonText}>{saving ? t.saving : t.saveReview}</Text>
            </TouchableOpacity>
          </View>

          {/* Existing Reviews */}
          {book.reviews.length > 0 && (
            <View style={[styles.reviewsList, { borderTopColor: isDark ? '#333' : '#E0E0E0' }]}>
              {book.reviews.map((review) => (
                <View
                  key={review.id}
                  style={[
                    styles.reviewItem,
                    { borderBottomColor: isDark ? '#333' : '#E0E0E0' },
                  ]}
                >
                  <View style={styles.reviewHeader}>
                    <View style={[styles.reviewChapterBadge, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
                      <Text style={[styles.reviewChapterText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                        {formatReviewChapters(review)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteReview(review)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <IconSymbol name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.reviewContent, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                    {review.content}
                  </Text>
                  <Text style={[styles.reviewDate, { color: isDark ? '#666' : '#999' }]}>
                    {formatDateTime(review.createdAt, settings.language)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {book.reviews.length === 0 && (
            <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>
              {t.noReviews}
            </Text>
          )}
        </View>

        {/* Chapter History */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
            {t.chapterHistory}
          </Text>

          {loadingChapters ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : chapters.length === 0 ? (
            <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>
              {t.noChapters}
            </Text>
          ) : (
            <View style={styles.chapterList}>
              {chapters.map((chapter) => (
                <View
                  key={chapter.id}
                  style={[styles.chapterRow, { borderBottomColor: isDark ? '#333' : '#E0E0E0' }]}
                >
                  <Text style={[styles.chapterNumber, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                    {t.chapter} {chapter.chapterNumber}
                  </Text>
                  <Text style={[styles.chapterDate, { color: isDark ? '#666' : '#999' }]}>
                    {formatDateTime(chapter.finishedAt, settings.language)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Delete */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteBook}
          activeOpacity={0.8}
        >
          <Text style={styles.deleteButtonText}>{t.delete}</Text>
        </TouchableOpacity>
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
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 8,
  },
  reviewsList: {
    gap: 0,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewChapterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reviewChapterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewDate: {
    fontSize: 11,
  },
  addReviewForm: {
    gap: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  chapterRangeLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  chapterRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chapterInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  chapterRangeSeparator: {
    fontSize: 16,
  },
  chapterRangeHint: {
    fontSize: 11,
  },
  reviewButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  chapterList: {
    gap: 0,
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: '500',
  },
  chapterDate: {
    fontSize: 12,
  },
  deleteButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});
