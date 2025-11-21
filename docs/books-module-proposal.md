# Books Module - Layout Proposal

## Overview

A reading tracker module that allows users to register books, track chapter progress, and write reviews. Supports both finite books (with total chapters) and ongoing series (manga, webnovels, etc.).

## Features

### Core Features
- **Book Registration**: Create books with title, optional total chapters, and optional starting chapter
- **Chapter Progress**: Track reading progress with visual progress bar (or counter for ongoing series)
- **Reviews**: Write reviews for books
- **Drop Reading**: Mark a book as "dropped" at the current chapter
- **XP Rewards**: +20 XP per chapter read

### Data Models

```typescript
// types/books.ts

export type Book = {
  id: string;
  name: string;
  totalChapters: number | null;  // null = ongoing series (no end)
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
  createdAt: string;
  updatedAt: string;
};

export type BookWithProgress = Book & {
  readChapters: number;
  lastChapter?: BookChapter;
  review?: BookReview;
  isCompleted: boolean;      // false if totalChapters is null
  isOngoing: boolean;        // true if totalChapters is null
  progressPercent: number;   // 0 if ongoing
};
```

---

## Screen Structure

```
app/
└── books/
    ├── _layout.tsx      # Stack navigation with back button
    ├── index.tsx        # Books overview (list + add button)
    ├── add.tsx          # Add book form (modal)
    └── [id].tsx         # Book detail (chapters, review)
```

---

## Screen Layouts

### 1. Books Overview (`app/books/index.tsx`)

```
┌─────────────────────────────────────┐
│  ←  Books                      [+] │  ← Stack header + add button
├─────────────────────────────────────┤
│                                     │
│  ─── In Progress ──────────────────│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ The Lord of the Rings      3/22││  ← Book with total
│  │ ████████░░░░░░░░░░░░░░░░░  14% ││
│  │ Last: Chapter 3 · 2025-01-15   ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ One Piece               Ch. 1120││  ← Ongoing series
│  │ 📖 Ongoing                      ││
│  │ Last: Chapter 1120 · 2025-01-18 ││
│  └─────────────────────────────────┘│
│                                     │
│  ─── Completed ────────────────────│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Clean Code              12/12  ││
│  │ █████████████████████████ 100% ││
│  │ ✓ Completed                     ││
│  └─────────────────────────────────┘│
│                                     │
│  ─── Dropped ──────────────────────│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Some Book                 5/20 ││
│  │ ⊘ Dropped at chapter 5         ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

### 2. Add Book (`app/books/add.tsx`)

```
┌─────────────────────────────────────┐
│  ←  Add Book                       │  ← Stack header
├─────────────────────────────────────┤
│                                     │
│  Book Title *                       │
│  ┌─────────────────────────────────┐│
│  │ Enter book title...             ││
│  └─────────────────────────────────┘│
│                                     │
│  Total Chapters                     │
│  ┌─────────────────────────────────┐│
│  │ Leave empty for ongoing series  ││
│  └─────────────────────────────────┘│
│  ℹ For manga/series with no end    │
│                                     │
│  Current Chapter                    │
│  ┌─────────────────────────────────┐│
│  │ 0                               ││
│  └─────────────────────────────────┘│
│  ℹ If you've already read some     │
│                                     │
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Add Book                ││  ← Primary button
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

### 3. Book Detail (`app/books/[id].tsx`)

**For books with total chapters:**
```
┌─────────────────────────────────────┐
│  ←  The Lord of the Rings          │  ← Stack header
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Progress                ││
│  │                                 ││
│  │      3 / 22 chapters           ││
│  │  ████████░░░░░░░░░░░░░░░░░ 14% ││
│  │                                 ││
│  │  [  Read Next Chapter  ]       ││  ← Primary button
│  │                                 ││
│  │  [Drop Reading]                ││  ← Secondary/destructive
│  └─────────────────────────────────┘│
│                                     │
│  ─── Chapter History ──────────────│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ Chapter 3      2025-01-15 20:45││
│  │ Chapter 2      2025-01-12 19:30││
│  │ Chapter 1      2025-01-10 21:15││
│  └─────────────────────────────────┘│
│                                     │
│  ─── Review ───────────────────────│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Write your review here...    ]││
│  │ [                             ]││
│  │            [Save Review]       ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

**For ongoing series (no total):**
```
┌─────────────────────────────────────┐
│  ←  One Piece                      │  ← Stack header
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │         Progress                ││
│  │                                 ││
│  │     Chapter 1120                ││
│  │     📖 Ongoing series           ││
│  │                                 ││
│  │  [  Read Next Chapter  ]       ││
│  │                                 ││
│  │  [Stop Following]              ││  ← For ongoing
│  └─────────────────────────────────┘│
│                                     │
│  ─── Chapter History ──────────────│
│  ...                                │
└─────────────────────────────────────┘
```

---

## Component Breakdown

### Book Card Component
```typescript
type BookCardProps = {
  book: BookWithProgress;
  onPress: () => void;
};
```

**Visual states:**
- **In Progress (with total)**: Shows progress bar + percentage
- **Ongoing**: Shows chapter count + "Ongoing" badge
- **Completed**: Shows checkmark + 100%
- **Dropped**: Shows "Dropped at chapter X" indicator

---

## Translations

```typescript
const translations = {
  en: {
    books: 'Books',
    addBook: 'Add Book',
    bookTitle: 'Book Title',
    totalChapters: 'Total Chapters',
    totalChaptersHint: 'Leave empty for ongoing series',
    currentChapter: 'Current Chapter',
    currentChapterHint: "If you've already read some",
    inProgress: 'In Progress',
    completed: 'Completed',
    dropped: 'Dropped',
    noBooks: 'No books yet. Tap + to add your first book!',
    readNextChapter: 'Read Next Chapter',
    progress: 'Progress',
    chapters: 'chapters',
    chapter: 'Chapter',
    chapterHistory: 'Chapter History',
    review: 'Review',
    reviewPlaceholder: 'Share your thoughts about this book...',
    saveReview: 'Save Review',
    dropReading: 'Drop Reading',
    stopFollowing: 'Stop Following',
    dropConfirm: 'Mark this book as dropped at chapter {chapter}?',
    completedBadge: 'Completed',
    droppedAt: 'Dropped at chapter {chapter}',
    ongoing: 'Ongoing series',
    lastChapter: 'Last: Chapter {chapter}',
    chapterLogged: 'Chapter {chapter} logged! +20 XP',
    bookCreated: 'Book added!',
    reviewSaved: 'Review saved!',
    dropSaved: 'Reading marked as dropped.',
    allChaptersRead: 'All chapters read!',
    titleRequired: 'Please enter a book title',
    delete: 'Delete Book',
    deleteConfirm: 'Are you sure you want to delete this book?',
    deleted: 'Book deleted',
    edit: 'Edit',
    save: 'Save',
  },
  pt: {
    books: 'Livros',
    addBook: 'Adicionar Livro',
    bookTitle: 'Título do Livro',
    totalChapters: 'Total de Capítulos',
    totalChaptersHint: 'Deixe vazio para séries em andamento',
    currentChapter: 'Capítulo Atual',
    currentChapterHint: 'Se você já leu alguns',
    inProgress: 'Em Progresso',
    completed: 'Concluídos',
    dropped: 'Abandonados',
    noBooks: 'Nenhum livro ainda. Toque em + para adicionar!',
    readNextChapter: 'Ler Próximo Capítulo',
    progress: 'Progresso',
    chapters: 'capítulos',
    chapter: 'Capítulo',
    chapterHistory: 'Histórico de Capítulos',
    review: 'Resenha',
    reviewPlaceholder: 'Compartilhe o que achou do livro...',
    saveReview: 'Salvar Resenha',
    dropReading: 'Abandonar Leitura',
    stopFollowing: 'Parar de Acompanhar',
    dropConfirm: 'Marcar este livro como abandonado no capítulo {chapter}?',
    completedBadge: 'Concluído',
    droppedAt: 'Abandonado no capítulo {chapter}',
    ongoing: 'Série em andamento',
    lastChapter: 'Último: Capítulo {chapter}',
    chapterLogged: 'Capítulo {chapter} registrado! +20 XP',
    bookCreated: 'Livro adicionado!',
    reviewSaved: 'Resenha salva!',
    dropSaved: 'Leitura marcada como abandonada.',
    allChaptersRead: 'Todos os capítulos lidos!',
    titleRequired: 'Por favor, insira o título do livro',
    delete: 'Excluir Livro',
    deleteConfirm: 'Tem certeza que deseja excluir este livro?',
    deleted: 'Livro excluído',
    edit: 'Editar',
    save: 'Salvar',
  },
};
```

---

## Storage Keys

```typescript
// AsyncStorage keys
const STORAGE_KEYS = {
  BOOKS: '@life_manager_books',
  BOOK_CHAPTERS: '@life_manager_book_chapters',
  BOOK_REVIEWS: '@life_manager_book_reviews',
};
```

---

## Context API

```typescript
// contexts/books-context.tsx

type BooksContextType = {
  // State
  books: BookWithProgress[];
  loading: boolean;

  // Book actions
  createBook: (name: string, totalChapters: number | null, currentChapter?: number) => Promise<Book>;
  logChapter: (bookId: string) => Promise<void>;
  dropBook: (bookId: string) => Promise<void>;
  saveReview: (bookId: string, content: string) => Promise<void>;
  deleteBook: (bookId: string) => Promise<void>;
  updateBook: (bookId: string, updates: Partial<Book>) => Promise<void>;

  // Computed
  inProgressBooks: BookWithProgress[];
  completedBooks: BookWithProgress[];
  droppedBooks: BookWithProgress[];
  ongoingBooks: BookWithProgress[];
  totalBooksRead: number;
  totalChaptersRead: number;
};
```

### Create Book Logic

```typescript
const createBook = async (
  name: string,
  totalChapters: number | null,
  currentChapter: number = 0
) => {
  const book = {
    id: generateId(),
    name,
    totalChapters,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save book
  await saveBook(book);

  // If currentChapter > 0, create chapter entries and award XP
  if (currentChapter > 0) {
    const now = new Date();
    for (let i = 1; i <= currentChapter; i++) {
      await saveChapter({
        id: generateId(),
        bookId: book.id,
        chapterNumber: i,
        // All logged at creation time, slightly offset for ordering
        finishedAt: new Date(now.getTime() - (currentChapter - i) * 1000).toISOString(),
      });
    }
    // Award XP for all initial chapters
    await addXp(currentChapter * 20);
  }

  return book;
};
```

---

## Home Screen Integration

Add Books card to home screen when module is enabled:

```
┌─────────────────────────────────────┐
│ 📚 Books                           │
│                                     │
│ 3 in progress · 2 ongoing          │
│ 147 chapters read                  │
│                                     │
│ Currently reading:                 │
│ One Piece (Ch. 1120)               │
└─────────────────────────────────────┘
```

---

## Settings Integration

Add to `types/settings.ts`:

```typescript
type ModulesConfig = {
  finance: boolean;
  investments: boolean;
  tasks: boolean;
  books: boolean;  // ← Add this
};
```

---

## File Structure

```
app/
├── books/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── add.tsx
│   └── [id].tsx
│
contexts/
└── books-context.tsx

services/
└── books-storage.ts

types/
└── books.ts
```

---

## Implementation Priority

1. **Phase 1 - Core**
   - [ ] Create data types
   - [ ] Create storage service
   - [ ] Create context provider
   - [ ] Add to settings module toggle

2. **Phase 2 - Screens**
   - [ ] Books overview screen
   - [ ] Add book screen (modal)
   - [ ] Book card component
   - [ ] Book detail screen

3. **Phase 3 - Features**
   - [ ] Reviews
   - [ ] Drop/stop following feature
   - [ ] Edit book (update total chapters)

4. **Phase 4 - Integration**
   - [ ] Home screen card
   - [ ] XP integration (+20 per chapter)
   - [ ] Profile stats

---

## Color Scheme

| Element | Color |
|---------|-------|
| Progress bar fill | `#6C5CE7` (purple) |
| Completed indicator | `#10B981` (green) |
| Ongoing badge | `#36A2EB` (blue) |
| Dropped indicator | `#F59E0B` (amber) |
| Read chapter button | `#007AFF` (blue) |
| Drop/Stop button | `#EF4444` (red) |

---

## Notes

- Books are grouped by status: In Progress → Completed → Dropped
- Within groups, sorted by last activity (most recent first)
- `totalChapters: null` means ongoing series (manga, webnovel, etc.)
- Ongoing series can never be "completed", only "stopped following"
- XP is awarded immediately when logging a chapter (+20 XP each)
- When creating a book with `currentChapter > 0`, XP is awarded for all initial chapters
- Reviews can be edited anytime
- "Drop reading" for finite books = mark as abandoned
- "Stop following" for ongoing series = same as drop, but different wording
