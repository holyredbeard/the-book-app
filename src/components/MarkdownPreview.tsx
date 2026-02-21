import { useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Copy, ChevronLeft, ChevronRight, X, Sparkles, Bot, User, MessageSquare, Calendar, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { type Conversation, getGPTType } from '@/types/conversation'
import { downloadMarkdown } from '@/lib/export'
import { SelectionToolbar } from '@/components/book/SelectionToolbar'
import { SaveToBookModal } from '@/components/book/SaveToBookModal'

interface MarkdownPreviewProps {
  conversation: Conversation | null
  conversations: Conversation[]
  onNavigate: (conversation: Conversation) => void
  onClose: () => void
}

export function MarkdownPreview({ conversation, conversations, onNavigate, onClose }: MarkdownPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')

  const currentIndex = useMemo(() => {
    if (!conversation) return -1
    return conversations.findIndex(c => c.id === conversation.id)
  }, [conversation, conversations])

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < conversations.length - 1 && currentIndex !== -1

  const handlePrev = () => {
    if (canGoPrev) {
      onNavigate(conversations[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (canGoNext) {
      onNavigate(conversations[currentIndex + 1])
    }
  }

  const handleCopy = async () => {
    if (!conversation) return
    try {
      await navigator.clipboard.writeText(conversation.markdown)
      toast.success('Markdown kopierad till urklipp')
    } catch {
      toast.error('Kunde inte kopiera till urklipp')
    }
  }

  const handleSaveSelection = (text: string) => {
    setSelectedText(text)
    setSaveModalOpen(true)
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Välj en konversation för att visa innehållet</p>
        </div>
      </div>
    )
  }

  const type = getGPTType(conversation)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-lg line-clamp-2 flex-1">
            {conversation.title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {type === 'lester' && (
            <Badge variant="lester" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Lester
            </Badge>
          )}
          {type === 'custom' && (
            <Badge variant="custom" className="gap-1">
              <Bot className="h-3 w-3" />
              Custom GPT
            </Badge>
          )}
          {type === 'standard' && (
            <Badge variant="standard" className="gap-1">
              <User className="h-3 w-3" />
              Standard
            </Badge>
          )}
          
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {format(conversation.createTime, 'd MMMM yyyy, HH:mm', { locale: sv })}
          </span>
          
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {conversation.messageCount} meddelanden
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 relative" ref={contentRef}>
        <SelectionToolbar 
          containerRef={contentRef} 
          onSaveSelection={handleSaveSelection} 
        />
        <Card className="bg-background/50">
          <CardContent className="p-4">
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownRenderer content={conversation.markdown} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save to book modal */}
      <SaveToBookModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        selectedText={selectedText}
        sourceConversationId={conversation.id}
        sourceConversationTitle={conversation.title}
        sourceType="conversation"
      />

      {/* Footer */}
      <div className="p-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={!canGoPrev}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Föregående
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            Nästa
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} av {conversations.length}
        </span>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleCopy} size="sm" variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Kopiera
          </Button>
          <Button onClick={() => conversation && downloadMarkdown(conversation)} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Ladda ner
          </Button>
        </div>
      </div>
    </div>
  )
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown rendering - converts basic markdown to HTML-like structure
  const rendered = useMemo(() => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeContent: string[] = []

    lines.forEach((line, index) => {
      // Code block start/end
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={index} className="bg-muted p-3 rounded-md overflow-x-auto my-2">
              <code className="text-sm">{codeContent.join('\n')}</code>
            </pre>
          )
          codeContent = []
          inCodeBlock = false
        } else {
          inCodeBlock = true
        }
        return
      }

      if (inCodeBlock) {
        codeContent.push(line)
        return
      }

      // Horizontal rule
      if (line === '---') {
        elements.push(<Separator key={index} className="my-4" />)
        return
      }

      // Bold text (simple pattern for **User (HH:MM):** format)
      if (line.startsWith('**') && line.includes(':**')) {
        const match = line.match(/^\*\*(.+?):\*\*(.*)$/)
        if (match) {
          const [, label, rest] = match
          const isUser = label.toLowerCase().includes('user')
          elements.push(
            <div key={index} className="mb-2">
              <span className={`font-semibold ${isUser ? 'text-blue-400' : 'text-green-400'}`}>
                {label}:
              </span>
              {rest && <span>{rest}</span>}
            </div>
          )
          return
        }
      }

      // Regular paragraph
      if (line.trim()) {
        // Handle inline code
        const parts = line.split(/(`[^`]+`)/)
        const rendered = parts.map((part, i) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={i} className="bg-muted px-1 py-0.5 rounded text-sm">
                {part.slice(1, -1)}
              </code>
            )
          }
          // Handle bold
          const boldParts = part.split(/(\*\*[^*]+\*\*)/)
          return boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return <strong key={`${i}-${j}`}>{bp.slice(2, -2)}</strong>
            }
            return bp
          })
        })
        elements.push(<p key={index} className="mb-2">{rendered}</p>)
      } else {
        // Empty line
        elements.push(<div key={index} className="h-2" />)
      }
    })

    return elements
  }, [content])

  return <>{rendered}</>
}
