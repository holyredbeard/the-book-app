import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type NoteStatus = 'unused' | 'used' | 'edited'

export interface BookNote {
  id: string
  chapterId: string | null
  text: string
  originalText: string
  comment: string
  status: NoteStatus
  order: number
  sourceConversationId: string | null
  sourceConversationTitle: string | null
  sourceType: 'conversation' | 'ai-response'
  createdAt: Date
  updatedAt: Date
}

interface BookNoteState {
  notes: BookNote[]
  
  addNote: (params: {
    text: string
    chapterId: string | null
    comment?: string
    sourceConversationId?: string | null
    sourceConversationTitle?: string | null
    sourceType: 'conversation' | 'ai-response'
  }) => BookNote
  
  updateNote: (id: string, updates: Partial<Pick<BookNote, 'text' | 'comment' | 'chapterId'>>) => void
  updateNoteStatus: (id: string, status: NoteStatus) => void
  deleteNote: (id: string) => void
  reorderNotes: (chapterId: string | null, notes: BookNote[]) => void
  moveNotesToChapter: (noteIds: string[], targetChapterId: string | null) => void
  getNotesForChapter: (chapterId: string | null) => BookNote[]
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useBookNoteStore = create<BookNoteState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (params) => {
        const notes = get().notes
        const chapterNotes = notes.filter(n => n.chapterId === params.chapterId)
        const now = new Date()
        
        const newNote: BookNote = {
          id: generateId(),
          chapterId: params.chapterId,
          text: params.text,
          originalText: params.text,
          comment: params.comment || '',
          status: 'unused',
          order: chapterNotes.length,
          sourceConversationId: params.sourceConversationId || null,
          sourceConversationTitle: params.sourceConversationTitle || null,
          sourceType: params.sourceType,
          createdAt: now,
          updatedAt: now,
        }
        
        set({ notes: [...notes, newNote] })
        return newNote
      },

      updateNote: (id, updates) => {
        set({
          notes: get().notes.map(note => {
            if (note.id !== id) return note
            
            const hasTextChanged = updates.text !== undefined && updates.text !== note.text
            return {
              ...note,
              ...updates,
              status: hasTextChanged ? 'edited' : note.status,
              updatedAt: new Date(),
            }
          }),
        })
      },

      updateNoteStatus: (id, status) => {
        set({
          notes: get().notes.map(note =>
            note.id === id ? { ...note, status, updatedAt: new Date() } : note
          ),
        })
      },

      deleteNote: (id) => {
        const notes = get().notes
        const noteToDelete = notes.find(n => n.id === id)
        if (!noteToDelete) return

        set({
          notes: notes
            .filter(n => n.id !== id)
            .map(n => {
              if (n.chapterId === noteToDelete.chapterId && n.order > noteToDelete.order) {
                return { ...n, order: n.order - 1 }
              }
              return n
            }),
        })
      },

      reorderNotes: (chapterId, reorderedNotes) => {
        const otherNotes = get().notes.filter(n => n.chapterId !== chapterId)
        const updatedNotes = reorderedNotes.map((note, index) => ({
          ...note,
          order: index,
        }))
        set({ notes: [...otherNotes, ...updatedNotes] })
      },

      moveNotesToChapter: (noteIds, targetChapterId) => {
        const notes = get().notes
        const targetChapterNotes = notes.filter(n => n.chapterId === targetChapterId)
        let nextOrder = targetChapterNotes.length

        set({
          notes: notes.map(note => {
            if (noteIds.includes(note.id)) {
              return {
                ...note,
                chapterId: targetChapterId,
                order: nextOrder++,
                updatedAt: new Date(),
              }
            }
            return note
          }),
        })
      },

      getNotesForChapter: (chapterId) => {
        return get().notes
          .filter(n => n.chapterId === chapterId)
          .sort((a, b) => a.order - b.order)
      },
    }),
    {
      name: 'book-notes-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.notes) {
          state.notes = state.notes.map(note => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          }))
        }
      },
    }
  )
)
