import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Book, BookChapter, BookReview } from '@/types/books';

const STORAGE_KEYS = {
  BOOKS: '@life_manager_books',
  BOOK_CHAPTERS: '@life_manager_book_chapters',
  BOOK_REVIEWS: '@life_manager_book_reviews',
};

// Books
export const loadBooks = async (): Promise<Book[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOKS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading books:', error);
    return [];
  }
};

export const saveBooks = async (books: Book[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  } catch (error) {
    console.error('Error saving books:', error);
    throw error;
  }
};

export const saveBook = async (book: Book): Promise<void> => {
  const books = await loadBooks();
  const index = books.findIndex((b) => b.id === book.id);
  if (index >= 0) {
    books[index] = book;
  } else {
    books.push(book);
  }
  await saveBooks(books);
};

export const deleteBook = async (bookId: string): Promise<void> => {
  const books = await loadBooks();
  const filtered = books.filter((b) => b.id !== bookId);
  await saveBooks(filtered);

  // Also delete related chapters and reviews
  const chapters = await loadChapters();
  const filteredChapters = chapters.filter((c) => c.bookId !== bookId);
  await saveChapters(filteredChapters);

  const reviews = await loadReviews();
  const filteredReviews = reviews.filter((r) => r.bookId !== bookId);
  await saveReviews(filteredReviews);
};

// Chapters
export const loadChapters = async (): Promise<BookChapter[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOK_CHAPTERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading chapters:', error);
    return [];
  }
};

export const saveChapters = async (chapters: BookChapter[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOK_CHAPTERS, JSON.stringify(chapters));
  } catch (error) {
    console.error('Error saving chapters:', error);
    throw error;
  }
};

export const saveChapter = async (chapter: BookChapter): Promise<void> => {
  const chapters = await loadChapters();
  chapters.push(chapter);
  await saveChapters(chapters);
};

export const getChaptersForBook = async (bookId: string): Promise<BookChapter[]> => {
  const chapters = await loadChapters();
  return chapters
    .filter((c) => c.bookId === bookId)
    .sort((a, b) => b.chapterNumber - a.chapterNumber);
};

// Reviews
export const loadReviews = async (): Promise<BookReview[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.BOOK_REVIEWS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading reviews:', error);
    return [];
  }
};

export const saveReviews = async (reviews: BookReview[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.BOOK_REVIEWS, JSON.stringify(reviews));
  } catch (error) {
    console.error('Error saving reviews:', error);
    throw error;
  }
};

export const saveReview = async (review: BookReview): Promise<void> => {
  const reviews = await loadReviews();
  const index = reviews.findIndex((r) => r.id === review.id);
  if (index >= 0) {
    reviews[index] = review;
  } else {
    reviews.push(review);
  }
  await saveReviews(reviews);
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  const reviews = await loadReviews();
  const filtered = reviews.filter((r) => r.id !== reviewId);
  await saveReviews(filtered);
};

export const getReviewsForBook = async (bookId: string): Promise<BookReview[]> => {
  const reviews = await loadReviews();
  return reviews
    .filter((r) => r.bookId === bookId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
