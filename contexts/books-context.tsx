import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Book, BookChapter, BookReview, BookWithProgress } from '@/types/books';
import { generateId, calculateProgress, BOOK_XP } from '@/types/books';
import {
  loadBooks,
  saveBook,
  deleteBook as deleteBookStorage,
  loadChapters,
  saveChapter,
  loadReviews,
  saveReview as saveReviewStorage,
  deleteReview as deleteReviewStorage,
} from '@/services/books-storage';
import { useAccount } from '@/contexts/account-context';

type BooksContextType = {
  books: BookWithProgress[];
  loading: boolean;
  createBook: (name: string, totalChapters: number | null, currentChapter?: number) => Promise<Book>;
  logChapter: (bookId: string) => Promise<void>;
  dropBook: (bookId: string) => Promise<void>;
  addReview: (bookId: string, content: string, chapterStart: number | null, chapterEnd: number | null) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;
  getBook: (bookId: string) => BookWithProgress | undefined;
  inProgressBooks: BookWithProgress[];
  completedBooks: BookWithProgress[];
  droppedBooks: BookWithProgress[];
  totalChaptersRead: number;
  chaptersReadThisMonth: number;
};

const BooksContext = createContext<BooksContextType | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [rawBooks, setRawBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<BookChapter[]>([]);
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [loading, setLoading] = useState(true);
  const { addXp } = useAccount();

  const loadData = useCallback(async () => {
    try {
      const [booksData, chaptersData, reviewsData] = await Promise.all([
        loadBooks(),
        loadChapters(),
        loadReviews(),
      ]);
      setRawBooks(booksData);
      setChapters(chaptersData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading books data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const books = useMemo<BookWithProgress[]>(() => {
    return rawBooks.map((book) => {
      const bookChapters = chapters.filter((c) => c.bookId === book.id);
      const progress = calculateProgress(book, bookChapters);
      const lastChapter = bookChapters.length > 0
        ? bookChapters.reduce((latest, c) =>
            c.chapterNumber > latest.chapterNumber ? c : latest
          )
        : null;
      const bookReviews = reviews
        .filter((r) => r.bookId === book.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return {
        ...book,
        ...progress,
        lastChapter,
        reviews: bookReviews,
      };
    });
  }, [rawBooks, chapters, reviews]);

  const inProgressBooks = useMemo(() => {
    return books
      .filter((b) => !b.isCompleted && !b.isDropped)
      .sort((a, b) => {
        const aTime = a.lastChapter?.finishedAt ?? a.createdAt;
        const bTime = b.lastChapter?.finishedAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [books]);

  const completedBooks = useMemo(() => {
    return books
      .filter((b) => b.isCompleted && !b.isDropped)
      .sort((a, b) => {
        const aTime = a.lastChapter?.finishedAt ?? a.createdAt;
        const bTime = b.lastChapter?.finishedAt ?? b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [books]);

  const droppedBooks = useMemo(() => {
    return books
      .filter((b) => b.isDropped)
      .sort((a, b) => {
        const aTime = a.updatedAt;
        const bTime = b.updatedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
  }, [books]);

  const totalChaptersRead = useMemo(() => chapters.length, [chapters]);

  const chaptersReadThisMonth = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return chapters.filter((c) => {
      const date = new Date(c.finishedAt);
      return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    }).length;
  }, [chapters]);

  const createBook = useCallback(
    async (name: string, totalChapters: number | null, currentChapter: number = 0): Promise<Book> => {
      const now = new Date().toISOString();
      const book: Book = {
        id: generateId(),
        name,
        totalChapters,
        isDropped: false,
        createdAt: now,
        updatedAt: now,
      };

      await saveBook(book);
      setRawBooks((prev) => [...prev, book]);

      if (currentChapter > 0) {
        const newChapters: BookChapter[] = [];
        const baseTime = new Date();

        for (let i = 1; i <= currentChapter; i++) {
          const chapter: BookChapter = {
            id: generateId(),
            bookId: book.id,
            chapterNumber: i,
            finishedAt: new Date(baseTime.getTime() - (currentChapter - i) * 1000).toISOString(),
          };
          await saveChapter(chapter);
          newChapters.push(chapter);
        }

        setChapters((prev) => [...prev, ...newChapters]);
        await addXp(currentChapter * BOOK_XP);
      }

      return book;
    },
    [addXp]
  );

  const logChapter = useCallback(
    async (bookId: string) => {
      const book = books.find((b) => b.id === bookId);
      if (!book) return;

      if (!book.isOngoing && book.totalChapters !== null && book.readChapters >= book.totalChapters) {
        return;
      }

      const nextChapterNumber = book.readChapters + 1;
      const chapter: BookChapter = {
        id: generateId(),
        bookId,
        chapterNumber: nextChapterNumber,
        finishedAt: new Date().toISOString(),
      };

      await saveChapter(chapter);
      setChapters((prev) => [...prev, chapter]);
      await addXp(BOOK_XP);
    },
    [books, addXp]
  );

  const dropBook = useCallback(async (bookId: string) => {
    const book = rawBooks.find((b) => b.id === bookId);
    if (!book) return;

    const updatedBook: Book = {
      ...book,
      isDropped: true,
      updatedAt: new Date().toISOString(),
    };

    await saveBook(updatedBook);
    setRawBooks((prev) => prev.map((b) => (b.id === bookId ? updatedBook : b)));
  }, [rawBooks]);

  const addReview = useCallback(async (
    bookId: string,
    content: string,
    chapterStart: number | null,
    chapterEnd: number | null
  ) => {
    const now = new Date().toISOString();

    const review: BookReview = {
      id: generateId(),
      bookId,
      content,
      chapterStart,
      chapterEnd,
      createdAt: now,
      updatedAt: now,
    };

    await saveReviewStorage(review);
    setReviews((prev) => [...prev, review]);
  }, []);

  const deleteReview = useCallback(async (reviewId: string) => {
    await deleteReviewStorage(reviewId);
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  }, []);

  const deleteBook = useCallback(async (bookId: string) => {
    await deleteBookStorage(bookId);
    setRawBooks((prev) => prev.filter((b) => b.id !== bookId));
    setChapters((prev) => prev.filter((c) => c.bookId !== bookId));
    setReviews((prev) => prev.filter((r) => r.bookId !== bookId));
  }, []);

  const updateBook = useCallback(async (bookId: string, updates: Partial<Book>) => {
    const book = rawBooks.find((b) => b.id === bookId);
    if (!book) return;

    const updatedBook: Book = {
      ...book,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await saveBook(updatedBook);
    setRawBooks((prev) => prev.map((b) => (b.id === bookId ? updatedBook : b)));
  }, [rawBooks]);

  const getBook = useCallback(
    (bookId: string) => books.find((b) => b.id === bookId),
    [books]
  );

  const value = useMemo(
    () => ({
      books,
      loading,
      createBook,
      logChapter,
      dropBook,
      addReview,
      deleteReview,
      deleteBook,
      updateBook,
      getBook,
      inProgressBooks,
      completedBooks,
      droppedBooks,
      totalChaptersRead,
      chaptersReadThisMonth,
    }),
    [
      books,
      loading,
      createBook,
      logChapter,
      dropBook,
      addReview,
      deleteReview,
      deleteBook,
      updateBook,
      getBook,
      inProgressBooks,
      completedBooks,
      droppedBooks,
      totalChaptersRead,
      chaptersReadThisMonth,
    ]
  );

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (!context) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}
