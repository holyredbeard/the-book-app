import { useState } from 'react'
import { Plus, Settings, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useBookChapterStore } from '@/store/bookChapterStore'
import { useBookNoteStore } from '@/store/bookNoteStore'

interface ChapterSidebarProps {
  onManageChapters: () => void
}

export function ChapterSidebar({ onManageChapters }: ChapterSidebarProps) {
  const { chapters, selectedChapterId, setSelectedChapterId, addChapter, updateChapter } = useBookChapterStore()
  const { notes } = useBookNoteStore()
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)
  
  const unsortedCount = notes.filter(n => n.chapterId === null).length
  
  const getChapterNoteCount = (chapterId: string) => {
    return notes.filter(n => n.chapterId === chapterId).length
  }

  const handleCreateChapter = () => {
    if (!newTitle.trim()) return
    const newChapter = addChapter(newTitle.trim())
    setSelectedChapterId(newChapter.id)
    setNewTitle('')
    setIsCreating(false)
  }

  const handleStartEdit = (chapterId: string, currentTitle: string) => {
    setEditingChapterId(chapterId)
    setEditingTitle(currentTitle)
  }

  const handleSaveEdit = () => {
    if (!editingChapterId || !editingTitle.trim()) return
    updateChapter(editingChapterId, { title: editingTitle.trim() })
    setEditingChapterId(null)
    setEditingTitle('')
  }

  const handleCancelEdit = () => {
    setEditingChapterId(null)
    setEditingTitle('')
  }

  return (
    <div className="w-56 border-r bg-card/50 h-full flex flex-col">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Kapitel</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Unsorted */}
        <button
          onClick={() => setSelectedChapterId(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
            selectedChapterId === null
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50'
          }`}
        >
          <span className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            Osorterade
          </span>
          {unsortedCount > 0 && (
            <span className="text-xs text-muted-foreground">({unsortedCount})</span>
          )}
        </button>

        {/* Chapters */}
        {sortedChapters.map((chapter) => {
          const noteCount = getChapterNoteCount(chapter.id)
          const isSelected = selectedChapterId === chapter.id
          const isEditing = editingChapterId === chapter.id
          
          if (isEditing) {
            return (
              <div key={chapter.id} className="px-1 py-1">
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit()
                    if (e.key === 'Escape') handleCancelEdit()
                  }}
                  onBlur={handleSaveEdit}
                />
              </div>
            )
          }
          
          return (
            <button
              key={chapter.id}
              onClick={() => setSelectedChapterId(chapter.id)}
              onDoubleClick={() => handleStartEdit(chapter.id, chapter.title)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between transition-colors ${
                isSelected
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              title="Dubbelklicka för att redigera"
            >
              <span className="truncate flex-1">{chapter.title}</span>
              {noteCount > 0 && (
                <span className="text-xs text-muted-foreground ml-2">({noteCount})</span>
              )}
            </button>
          )
        })}

        {/* Create new chapter */}
        {isCreating ? (
          <div className="px-2 py-1">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Kapitelnamn..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateChapter()
                if (e.key === 'Escape') {
                  setIsCreating(false)
                  setNewTitle('')
                }
              }}
              onBlur={() => {
                if (!newTitle.trim()) {
                  setIsCreating(false)
                }
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nytt kapitel
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onManageChapters}
        >
          <Settings className="h-4 w-4" />
          Hantera kapitel
        </Button>
      </div>
    </div>
  )
}
