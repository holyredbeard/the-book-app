import { useState } from 'react'
import { X, Pencil, Trash2, GripVertical, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useBookChapterStore } from '@/store/bookChapterStore'
import { useBookNoteStore } from '@/store/bookNoteStore'

interface ChapterManagerProps {
  onClose: () => void
}

export function ChapterManager({ onClose }: ChapterManagerProps) {
  const { chapters, updateChapter, deleteChapter, reorderChapters } = useBookChapterStore()
  const { notes, moveNotesToChapter } = useBookNoteStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

  const getChapterNoteCount = (chapterId: string) => {
    return notes.filter(n => n.chapterId === chapterId).length
  }

  const handleStartEdit = (chapter: { id: string; title: string }) => {
    setEditingId(chapter.id)
    setEditTitle(chapter.title)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editTitle.trim()) return
    updateChapter(editingId, { title: editTitle.trim() })
    setEditingId(null)
    setEditTitle('')
  }

  const handleDelete = (chapterId: string) => {
    const noteCount = getChapterNoteCount(chapterId)
    const chapter = chapters.find(c => c.id === chapterId)
    
    if (noteCount > 0) {
      const confirmed = window.confirm(
        `"${chapter?.title}" har ${noteCount} anteckningar. Vill du flytta dem till "Osorterade" och ta bort kapitlet?`
      )
      if (!confirmed) return
      
      const noteIds = notes.filter(n => n.chapterId === chapterId).map(n => n.id)
      moveNotesToChapter(noteIds, null)
    }
    
    deleteChapter(chapterId)
    toast.success(`Kapitel "${chapter?.title}" borttaget`)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newChapters = [...sortedChapters]
    ;[newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]]
    reorderChapters(newChapters)
  }

  const handleMoveDown = (index: number) => {
    if (index === sortedChapters.length - 1) return
    const newChapters = [...sortedChapters]
    ;[newChapters[index], newChapters[index + 1]] = [newChapters[index + 1], newChapters[index]]
    reorderChapters(newChapters)
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Hantera kapitel</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto">
          {sortedChapters.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Inga kapitel skapade ännu
            </p>
          ) : (
            <div className="space-y-2">
              {sortedChapters.map((chapter, index) => {
                const noteCount = getChapterNoteCount(chapter.id)
                const isEditing = editingId === chapter.id

                return (
                  <div
                    key={chapter.id}
                    className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {/* Reorder buttons */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                      >
                        <GripVertical className="h-3 w-3 rotate-90" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === sortedChapters.length - 1}
                        className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                      >
                        <GripVertical className="h-3 w-3 -rotate-90" />
                      </button>
                    </div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-8"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit()
                              if (e.key === 'Escape') setEditingId(null)
                            }}
                          />
                          <Button size="sm" className="h-8" onClick={handleSaveEdit}>
                            <Check className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="truncate">{chapter.title}</span>
                          {noteCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({noteCount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleStartEdit(chapter)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => handleDelete(chapter.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
