import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BookChapter {
  id: string
  title: string
  description: string
  order: number
  createdAt: Date
}

interface BookChapterState {
  chapters: BookChapter[]
  selectedChapterId: string | null
  
  addChapter: (title: string, description?: string) => BookChapter
  updateChapter: (id: string, updates: Partial<Pick<BookChapter, 'title' | 'description'>>) => void
  deleteChapter: (id: string) => void
  reorderChapters: (chapters: BookChapter[]) => void
  setSelectedChapterId: (id: string | null) => void
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useBookChapterStore = create<BookChapterState>()(
  persist(
    (set, get) => ({
      chapters: [],
      selectedChapterId: null,

      addChapter: (title, description = '') => {
        const chapters = get().chapters
        const newChapter: BookChapter = {
          id: generateId(),
          title,
          description,
          order: chapters.length,
          createdAt: new Date(),
        }
        set({ chapters: [...chapters, newChapter] })
        return newChapter
      },

      updateChapter: (id, updates) => {
        set({
          chapters: get().chapters.map(ch =>
            ch.id === id ? { ...ch, ...updates } : ch
          ),
        })
      },

      deleteChapter: (id) => {
        set({
          chapters: get().chapters
            .filter(ch => ch.id !== id)
            .map((ch, index) => ({ ...ch, order: index })),
        })
      },

      reorderChapters: (chapters) => {
        set({
          chapters: chapters.map((ch, index) => ({ ...ch, order: index })),
        })
      },

      setSelectedChapterId: (id) => {
        set({ selectedChapterId: id })
      },
    }),
    {
      name: 'book-chapters-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.chapters) {
          state.chapters = state.chapters.map(ch => ({
            ...ch,
            createdAt: new Date(ch.createdAt),
          }))
        }
      },
    }
  )
)
