// Web Worker for parsing large Markdown files
// This runs in a separate thread to avoid blocking the UI
// Note: No external imports - worker must be self-contained

type Teacher = 'lester' | 'neville' | 'osho' | 'krishnamurti' | null

interface ParsedConversation {
  id: string
  title: string
  createTime: string
  gizmoId: string | null
  isLester: boolean
  teacher: Teacher
  messageCount: number
  markdown: string
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function isLesterConversation(title: string, content: string): boolean {
  const lowerTitle = title.toLowerCase()
  const lowerContent = content.toLowerCase()
  
  return (
    lowerTitle.includes('lester') ||
    lowerTitle.includes('levenson') ||
    lowerContent.includes('lester levenson')
  )
}

function detectTeacher(title: string, content: string): Teacher {
  const text = (title + ' ' + content.slice(0, 3000)).toLowerCase()
  
  if (text.includes('lester') || text.includes('levenson') || text.includes('sedona')) {
    return 'lester'
  }
  if (text.includes('neville') || text.includes('goddard')) {
    return 'neville'
  }
  if (text.includes('osho') || text.includes('rajneesh')) {
    return 'osho'
  }
  if (text.includes('krishnamurti') || text.includes('jiddu')) {
    return 'krishnamurti'
  }
  
  return null
}

function parseCreatedDate(dateStr: string): Date {
  // Parse format: 2025-12-11 00:14:52
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/)
  if (match) {
    const [, year, month, day, hour, min, sec] = match
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(min),
      parseInt(sec)
    )
  }
  return new Date()
}

function countMessages(content: string): number {
  // Count message headers like **Du** (timestamp) or ****Du**** (timestamp)
  const msgPattern = /\*{2,4}(Du|ChatGPT|assistant|user)\*{2,4}\s*\(/gi
  const matches = content.match(msgPattern)
  return matches ? matches.length : 0
}

// Parse Markdown file and extract conversations
// Format: ## 1. Title\n**Skapad:** date\n**Totalt X meddelanden**\n...messages...
async function parseMarkdownFile(file: File, onProgress: (percent: number, count: number, status: string) => void): Promise<ParsedConversation[]> {
  const conversations: ParsedConversation[] = []
  
  onProgress(0, 0, 'Läser fil...')
  
  // Read file as text
  const text = await file.text()
  const fileSizeMB = Math.round(file.size / 1024 / 1024)
  
  onProgress(30, 0, `Fil läst (${fileSizeMB} MB). Parsar konversationer...`)
  
  // Split by conversation headers: ## 1. Title, ## 2. Title, etc.
  // Pattern matches: ## followed by number, dot, space, then title
  const convPattern = /^## (\d+)\. (.+)$/gm
  
  const matches: { index: number; number: number; title: string }[] = []
  let match
  while ((match = convPattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      number: parseInt(match[1]),
      title: match[2].trim()
    })
  }
  
  onProgress(50, 0, `Hittade ${matches.length} konversationer. Bearbetar...`)
  
  // Extract each conversation
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i]
    const nextIndex = i + 1 < matches.length ? matches[i + 1].index : text.length
    
    const convText = text.slice(current.index, nextIndex)
    
    // Extract created date
    const createdMatch = convText.match(/\*\*Skapad:\*\*\s*(.+)/)
    const createdStr = createdMatch ? createdMatch[1].trim() : ''
    const createTime = parseCreatedDate(createdStr)
    
    // Extract message count from header or count manually
    let messageCount = 0
    const countMatch = convText.match(/\*\*Totalt (\d+) meddelanden\*\*/)
    if (countMatch) {
      messageCount = parseInt(countMatch[1])
    } else {
      messageCount = countMessages(convText)
    }
    
    
    conversations.push({
      id: generateId(),
      title: current.title,
      createTime: createTime.toISOString(),
      gizmoId: null,
      isLester: isLesterConversation(current.title, convText),
      teacher: detectTeacher(current.title, convText),
      messageCount,
      markdown: convText
    })
    
    // Progress update every 100 conversations
    if (i % 100 === 0 || i === matches.length - 1) {
      const percent = 50 + Math.round((i / matches.length) * 50)
      onProgress(percent, conversations.length, `Bearbetar konversation ${i + 1}/${matches.length}`)
    }
  }
  
  onProgress(100, conversations.length, `Klart! ${conversations.length} konversationer`)
  return conversations
}

self.onmessage = async (e: MessageEvent) => {
  const file: File = e.data.file
  const fileSizeMB = Math.round(file.size / 1024 / 1024)
  
  try {
    self.postMessage({ type: 'progress', current: 0, status: `Startar parsing av ${fileSizeMB} MB Markdown...` })
    
    const conversations = await parseMarkdownFile(file, (percent, _count, status) => {
      self.postMessage({ type: 'progress', current: percent, status: `${status}` })
    })
    
    self.postMessage({ type: 'complete', conversations })
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Okänt fel'
    self.postMessage({ type: 'error', message })
  }
}
