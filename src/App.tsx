import { useState, useEffect } from 'react'
import { BookOpen, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { FileUpload } from '@/components/FileUpload'
import { MainLayout } from '@/components/MainLayout'
import { Settings } from '@/components/Settings'
import { useConversationStore } from '@/store/conversationStore'
import { Button } from '@/components/ui/button'

function App() {
  const { conversations, isInitialized, initializeFromDB, isLoading, loadingStatus } = useConversationStore()
  const hasConversations = conversations.length > 0
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Load conversations from IndexedDB on startup
  useEffect(() => {
    initializeFromDB()
  }, [initializeFromDB])

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Toaster />
      <Settings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Chat Archive Manager</h1>
                <p className="text-sm text-muted-foreground">Bokhjälp</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      {!isInitialized || (isLoading && !hasConversations) ? (
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{loadingStatus || 'Laddar...'}</p>
          </div>
        </main>
      ) : !hasConversations ? (
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">
                Välkommen till Chat Archive Manager
              </h2>
              <p className="text-muted-foreground max-w-md">
                Ladda upp din ChatGPT-export för att hitta och extrahera 
                konversationer om Lester Levenson och andra ämnen.
              </p>
            </div>
            <FileUpload />
          </div>
        </main>
      ) : (
        <MainLayout />
      )}
    </div>
  )
}

export default App
