import { useCallback, useState } from 'react'
import { Upload, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useConversationStore } from '@/store/conversationStore'
import { parseConversationsFromFile } from '@/lib/parseConversations'

interface FileUploadProps {
  compact?: boolean
}

export function FileUpload({ compact = false }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const { 
    conversations,
    isLoading, 
    loadingProgress, 
    loadingStatus,
    setLoading,
    setLoadingProgress,
    setLoadingStatus,
    setConversations
  } = useConversationStore()
  
  const hasConversations = conversations.length > 0

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md')) {
      toast.error('Välj en Markdown-fil (.md)')
      return
    }

    setLoading(true)
    setLoadingProgress(0)
    setLoadingStatus('Startar...')

    try {
      const conversations = await parseConversationsFromFile(file, (progress) => {
        setLoadingProgress(progress.current)
        setLoadingStatus(progress.status)
      })

      setLoadingStatus('Sparar till databas...')
      await setConversations(conversations)
      
      const lesterCount = conversations.filter(c => c.isLester).length
      toast.success(
        `Laddade ${conversations.length} konversationer (${lesterCount} Lester-relaterade)`
      )
    } catch (error) {
      console.error('Parse error:', error)
      toast.error(`Fel vid parsing: ${error instanceof Error ? error.message : 'Okänt fel'}`)
    } finally {
      setLoading(false)
      setLoadingProgress(0)
      setLoadingStatus('')
    }
  }, [setLoading, setLoadingProgress, setLoadingStatus, setConversations])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  if (isLoading) {
    if (compact) {
      return (
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">{loadingProgress}%</span>
        </div>
      )
    }
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary animate-pulse" />
              <div className="flex-1">
                <p className="font-medium">{loadingStatus}</p>
                <p className="text-sm text-muted-foreground">{loadingProgress}%</p>
              </div>
            </div>
            <Progress value={loadingProgress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact mode: just a button
  if (compact || hasConversations) {
    return (
      <label>
        <input
          type="file"
          accept=".md"
          onChange={handleInputChange}
          className="hidden"
        />
        <Button asChild variant="outline" size="sm" className="cursor-pointer">
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Ladda ny fil
          </span>
        </Button>
      </label>
    )
  }

  return (
    <Card 
      className={`w-full max-w-2xl mx-auto transition-colors ${
        isDragging ? 'border-primary border-2 bg-primary/5' : ''
      }`}
    >
      <CardContent className="p-8">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className="flex flex-col items-center justify-center gap-4 py-8"
        >
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              Dra och släpp din conversations.md här
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Eller klicka för att välja fil
            </p>
          </div>

          <label>
            <input
              type="file"
              accept=".md"
              onChange={handleInputChange}
              className="hidden"
            />
            <Button asChild variant="outline" className="cursor-pointer">
              <span>Välj fil</span>
            </Button>
          </label>

          <p className="text-xs text-muted-foreground text-center max-w-md">
            Ladda upp din exporterade Markdown-fil med ChatGPT-konversationer.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
