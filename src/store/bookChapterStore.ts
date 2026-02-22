import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

// IndexedDB storage for reliable persistence
const DB_NAME = 'BookChaptersDB'
const DB_VERSION = 1
const STORE_NAME = 'storage'

const indexedDBStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => resolve(null)
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        try {
          const transaction = db.transaction(STORE_NAME, 'readonly')
          const store = transaction.objectStore(STORE_NAME)
          const getRequest = store.get(name)
          getRequest.onsuccess = () => {
            console.log('BookChapters loaded from IndexedDB:', name, getRequest.result ? 'found' : 'empty')
            resolve(getRequest.result || null)
          }
          getRequest.onerror = () => resolve(null)
        } catch (e) {
          resolve(null)
        }
      }
    })
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => resolve()
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        try {
          const transaction = db.transaction(STORE_NAME, 'readwrite')
          const store = transaction.objectStore(STORE_NAME)
          store.put(value, name)
          transaction.oncomplete = () => {
            console.log('BookChapters saved to IndexedDB:', name)
            resolve()
          }
          transaction.onerror = () => resolve()
        } catch (e) {
          resolve()
        }
      }
    })
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onerror = () => resolve()
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        try {
          const transaction = db.transaction(STORE_NAME, 'readwrite')
          const store = transaction.objectStore(STORE_NAME)
          store.delete(name)
          transaction.oncomplete = () => resolve()
          transaction.onerror = () => resolve()
        } catch (e) {
          resolve()
        }
      }
    })
  },
}

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
      storage: createJSONStorage(() => indexedDBStorage),
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
