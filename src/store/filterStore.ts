import { create } from 'zustand'
import type { Teacher } from '@/types/conversation'

interface FilterState {
  searchQuery: string
  showLesterOnly: boolean
  showCustomGPTOnly: boolean
  showStandardOnly: boolean
  teacherFilter: Teacher | 'all'
  
  setSearchQuery: (query: string) => void
  setShowLesterOnly: (show: boolean) => void
  setShowCustomGPTOnly: (show: boolean) => void
  setShowStandardOnly: (show: boolean) => void
  setTeacherFilter: (teacher: Teacher | 'all') => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: '',
  showLesterOnly: false,
  showCustomGPTOnly: false,
  showStandardOnly: false,
  teacherFilter: 'all',
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setShowLesterOnly: (showLesterOnly) => set({ showLesterOnly }),
  setShowCustomGPTOnly: (showCustomGPTOnly) => set({ showCustomGPTOnly }),
  setShowStandardOnly: (showStandardOnly) => set({ showStandardOnly }),
  setTeacherFilter: (teacherFilter) => set({ teacherFilter }),
  resetFilters: () => set({
    searchQuery: '',
    showLesterOnly: false,
    showCustomGPTOnly: false,
    showStandardOnly: false,
    teacherFilter: 'all',
  }),
}))
