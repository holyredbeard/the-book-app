import { create } from 'zustand'
import type { Conversation } from '@/types/conversation'
import { saveConversations, loadConversations, clearDatabase } from '@/lib/database'

interface ConversationState {
  conversations: Conversation[]
  selectedConversationId: string | null
  isLoading: boolean
  loadingProgress: number
  loadingStatus: string
  isInitialized: boolean
  
  setConversations: (conversations: Conversation[]) => void
  addConversations: (conversations: Conversation[]) => void
  clearConversations: () => void
  setSelectedConversationId: (id: string | null) => void
  setLoading: (loading: boolean) => void
  setLoadingProgress: (progress: number) => void
  setLoadingStatus: (status: string) => void
  initializeFromDB: () => Promise<void>
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  selectedConversationId: null,
  isLoading: false,
  loadingProgress: 0,
  loadingStatus: '',
  isInitialized: false,
  
  setConversations: async (conversations) => {
    set({ conversations })
    // Save to IndexedDB and wait for completion
    try {
      await saveConversations(conversations)
      console.log('Saved', conversations.length, 'conversations to database')
    } catch (e) {
      console.error('Failed to save to database:', e)
    }
  },
  addConversations: (newConversations) => 
    set((state) => ({ 
      conversations: [...state.conversations, ...newConversations] 
    })),
  clearConversations: async () => {
    set({ conversations: [], selectedConversationId: null })
    try {
      await clearDatabase()
    } catch (e) {
      console.error('Failed to clear database:', e)
    }
  },
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  setLoading: (isLoading) => set({ isLoading }),
  setLoadingProgress: (loadingProgress) => set({ loadingProgress }),
  setLoadingStatus: (loadingStatus) => set({ loadingStatus }),
  initializeFromDB: async () => {
    if (get().isInitialized) return
    try {
      set({ isLoading: true, loadingStatus: 'Laddar från databas...' })
      console.log('Loading conversations from database...')
      const conversations = await loadConversations()
      console.log('Loaded', conversations.length, 'conversations from database')
      set({ 
        conversations, 
        isInitialized: true,
        isLoading: false,
        loadingStatus: ''
      })
    } catch (e) {
      console.error('Failed to load from database:', e)
      set({ isInitialized: true, isLoading: false })
    }
  },
}))
