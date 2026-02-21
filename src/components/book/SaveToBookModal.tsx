import { useState, useEffect } from 'react'
import { BookOpen, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBookChapterStore } from '@/store/bookChapterStore'
import { useBookNoteStore } from '@/store/bookNoteStore'

interface SaveToBookModalProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  sourceConversationId?: string | null
  sourceConversationTitle?: string | null
  sourceType: 'conversation' | 'ai-response'
}

export function SaveToBookModal({
  isOpen,
  onClose,
  selectedText,
  sourceConversationId,
  sourceConversationTitle,
  sourceType,
}: SaveToBookModalProps) {
  const { chapters, addChapter } = useBookChapterStore()
  const { addNote } = useBookNoteStore()
  
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [isCreatingChapter, setIsCreatingChapter] = useState(false)
  const [newChapterTitle, setNewChapterTitle] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSelectedChapterId(null)
      setComment('')
      setIsCreatingChapter(false)
      setNewChapterTitle('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    addNote({
      text: selectedText,
      chapterId: selectedChapterId,
      comment,
      sourceConversationId,
      sourceConversationTitle,
      sourceType,
    })

    const chapterName = selectedChapterId
      ? chapters.find(c => c.id === selectedChapterId)?.title
      : 'Osorterade'
    
    toast.success(`Sparat till ${chapterName}`)
    onClose()
  }

  const handleCreateChapter = () => {
    if (!newChapterTitle.trim()) return
    
    const newChapter = addChapter(newChapterTitle.trim())
    setSelectedChapterId(newChapter.id)
    setIsCreatingChapter(false)
    setNewChapterTitle('')
    toast.success(`Kapitel "${newChapter.title}" skapat`)
  }

  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card 
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-purple-400" />
            Spara till boken
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Preview of selected text */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Markerad text
            </Label>
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-md p-3 max-h-32 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{selectedText}</p>
            </div>
            {selectedText.length > 2000 && (
              <p className="text-xs text-amber-400 mt-1">
                ⚠️ Lång text ({selectedText.length} tecken) – överväg att dela upp
              </p>
            )}
          </div>

          {/* Chapter selection */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Kapitel
            </Label>
            
            {isCreatingChapter ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Kapitelnamn..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateChapter()
                    if (e.key === 'Escape') setIsCreatingChapter(false)
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateChapter} disabled={!newChapterTitle.trim()}>
                  Skapa
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsCreatingChapter(false)}>
                  Avbryt
                </Button>
              </div>
            ) : (
              <Select
                value={selectedChapterId || 'unsorted'}
                onValueChange={(value) => {
                  if (value === 'new') {
                    setIsCreatingChapter(true)
                  } else if (value === 'unsorted') {
                    setSelectedChapterId(null)
                  } else {
                    setSelectedChapterId(value)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kapitel..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unsorted">
                    <span className="text-muted-foreground">Osorterade</span>
                  </SelectItem>
                  {sortedChapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">
                    <span className="flex items-center gap-1 text-purple-400">
                      <Plus className="h-3 w-3" />
                      Skapa nytt kapitel
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">
              Kommentar (valfritt)
            </Label>
            <Textarea
              placeholder="T.ex. 'Bra för inledningen' eller 'Exempel på surrender'"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={!selectedText.trim()}>
              Spara till kapitlet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
