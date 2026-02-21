import type { Conversation } from '@/types/conversation'
import ParseWorker from '@/workers/parseWorker?worker'

export interface ParseProgress {
  current: number
  total: number
  status: string
}

interface WorkerConversation {
  id: string
  title: string
  createTime: string
  gizmoId: string | null
  isLester: boolean
  messageCount: number
  markdown: string
}

export async function parseConversationsFromFile(
  file: File,
  onProgress: (progress: ParseProgress) => void
): Promise<Conversation[]> {
  return new Promise((resolve, reject) => {
    const worker = new ParseWorker()
    
    worker.onmessage = (e: MessageEvent) => {
      const { type, current, status, conversations, message } = e.data
      
      if (type === 'progress') {
        onProgress({ current, total: 100, status })
      } else if (type === 'complete') {
        // Convert ISO strings back to Date objects
        const result: Conversation[] = conversations.map((c: WorkerConversation) => ({
          ...c,
          createTime: new Date(c.createTime)
        }))
        onProgress({ current: 100, total: 100, status: 'Klart!' })
        worker.terminate()
        resolve(result)
      } else if (type === 'error') {
        worker.terminate()
        reject(new Error(message))
      }
    }
    
    worker.onerror = (error) => {
      worker.terminate()
      reject(new Error(`Worker error: ${error.message}`))
    }
    
    worker.postMessage({ file })
  })
}
