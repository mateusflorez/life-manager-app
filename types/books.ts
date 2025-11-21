export type Book = {
  id: string;
  name: string;
  totalChapters: number | null;
  isDropped: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BookChapter = {
  id: string;
  bookId: string;
  chapterNumber: number;
  finishedAt: string;
};

export type BookReview = {
  id: string;
  bookId: string;
  content: string;
  chapterStart: number | null;  // null = general review (no specific chapter)
  chapterEnd: number | null;    // null = single chapter, otherwise range
  createdAt: string;
  updatedAt: string;
};

export type BookWithProgress = Book & {
  readChapters: number;
  lastChapter: BookChapter | null;
  reviews: BookReview[];
  isCompleted: boolean;
  isOngoing: boolean;
  progressPercent: number;
};

// Helper functions
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const formatDate = (dateStr: string, language: 'en' | 'pt'): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', options);
};

export const formatDateTime = (dateStr: string, language: 'en' | 'pt'): string => {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', options);
};

export const calculateProgress = (
  book: Book,
  chapters: BookChapter[]
): { readChapters: number; isCompleted: boolean; isOngoing: boolean; progressPercent: number } => {
  const readChapters = chapters.filter((c) => c.bookId === book.id).length;
  const isOngoing = book.totalChapters === null;
  const isCompleted = !isOngoing && !book.isDropped && book.totalChapters !== null && readChapters >= book.totalChapters;
  const progressPercent = isOngoing || book.totalChapters === null || book.totalChapters === 0
    ? 0
    : Math.min(100, Math.round((readChapters / book.totalChapters) * 100));

  return { readChapters, isCompleted, isOngoing, progressPercent };
};

export const BOOK_XP = 20;
