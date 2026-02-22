import { useState, useCallback, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, ExternalLink, AlertCircle, BookOpen, Pencil, RotateCcw, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useConversationStore } from '@/store/conversationStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useAIPromptStore } from '@/store/aiPromptStore'
import { streamAIResponse, type AISource } from '@/lib/deepseek'
import { SelectionToolbar } from '@/components/book/SelectionToolbar'
import { SaveToBookModal } from '@/components/book/SaveToBookModal'

interface AskAIProps {
  onSelectConversation: (id: string) => void
}

export function AskAI({ onSelectConversation }: AskAIProps) {
  const { conversations } = useConversationStore()
  const { deepseekApiKey } = useSettingsStore()
  const { systemPrompt, useSystemPrompt, setSystemPrompt, setUseSystemPrompt, resetToDefault } = useAIPromptStore()
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [sources, setSources] = useState<AISource[]>([])
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [editedPrompt, setEditedPrompt] = useState(systemPrompt)
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [showSources, setShowSources] = useState(true)
  const responseRef = useRef<HTMLDivElement>(null)

  const handleSaveSelection = (text: string) => {
    console.log('AskAI handleSaveSelection called with:', text.slice(0, 50))
    setSelectedText(text)
    setSaveModalOpen(true)
  }

  const handleSubmit = useCallback(async () => {
    if (!query.trim()) return

    if (!deepseekApiKey) {
      toast.error('Lägg till din DeepSeek API-nyckel i inställningarna')
      return
    }

    setIsLoading(true)
    setResponse('')
    setSources([])

    try {
      const stream = streamAIResponse(
        deepseekApiKey,
        query,
        conversations,
        (foundSources) => setSources(foundSources),
        useSystemPrompt ? systemPrompt : undefined
      )

      for await (const chunk of stream) {
        setResponse(prev => prev + chunk)
      }
    } catch (error) {
      console.error('AI error:', error)
      toast.error(error instanceof Error ? error.message : 'Fel vid AI-förfrågan')
    } finally {
      setIsLoading(false)
    }
  }, [query, deepseekApiKey, conversations, useSystemPrompt, systemPrompt])

  const handleSavePrompt = () => {
    setSystemPrompt(editedPrompt)
    setIsEditingPrompt(false)
    toast.success('System-prompt sparad')
  }

  const handleCancelEdit = () => {
    setEditedPrompt(systemPrompt)
    setIsEditingPrompt(false)
  }

  const handleResetPrompt = () => {
    resetToDefault()
    setEditedPrompt(systemPrompt)
    toast.success('System-prompt återställd till standard')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-scroll response
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [response])

  if (!deepseekApiKey) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h3 className="font-semibold mb-2">API-nyckel saknas</h3>
            <p className="text-sm text-muted-foreground mb-4">
              För att använda AI-funktionen behöver du lägga till din DeepSeek API-nyckel i inställningarna.
            </p>
            <p className="text-xs text-muted-foreground">
              Klicka på kugghjulet i övre högra hörnet för att öppna inställningar.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* System prompt editor modal */}
      {isEditingPrompt && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[80vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Redigera system-prompt
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetPrompt}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Återställ
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden flex flex-col gap-4">
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                className="flex-1 min-h-[300px] resize-none font-mono text-sm"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit}>
                  Avbryt
                </Button>
                <Button onClick={handleSavePrompt}>
                  <Check className="h-4 w-4 mr-1" />
                  Spara
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Query input */}
      <div className="p-4 border-b space-y-3">
        {/* System prompt toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Switch
              id="use-system-prompt"
              checked={useSystemPrompt}
              onCheckedChange={setUseSystemPrompt}
            />
            <Label htmlFor="use-system-prompt" className="text-sm cursor-pointer flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-400" />
              Bok-assistent prompt
            </Label>
          </div>
          {useSystemPrompt && (
            <Button variant="ghost" size="sm" onClick={() => { setEditedPrompt(systemPrompt); setIsEditingPrompt(true) }}>
              <Pencil className="h-4 w-4 mr-1" />
              Redigera
            </Button>
          )}
        </div>

        {/* Query input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Ställ en fråga om ditt arkiv... (t.ex. 'Vad säger Lester om acceptance?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !query.trim()}
            className="h-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Save to book modal */}
      {saveModalOpen && (
        <SaveToBookModal
          isOpen={saveModalOpen}
          onClose={() => {
            console.log('Modal closing, response length:', response.length)
            setSaveModalOpen(false)
          }}
          selectedText={selectedText}
          sourceConversationId={null}
          sourceConversationTitle={null}
          sourceType="ai-response"
        />
      )}

      {/* Response area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Main response */}
        <div className="flex-1 overflow-y-auto p-4" ref={responseRef}>
          {/* Always show save button when there's a response */}
          {response && (
            <div className="flex justify-end mb-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-purple-400 border-purple-400/30 hover:bg-purple-400/10"
                onClick={() => {
                  const selection = window.getSelection()
                  const text = selection?.toString().trim()
                  if (text) {
                    handleSaveSelection(text)
                  } else {
                    handleSaveSelection(response)
                  }
                }}
              >
                <BookOpen className="h-3 w-3" />
                Spara markering till boken
              </Button>
            </div>
          )}
          {response ? (
            <div className="relative">
              <SelectionToolbar 
                containerRef={responseRef} 
                onSaveSelection={handleSaveSelection} 
              />
              <Card className="bg-background/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    AI-svar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ResponseRenderer content={response} sources={sources} onSelectConversation={onSelectConversation} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Söker i arkivet och genererar svar...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ställ en fråga för att söka i ditt arkiv</p>
                <p className="text-sm mt-2">
                  AI:n kommer söka igenom dina konversationer och ge dig ett svar med källhänvisningar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sources sidebar */}
        {sources.length > 0 && (
          <div className={`border-l overflow-y-auto transition-all duration-300 ${showSources ? 'w-64' : 'w-10'}`}>
            {showSources ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Källor ({sources.length})</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowSources(false)}
                    title="Dölj källor"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {sources.map((source, index) => (
                    <Card 
                      key={source.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => onSelectConversation(source.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">
                              {index + 1}. {source.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {source.snippet.slice(0, 100)}...
                            </p>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-2 flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowSources(true)}
                  title="Visa källor"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground mt-2 writing-mode-vertical">
                  {sources.length}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface ResponseRendererProps {
  content: string
  sources: AISource[]
  onSelectConversation: (id: string) => void
}

function ResponseRenderer({ content, sources, onSelectConversation }: ResponseRendererProps) {
  const lines = content.split('\n')
  
  // Create a map of source index to source for quick lookup
  const sourceMap = new Map(sources.map((s, i) => [i + 1, s]))
  
  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim()
        
        // Skip empty lines
        if (!trimmed) {
          return <div key={index} className="h-1" />
        }
        
        // Main headers (## or ###)
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="text-base font-semibold text-purple-300 mt-5 mb-2 border-b border-purple-500/20 pb-1">
              {cleanText(trimmed.slice(4))}
            </h3>
          )
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={index} className="text-lg font-semibold text-purple-300 mt-5 mb-2 border-b border-purple-500/20 pb-1">
              {cleanText(trimmed.slice(3))}
            </h2>
          )
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={index} className="text-xl font-bold text-purple-300 mt-5 mb-3 border-b border-purple-500/30 pb-2">
              {cleanText(trimmed.slice(2))}
            </h1>
          )
        }
        
        // Numbered headers like "1. Title" or "2. Title"
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/)
        if (numberedMatch && !trimmed.includes('"') && trimmed.length < 80) {
          return (
            <h3 key={index} className="text-base font-semibold text-blue-300 mt-4 mb-2">
              {numberedMatch[1]}. {cleanText(numberedMatch[2])}
            </h3>
          )
        }
        
        // Quote lines starting with > or "
        if (trimmed.startsWith('>') || trimmed.startsWith('"')) {
          const quoteText = trimmed.startsWith('>') ? trimmed.slice(1).trim() : trimmed
          return (
            <blockquote key={index} className="border-l-2 border-purple-500/50 pl-4 py-1 italic text-muted-foreground bg-purple-500/5 rounded-r">
              {cleanText(quoteText)}
            </blockquote>
          )
        }
        
        // List items with - or *
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={index} className="flex gap-2 ml-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>{cleanText(trimmed.slice(2))}</span>
            </div>
          )
        }
        
        // Source references like (Lester Levenson, från konversation 4 [ID:xxx])
        if (trimmed.startsWith('(') && trimmed.endsWith(')') && trimmed.includes('konversation')) {
          // Try to extract ID from [ID:xxx] format first
          const idMatch = trimmed.match(/\[ID:([^\]]+)\]/i)
          let conversationId: string | null = null
          
          if (idMatch) {
            conversationId = idMatch[1]
          } else {
            // Fallback to conversation number
            const convMatch = trimmed.match(/konversation\s*(\d+)/i)
            if (convMatch) {
              const convNum = parseInt(convMatch[1])
              const source = sourceMap.get(convNum)
              if (source) {
                conversationId = source.id
              }
            }
          }
          
          // Clean display text (remove the [ID:xxx] part)
          const displayText = trimmed.replace(/\s*\[ID:[^\]]+\]/gi, '')
          
          if (conversationId) {
            return (
              <button
                key={index}
                onClick={() => onSelectConversation(conversationId!)}
                className="text-xs text-purple-400 hover:text-purple-300 hover:underline ml-4 -mt-2 mb-2 cursor-pointer text-left"
              >
                {displayText} →
              </button>
            )
          }
          return (
            <p key={index} className="text-xs text-muted-foreground ml-4 -mt-2 mb-2">
              {displayText}
            </p>
          )
        }
        
        // Regular paragraph
        return (
          <p key={index} className="leading-relaxed">
            {cleanText(trimmed)}
          </p>
        )
      })}
    </div>
  )
}

function cleanText(text: string): React.ReactNode {
  // Remove markdown formatting and render clean text
  let cleaned = text
    // Remove ** bold markers but keep the text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove * italic markers but keep the text  
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove standalone * at start of lines
    .replace(/^\*\s*/, '')
    // Remove ` code markers
    .replace(/`([^`]+)`/g, '$1')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
  
  // Now render with proper formatting - bold text in quotes
  const parts = cleaned.split(/("[^"]+")/g)
  
  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      return (
        <span key={i} className="font-medium text-purple-200">
          {part}
        </span>
      )
    }
    return part
  })
}
