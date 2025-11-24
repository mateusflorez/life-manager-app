import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useBooks } from '@/contexts/books-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDateTime } from '@/types/books';
import { getChaptersForBook } from '@/services/books-storage';
import type { BookChapter, BookReview } from '@/types/books';
import { useAlert } from '@/contexts/alert-context';

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getBook, logChapter, dropBook, addReview, updateReview, deleteReview, deleteBook, updateBook, setReadChapters } = useBooks();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { showConfirm, showToast } = useAlert();

  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState<number | null>(null);
  const [chapterStart, setChapterStart] = useState('');
  const [chapterEnd, setChapterEnd] = useState('');
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit review states
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [editReviewRating, setEditReviewRating] = useState<number | null>(null);
  const [editChapterStart, setEditChapterStart] = useState('');
  const [editChapterEnd, setEditChapterEnd] = useState('');

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTotalChapters, setEditTotalChapters] = useState('');
  const [editReadChapters, setEditReadChapters] = useState('');

  // Pagination states
  const [visibleChaptersCount, setVisibleChaptersCount] = useState(10);
  const [showAllReviews, setShowAllReviews] = useState(false);

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
      deleteButton: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this book?',
      deleteConfirmMessage: 'This will delete all chapter history and cannot be undone.',
      deleteReviewConfirm: 'Delete this review?',
      completed: 'Completed',
      droppedAt: 'Dropped at chapter',
      generalReview: 'General',
      chaptersLabel: 'Ch.',
      editBook: 'Edit Book',
      bookName: 'Book Name',
      totalChaptersLabel: 'Total Chapters',
      ongoingHint: 'Leave empty for ongoing series',
      save: 'Save',
      edit: 'Edit',
      cancelEdit: 'Cancel',
      bookUpdated: 'Book updated!',
      showMore: 'Show more',
      rating: 'Rating',
      editReview: 'Edit Review',
      reviewUpdated: 'Review updated!',
      noRating: 'No rating',
      readChaptersLabel: 'Chapters Read',
      showAllReviews: 'Show all reviews',
      showLessReviews: 'Show less',
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
      deleteButton: 'Excluir',
      deleteConfirm: 'Tem certeza que deseja excluir este livro?',
      deleteConfirmMessage: 'Isso excluirá todo o histórico e não pode ser desfeito.',
      deleteReviewConfirm: 'Excluir esta resenha?',
      completed: 'Concluído',
      droppedAt: 'Abandonado no capítulo',
      generalReview: 'Geral',
      chaptersLabel: 'Cap.',
      editBook: 'Editar Livro',
      bookName: 'Nome do Livro',
      totalChaptersLabel: 'Total de Capítulos',
      ongoingHint: 'Deixe vazio para séries em andamento',
      save: 'Salvar',
      edit: 'Editar',
      cancelEdit: 'Cancelar',
      bookUpdated: 'Livro atualizado!',
      showMore: 'Ver mais',
      rating: 'Nota',
      editReview: 'Editar Resenha',
      reviewUpdated: 'Resenha atualizada!',
      noRating: 'Sem nota',
      readChaptersLabel: 'Capítulos Lidos',
      showAllReviews: 'Ver todas as resenhas',
      showLessReviews: 'Ver menos',
    },
  };

  const t = translations[settings.language];

  if (!book) {
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
    showConfirm({
      title: t.dropConfirm,
      message: t.dropConfirmMessage,
      buttons: [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.confirm,
          style: 'destructive',
          onPress: async () => {
            await dropBook(book.id);
          },
        },
      ],
    });
  };

  const handleSaveReview = async () => {
    if (!reviewText.trim()) return;
    setSaving(true);
    try {
      const start = chapterStart.trim() ? parseInt(chapterStart, 10) : null;
      const end = chapterEnd.trim() ? parseInt(chapterEnd, 10) : null;
      await addReview(book.id, reviewText.trim(), reviewRating, start, end);
      setReviewText('');
      setReviewRating(null);
      setChapterStart('');
      setChapterEnd('');
    } catch (error) {
      console.error('Error saving review:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditReview = (review: BookReview) => {
    setEditingReviewId(review.id);
    setEditReviewText(review.content);
    setEditReviewRating(review.rating);
    setEditChapterStart(review.chapterStart !== null ? String(review.chapterStart) : '');
    setEditChapterEnd(review.chapterEnd !== null ? String(review.chapterEnd) : '');
  };

  const handleCancelEditReview = () => {
    setEditingReviewId(null);
    setEditReviewText('');
    setEditReviewRating(null);
    setEditChapterStart('');
    setEditChapterEnd('');
  };

  const handleUpdateReview = async () => {
    if (!editingReviewId || !editReviewText.trim()) return;
    setSaving(true);
    try {
      const start = editChapterStart.trim() ? parseInt(editChapterStart, 10) : null;
      const end = editChapterEnd.trim() ? parseInt(editChapterEnd, 10) : null;
      await updateReview(editingReviewId, editReviewText.trim(), editReviewRating, start, end);
      showToast({
        message: t.reviewUpdated,
        type: 'success',
      });
      handleCancelEditReview();
    } catch (error) {
      console.error('Error updating review:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderStarRating = (
    rating: number | null,
    onSelect: (rating: number | null) => void,
    size: number = 24
  ) => {
    return (
      <View style={styles.starRatingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onSelect(rating === star ? null : star)}
            activeOpacity={0.7}
          >
            <IconSymbol
              name={rating !== null && star <= rating ? 'star.fill' : 'star'}
              size={size}
              color={rating !== null && star <= rating ? '#F59E0B' : (isDark ? '#666' : '#9CA3AF')}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDisplayStars = (rating: number | null) => {
    if (rating === null) return null;
    return (
      <View style={styles.displayStarsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <IconSymbol
            key={star}
            name={star <= rating ? 'star.fill' : 'star'}
            size={12}
            color={star <= rating ? '#F59E0B' : (isDark ? '#666' : '#9CA3AF')}
          />
        ))}
      </View>
    );
  };

  const handleDeleteReview = (review: BookReview) => {
    showConfirm({
      title: t.deleteReviewConfirm,
      buttons: [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.deleteButton,
          style: 'destructive',
          onPress: async () => {
            await deleteReview(review.id);
          },
        },
      ],
    });
  };

  const handleDeleteBook = () => {
    showConfirm({
      title: t.deleteConfirm,
      message: t.deleteConfirmMessage,
      buttons: [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            await deleteBook(book.id);
            router.back();
          },
        },
      ],
    });
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

  const handleStartEdit = () => {
    setEditName(book.name);
    setEditTotalChapters(book.totalChapters !== null ? String(book.totalChapters) : '');
    setEditReadChapters(String(book.readChapters));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
    setEditTotalChapters('');
    setEditReadChapters('');
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;

    setSaving(true);
    try {
      const totalChapters = editTotalChapters.trim()
        ? parseInt(editTotalChapters, 10)
        : null;

      await updateBook(book.id, {
        name: editName.trim(),
        totalChapters,
      });

      // Update read chapters if changed
      const newReadChapters = editReadChapters.trim()
        ? parseInt(editReadChapters, 10)
        : 0;
      if (newReadChapters !== book.readChapters) {
        await setReadChapters(book.id, newReadChapters);
        // Reload chapters for the UI
        const updatedChapters = await getChaptersForBook(book.id);
        setChapters(updatedChapters);
      }

      showToast({
        message: t.bookUpdated,
        type: 'success',
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating book:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={book.isCompleted ? ['#10B981', '#059669'] : ['#6C5CE7', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconContainer}
            >
              <IconSymbol name="chart.bar.fill" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.progress}
            </Text>
          </View>

          {showProgress ? (
            <>
              <Text style={[styles.progressText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {book.readChapters} / {book.totalChapters} {t.chapters}
              </Text>
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
            </>
          ) : (
            <>
              <Text style={[styles.progressText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.chapter} {book.readChapters}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(54, 162, 235, 0.15)' }]}>
                <Text style={[styles.statusText, { color: '#36A2EB' }]}>{t.ongoing}</Text>
              </View>
            </>
          )}

          {book.isCompleted && !book.isDropped && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <IconSymbol name="checkmark" size={12} color="#10B981" />
              <Text style={[styles.statusText, { color: '#10B981' }]}>{t.completed}</Text>
            </View>
          )}

          {book.isDropped && (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Text style={[styles.statusText, { color: '#F59E0B' }]}>
                {t.droppedAt} {book.readChapters}
              </Text>
            </View>
          )}

          {!book.isDropped && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.primaryButton, { opacity: canReadMore && !saving ? 1 : 0.5 }]}
                onPress={handleLogChapter}
                disabled={!canReadMore || saving}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#6C5CE7', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryButtonGradient}
                >
                  <IconSymbol name="book.fill" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>
                    {saving ? t.saving : t.readNextChapter}
                  </Text>
                </LinearGradient>
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

        {/* Edit Book Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconContainer}
            >
              <IconSymbol name="pencil" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.editBook}
            </Text>
            {!isEditing && (
              <TouchableOpacity
                onPress={handleStartEdit}
                style={[
                  styles.editToggleButton,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' },
                ]}
              >
                <Text style={[styles.editToggleText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.edit}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={[styles.editLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.bookName}
              </Text>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                value={editName}
                onChangeText={setEditName}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              />

              <Text style={[styles.editLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.totalChaptersLabel}
              </Text>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                value={editTotalChapters}
                onChangeText={setEditTotalChapters}
                placeholder={t.ongoingHint}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                keyboardType="number-pad"
              />

              <Text style={[styles.editLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                {t.readChaptersLabel}
              </Text>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                value={editReadChapters}
                onChangeText={setEditReadChapters}
                placeholder="0"
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                keyboardType="number-pad"
              />

              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={[
                    styles.editCancelButton,
                    { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                  ]}
                  onPress={handleCancelEdit}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.editCancelText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t.cancelEdit}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.editSaveButton, { opacity: editName.trim() && !saving ? 1 : 0.5 }]}
                  onPress={handleSaveEdit}
                  disabled={!editName.trim() || saving}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.editSaveGradient}
                  >
                    <Text style={styles.editSaveText}>
                      {saving ? t.saving : t.save}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.editPreview}>
              <View style={styles.editPreviewRow}>
                <Text style={[styles.editPreviewLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.bookName}:
                </Text>
                <Text style={[styles.editPreviewValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {book.name}
                </Text>
              </View>
              <View style={styles.editPreviewRow}>
                <Text style={[styles.editPreviewLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.totalChaptersLabel}:
                </Text>
                <Text style={[styles.editPreviewValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {book.totalChapters !== null ? book.totalChapters : t.ongoing}
                </Text>
              </View>
              <View style={styles.editPreviewRow}>
                <Text style={[styles.editPreviewLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                  {t.readChaptersLabel}:
                </Text>
                <Text style={[styles.editPreviewValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {book.readChapters}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Reviews Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardIconContainer}
            >
              <IconSymbol name="star.fill" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.reviews}
            </Text>
          </View>

          {/* Add Review Form */}
          <View style={styles.addReviewForm}>
            <TextInput
              style={[
                styles.reviewInput,
                {
                  backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDark ? '#FFFFFF' : '#111827',
                },
              ]}
              placeholder={t.reviewPlaceholder}
              placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={[styles.chapterRangeLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.rating}
            </Text>
            {renderStarRating(reviewRating, setReviewRating)}

            <Text style={[styles.chapterRangeLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.chapterRange}
            </Text>
            <View style={styles.chapterRangeRow}>
              <TextInput
                style={[
                  styles.chapterInput,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                placeholder={t.chapterStartPlaceholder}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                value={chapterStart}
                onChangeText={setChapterStart}
                keyboardType="number-pad"
              />
              <Text style={[styles.chapterRangeSeparator, { color: isDark ? '#808080' : '#6B7280' }]}>
                —
              </Text>
              <TextInput
                style={[
                  styles.chapterInput,
                  {
                    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                placeholder={t.chapterEndPlaceholder}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                value={chapterEnd}
                onChangeText={setChapterEnd}
                keyboardType="number-pad"
              />
            </View>
            <Text style={[styles.chapterRangeHint, { color: isDark ? '#666' : '#9CA3AF' }]}>
              {t.chapterRangeHint}
            </Text>

            <TouchableOpacity
              style={[styles.reviewButton, { opacity: reviewText.trim() && !saving ? 1 : 0.5 }]}
              onPress={handleSaveReview}
              disabled={saving || !reviewText.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.reviewButtonGradient}
              >
                <Text style={styles.reviewButtonText}>{saving ? t.saving : t.saveReview}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Existing Reviews */}
          {book.reviews.length > 0 && (
            <View style={[styles.reviewsList, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
              {(showAllReviews ? book.reviews : book.reviews.slice(0, 3)).map((review) => (
                <View
                  key={review.id}
                  style={[
                    styles.reviewItem,
                    { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' },
                  ]}
                >
                  {editingReviewId === review.id ? (
                    // Edit mode
                    <View style={styles.editReviewForm}>
                      <TextInput
                        style={[
                          styles.reviewInput,
                          {
                            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            color: isDark ? '#FFFFFF' : '#111827',
                          },
                        ]}
                        value={editReviewText}
                        onChangeText={setEditReviewText}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />

                      <Text style={[styles.chapterRangeLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                        {t.rating}
                      </Text>
                      {renderStarRating(editReviewRating, setEditReviewRating)}

                      <Text style={[styles.chapterRangeLabel, { color: isDark ? '#808080' : '#6B7280' }]}>
                        {t.chapterRange}
                      </Text>
                      <View style={styles.chapterRangeRow}>
                        <TextInput
                          style={[
                            styles.chapterInput,
                            {
                              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                              color: isDark ? '#FFFFFF' : '#111827',
                            },
                          ]}
                          placeholder={t.chapterStartPlaceholder}
                          placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                          value={editChapterStart}
                          onChangeText={setEditChapterStart}
                          keyboardType="number-pad"
                        />
                        <Text style={[styles.chapterRangeSeparator, { color: isDark ? '#808080' : '#6B7280' }]}>
                          —
                        </Text>
                        <TextInput
                          style={[
                            styles.chapterInput,
                            {
                              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.08)',
                              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                              color: isDark ? '#FFFFFF' : '#111827',
                            },
                          ]}
                          placeholder={t.chapterEndPlaceholder}
                          placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                          value={editChapterEnd}
                          onChangeText={setEditChapterEnd}
                          keyboardType="number-pad"
                        />
                      </View>

                      <View style={styles.editReviewButtons}>
                        <TouchableOpacity
                          style={[
                            styles.editReviewCancelButton,
                            { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' },
                          ]}
                          onPress={handleCancelEditReview}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.editReviewCancelText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            {t.cancelEdit}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.editReviewSaveButton, { opacity: editReviewText.trim() && !saving ? 1 : 0.5 }]}
                          onPress={handleUpdateReview}
                          disabled={!editReviewText.trim() || saving}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={['#F59E0B', '#D97706']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.editReviewSaveGradient}
                          >
                            <Text style={styles.editReviewSaveText}>
                              {saving ? t.saving : t.save}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    // Display mode
                    <>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewHeaderLeft}>
                          <View style={[styles.reviewChapterBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}>
                            <Text style={[styles.reviewChapterText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                              {formatReviewChapters(review)}
                            </Text>
                          </View>
                          {renderDisplayStars(review.rating)}
                        </View>
                        <View style={styles.reviewActions}>
                          <TouchableOpacity
                            onPress={() => handleStartEditReview(review)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.reviewActionButton}
                          >
                            <IconSymbol name="pencil" size={14} color={isDark ? '#808080' : '#6B7280'} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteReview(review)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.reviewActionButton}
                          >
                            <IconSymbol name="trash" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      <Text style={[styles.reviewContent, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                        {review.content}
                      </Text>
                      <Text style={[styles.reviewDate, { color: isDark ? '#666' : '#9CA3AF' }]}>
                        {formatDateTime(review.createdAt, settings.language)}
                      </Text>
                    </>
                  )}
                </View>
              ))}
              {book.reviews.length > 3 && (
                <TouchableOpacity
                  style={[
                    styles.showMoreButton,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' },
                  ]}
                  onPress={() => setShowAllReviews(!showAllReviews)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.showMoreText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {showAllReviews ? t.showLessReviews : `${t.showAllReviews} (${book.reviews.length})`}
                  </Text>
                  <IconSymbol
                    name={showAllReviews ? 'chevron.up' : 'chevron.down'}
                    size={14}
                    color={isDark ? '#808080' : '#6B7280'}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {book.reviews.length === 0 && (
            <Text style={[styles.emptyText, { color: isDark ? '#666' : '#9CA3AF' }]}>
              {t.noReviews}
            </Text>
          )}
        </View>

        {/* Chapter History Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
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
              <IconSymbol name="clock.fill" size={18} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.chapterHistory}
            </Text>
          </View>

          {loadingChapters ? (
            <ActivityIndicator size="small" color="#6C5CE7" />
          ) : chapters.length === 0 ? (
            <Text style={[styles.emptyText, { color: isDark ? '#666' : '#9CA3AF' }]}>
              {t.noChapters}
            </Text>
          ) : (
            <View style={styles.chapterList}>
              {chapters.slice(0, visibleChaptersCount).map((chapter) => (
                <View
                  key={chapter.id}
                  style={[styles.chapterRow, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' }]}
                >
                  <View style={styles.chapterInfo}>
                    <View style={[styles.chapterDot, { backgroundColor: '#6C5CE7' }]} />
                    <Text style={[styles.chapterNumber, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                      {t.chapter} {chapter.chapterNumber}
                    </Text>
                  </View>
                  <Text style={[styles.chapterDate, { color: isDark ? '#666' : '#9CA3AF' }]}>
                    {formatDateTime(chapter.finishedAt, settings.language)}
                  </Text>
                </View>
              ))}
              {chapters.length > visibleChaptersCount && (
                <TouchableOpacity
                  style={[
                    styles.showMoreButton,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' },
                  ]}
                  onPress={() => setVisibleChaptersCount((prev) => prev + 10)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.showMoreText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {t.showMore} ({chapters.length - visibleChaptersCount})
                  </Text>
                  <IconSymbol name="chevron.down" size={14} color={isDark ? '#808080' : '#6B7280'} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Delete Button */}
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
    padding: 20,
    gap: 16,
    paddingBottom: 40,
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
  card: {
    borderWidth: 1,
    borderRadius: 20,
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
  progressText: {
    fontSize: 28,
    fontWeight: '700',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontWeight: '600',
    width: 44,
    textAlign: 'right',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewActionButton: {
    padding: 4,
  },
  starRatingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  displayStarsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  editReviewForm: {
    gap: 12,
  },
  editReviewButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  editReviewCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  editReviewCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  editReviewSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  editReviewSaveGradient: {
    padding: 12,
    alignItems: 'center',
  },
  editReviewSaveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewChapterBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reviewChapterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  reviewDate: {
    fontSize: 12,
  },
  addReviewForm: {
    gap: 12,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    minHeight: 100,
  },
  chapterRangeLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  chapterRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlign: 'center',
  },
  chapterRangeSeparator: {
    fontSize: 18,
    fontWeight: '500',
  },
  chapterRangeHint: {
    fontSize: 12,
  },
  reviewButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  reviewButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chapterList: {
    gap: 0,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 12,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chapterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chapterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chapterNumber: {
    fontSize: 15,
    fontWeight: '500',
  },
  chapterDate: {
    fontSize: 13,
  },
  deleteButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
  editToggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  editToggleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editForm: {
    gap: 12,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  editCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  editSaveButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  editSaveGradient: {
    padding: 14,
    alignItems: 'center',
  },
  editSaveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  editPreview: {
    gap: 8,
  },
  editPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editPreviewLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  editPreviewValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
