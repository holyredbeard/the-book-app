import { useState, useMemo } from 'react'
import { Download, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChapterSidebar } from './ChapterSidebar'
import { NoteCard } from './NoteCard'
import { ChapterManager } from './ChapterManager'
import { useBookChapterStore } from '@/store/bookChapterStore'
import { useBookNoteStore } from '@/store/bookNoteStore'
import { exportChapterToMarkdown } from '@/lib/exportMarkdown'

interface BookNotesViewProps {
  onNavigateToConversation: (conversationId: string) => void
}

export function BookNotesView({ onNavigateToConversation }: BookNotesViewProps) {
  const { chapters, selectedChapterId } = useBookChapterStore()
  const { notes } = useBookNoteStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [isManagingChapters, setIsManagingChapters] = useState(false)

  const selectedChapter = useMemo(() => {
    if (selectedChapterId === null) return null
    return chapters.find(c => c.id === selectedChapterId) || null
  }, [chapters, selectedChapterId])

  const chapterNotes = useMemo(() => {
    let filtered = notes
      .filter(n => n.chapterId === selectedChapterId)
      .sort((a, b) => a.order - b.order)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        n => n.text.toLowerCase().includes(query) || n.comment.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [notes, selectedChapterId, searchQuery])

  const handleExport = () => {
    const chapterTitle = selectedChapter?.title || 'Osorterade'
    const markdown = exportChapterToMarkdown(chapterTitle, chapterNotes)
    
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(chapterTitle)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex">
      {/* Chapter sidebar */}
      <ChapterSidebar onManageChapters={() => setIsManagingChapters(true)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">
              {selectedChapter?.title || 'Osorterade'}
            </h2>
            {selectedChapter?.description && (
              <p className="text-sm text-muted-foreground">{selectedChapter.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Sök i anteckningar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={chapterNotes.length === 0}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportera MD
            </Button>
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-4">
          {chapterNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Plus className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">
                {searchQuery
                  ? 'Inga anteckningar matchar sökningen'
                  : 'Inga anteckningar i detta kapitel ännu'}
              </p>
              <p className="text-sm mt-2 text-center max-w-md">
                Markera text i en konversation eller AI-svar och klicka "Spara till boken" för att lägga till anteckningar.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-w-3xl">
              {chapterNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onNavigateToSource={onNavigateToConversation}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chapter manager modal */}
      {isManagingChapters && (
        <ChapterManager onClose={() => setIsManagingChapters(false)} />
      )}
    </div>
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
