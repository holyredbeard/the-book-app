import { useState, useMemo } from 'react'
import { Search, PanelLeftClose, PanelLeft, Sparkles, BookOpen } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { Sidebar } from '@/components/Sidebar'
import { ConversationTable } from '@/components/ConversationTable'
import { MarkdownPreview } from '@/components/MarkdownPreview'
import { FileUpload } from '@/components/FileUpload'
import { AskAI } from '@/components/AskAI'
import { BookNotesView } from '@/components/book/BookNotesView'
import { useConversationStore } from '@/store/conversationStore'
import { useFilterStore } from '@/store/filterStore'
import type { Conversation } from '@/types/conversation'

type ViewMode = 'conversations' | 'ai' | 'book'

export function MainLayout() {
  const { conversations, selectedConversationId, setSelectedConversationId } = useConversationStore()
  const { searchQuery, setSearchQuery, showLesterOnly, showCustomGPTOnly, showStandardOnly } = useFilterStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('conversations')

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return null
    return conversations.find(c => c.id === selectedConversationId) || null
  }, [conversations, selectedConversationId])

  // Get filtered conversations for navigation
  const filteredConversations = useMemo(() => {
    let result = conversations

    if (showLesterOnly || showCustomGPTOnly || showStandardOnly) {
      result = result.filter(c => {
        if (showLesterOnly && c.isLester) return true
        if (showCustomGPTOnly && !c.isLester && c.gizmoId) return true
        if (showStandardOnly && !c.gizmoId) return true
        return false
      })
    }

    // Sort by date descending
    return [...result].sort((a, b) => b.createTime.getTime() - a.createTime.getTime())
  }, [conversations, showLesterOnly, showCustomGPTOnly, showStandardOnly])

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id)
  }

  const handleClosePreview = () => {
    setSelectedConversationId(null)
  }

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col">
      {/* Top bar */}
      <div className="border-b bg-card/50 px-4 py-3 flex items-center gap-4">
        <Button
          variant={sidebarOpen ? "ghost" : "outline"}
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="gap-2"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeft className="h-4 w-4" />
          )}
          {!sidebarOpen && <span>Filter</span>}
        </Button>

        {viewMode === 'conversations' && (
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök i konversationer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {viewMode === 'ai' && (
          <div className="flex-1 text-center">
            <span className="text-sm text-muted-foreground">AI-läge aktivt - ställ frågor om ditt arkiv</span>
          </div>
        )}

        {viewMode === 'book' && (
          <div className="flex-1 text-center">
            <span className="text-sm text-muted-foreground">Bokanteckningar - organisera material till din bok</span>
          </div>
        )}

        <Button
          variant={viewMode === 'ai' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode(viewMode === 'ai' ? 'conversations' : 'ai')}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {viewMode === 'ai' ? "Stäng AI" : "Fråga AI"}
        </Button>

        <Button
          variant={viewMode === 'book' ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode(viewMode === 'book' ? 'conversations' : 'book')}
          className="gap-2"
        >
          <BookOpen className="h-4 w-4" />
          {viewMode === 'book' ? "Stäng" : "Bokanteckningar"}
        </Button>

        <FileUpload compact />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - only show in conversations mode */}
        {viewMode === 'conversations' && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        {viewMode === 'ai' ? (
          /* AI Mode */
          <AskAI onSelectConversation={(id) => {
            setViewMode('conversations')
            setSelectedConversationId(id)
          }} />
        ) : viewMode === 'book' ? (
          /* Book Notes Mode */
          <BookNotesView onNavigateToConversation={(id) => {
            setViewMode('conversations')
            setSelectedConversationId(id)
          }} />
        ) : (
          /* Normal Mode - Main panel group */
          <ResizablePanelGroup orientation="horizontal" className="flex-1">
            {/* Table panel */}
            <ResizablePanel defaultSize={selectedConversation ? 50 : 100} minSize={30}>
              <ConversationTable
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversationId}
              />
            </ResizablePanel>

            {/* Preview panel */}
            {selectedConversation && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50} minSize={30}>
                  <MarkdownPreview
                    conversation={selectedConversation}
                    conversations={filteredConversations}
                    onNavigate={handleSelectConversation}
                    onClose={handleClosePreview}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  )
}
