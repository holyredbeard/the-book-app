import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  deepseekApiKey: string
  setDeepseekApiKey: (key: string) => void
  clearSettings: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      deepseekApiKey: '',
      setDeepseekApiKey: (deepseekApiKey) => set({ deepseekApiKey }),
      clearSettings: () => set({ deepseekApiKey: '' }),
    }),
    {
      name: 'chat-archive-settings',
    }
  )
)
