import { useState, useMemo } from 'react'
import { Check, Pencil, Trash2, ExternalLink, GripVertical, FolderInput } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useBookNoteStore, type BookNote, type NoteStatus } from '@/store/bookNoteStore'
import { useBookChapterStore } from '@/store/bookChapterStore'
import { useConversationStore } from '@/store/conversationStore'

interface FormattedNoteTextProps {
  text: string
  onNavigateToSource?: (conversationId: string) => void
  noteSourceId?: string | null
}

function FormattedNoteText({ text, onNavigateToSource, noteSourceId }: FormattedNoteTextProps) {
  const { conversations } = useConversationStore()
  
  // Function to find conversation ID by title
  const findConversationByTitle = (title: string): string | null => {
    const normalized = title.toLowerCase().trim()
    const conv = conversations.find(c => c.title.toLowerCase().includes(normalized) || normalized.includes(c.title.toLowerCase()))
    return conv?.id || null
  }
  
  const formatted = useMemo(() => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      // Skip empty lines but add spacing
      if (!trimmed) {
        elements.push(<div key={index} className="h-2" />)
        return
      }
      
      // Headers (numbered items like "1.", "2.", etc.)
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+\.)\s*(.*)$/)
        if (match) {
          elements.push(
            <p key={index} className="font-semibold mt-3 mb-1">
              {match[1]} {renderInlineFormatting(match[2], onNavigateToSource, noteSourceId, findConversationByTitle)}
            </p>
          )
          return
        }
      }
      
      // Bullet points
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-4 mb-1">
            {renderInlineFormatting(trimmed.slice(2), onNavigateToSource, noteSourceId, findConversationByTitle)}
          </li>
        )
        return
      }
      
      // Quote lines (starting with > or *)
      if (trimmed.startsWith('>') || (trimmed.startsWith('*') && !trimmed.startsWith('**'))) {
        const quoteText = trimmed.startsWith('>') ? trimmed.slice(1).trim() : trimmed
        elements.push(
          <p key={index} className="italic text-muted-foreground mb-1">
            {renderInlineFormatting(quoteText, onNavigateToSource, noteSourceId, findConversationByTitle)}
          </p>
        )
        return
      }
      
      // Regular paragraph
      elements.push(
        <p key={index} className="mb-2">
          {renderInlineFormatting(trimmed, onNavigateToSource, noteSourceId, findConversationByTitle)}
        </p>
      )
    })
    
    return elements
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, onNavigateToSource, noteSourceId, conversations])
  
  return <>{formatted}</>
}

function renderInlineFormatting(
  text: string, 
  onNavigateToSource?: (conversationId: string) => void, 
  noteSourceId?: string | null,
  findConversationByTitle?: (title: string) => string | null
): React.ReactNode {
  // Clean the text of markdown asterisks for display
  const cleanedText = text
    .replace(/^\*+\s*/, '')
    .replace(/\s*\*+$/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
  
  // Match ANY parenthetical reference that looks like a source: (från ...) or (Name, från ...)
  const refPattern = /(\([^)]*från[^)]+\))/gi
  const refParts = cleanedText.split(refPattern)
  
  return refParts.map((segment, segIndex) => {
    // Check if this segment is a source reference (contains "från")
    if (segment.match(/^\([^)]*från[^)]+\)$/i)) {
      // Try to extract ID from [ID:xxx] format
      const idMatch = segment.match(/\[ID:([^\]]+)\]/i)
      
      // Try to find conversation ID: embedded ID > noteSourceId > search by title
      let conversationId = idMatch ? idMatch[1] : noteSourceId
      
      // If still no ID, try to find by title in the reference
      if (!conversationId && findConversationByTitle) {
        // Extract title from reference like "(från Manifestation av cannabis)"
        const titleMatch = segment.match(/från\s+([^)]+)/i)
        if (titleMatch) {
          const title = titleMatch[1].trim()
          conversationId = findConversationByTitle(title)
        }
      }
      
      // Clean display text (remove the [ID:xxx] part)
      const displayText = segment.replace(/\s*\[ID:[^\]]+\]/gi, '')
      
      // Make it clickable if we have a handler and ID
      if (onNavigateToSource && conversationId) {
        return (
          <button
            key={segIndex}
            onClick={() => onNavigateToSource(conversationId!)}
            className="text-purple-400 hover:text-purple-300 hover:underline text-xs cursor-pointer"
          >
            {displayText} →
          </button>
        )
      }
      return <span key={segIndex} className="text-muted-foreground text-xs">{displayText}</span>
    }
    
    // Regular text
    return <span key={segIndex}>{segment}</span>
  })
}

interface NoteCardProps {
  note: BookNote
  onNavigateToSource?: (conversationId: string) => void
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
}

const STATUS_CONFIG: Record<NoteStatus, { label: string; className: string; icon: React.ReactNode }> = {
  unused: {
    label: 'Oanvänd',
    className: 'bg-muted text-muted-foreground',
    icon: <span className="w-2 h-2 rounded-full border border-current" />,
  },
  used: {
    label: 'Använd',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: <Check className="h-3 w-3" />,
  },
  edited: {
    label: 'Bearbetad',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: <Pencil className="h-3 w-3" />,
  },
}

export function NoteCard({ note, onNavigateToSource, dragHandleProps }: NoteCardProps) {
  const { updateNote, updateNoteStatus, deleteNote, moveNotesToChapter } = useBookNoteStore()
  const { chapters } = useBookChapterStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isMoving, setIsMoving] = useState(false)
  const [editedText, setEditedText] = useState(note.text)
  const [editedComment, setEditedComment] = useState(note.comment)

  const statusConfig = STATUS_CONFIG[note.status]
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order)

  const handleSaveEdit = () => {
    updateNote(note.id, {
      text: editedText,
      comment: editedComment,
    })
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedText(note.text)
    setEditedComment(note.comment)
    setIsEditing(false)
  }

  const handleStatusCycle = () => {
    const statusOrder: NoteStatus[] = ['unused', 'used', 'edited']
    const currentIndex = statusOrder.indexOf(note.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
    updateNoteStatus(note.id, nextStatus)
  }

  const handleMarkAsUsed = () => {
    updateNoteStatus(note.id, 'used')
  }

  const handleMoveToChapter = (chapterId: string) => {
    const targetId = chapterId === 'unsorted' ? null : chapterId
    moveNotesToChapter([note.id], targetId)
    setIsMoving(false)
  }

  return (
    <Card className="group relative">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Drag handle */}
          <div
            {...dragHandleProps}
            className="flex items-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-50 transition-opacity"
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Text content */}
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="min-h-[100px] resize-none"
                  autoFocus
                />
                <Textarea
                  value={editedComment}
                  onChange={(e) => setEditedComment(e.target.value)}
                  placeholder="Kommentar..."
                  className="min-h-[60px] resize-none text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    Spara
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-sm mb-2 prose prose-sm prose-invert max-w-none">
                  <FormattedNoteText text={note.text} onNavigateToSource={onNavigateToSource} noteSourceId={note.sourceConversationId} />
                </div>
                
                {note.comment && (
                  <p className="text-xs text-muted-foreground italic mb-2">
                    Kommentar: {note.comment}
                  </p>
                )}

                {/* Source link */}
                {note.sourceConversationTitle && note.sourceConversationId && (
                  <button
                    onClick={() => onNavigateToSource?.(note.sourceConversationId!)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Från: {note.sourceConversationTitle}
                  </button>
                )}

                {/* Actions row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status badge - clickable to cycle */}
                  <Badge
                    className={`cursor-pointer gap-1 ${statusConfig.className}`}
                    onClick={handleStatusCycle}
                  >
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>

                  {note.status !== 'used' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-green-400 hover:text-green-300"
                      onClick={handleMarkAsUsed}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Markera använd
                    </Button>
                  )}

                  <div className="flex-1" />

                  {/* Move to chapter */}
                  {isMoving ? (
                    <Select onValueChange={handleMoveToChapter}>
                      <SelectTrigger className="h-7 w-40 text-xs">
                        <SelectValue placeholder="Välj kapitel..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unsorted">Osorterade</SelectItem>
                        {sortedChapters
                          .filter(ch => ch.id !== note.chapterId)
                          .map((chapter) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {chapter.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsMoving(true)}
                      title="Flytta till annat kapitel"
                    >
                      <FolderInput className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
