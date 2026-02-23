import type { Conversation } from '@/types/conversation'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

const DEFAULT_SYSTEM_PROMPT = `Du är en hjälpsam assistent som svarar baserat på användarens ChatGPT-arkiv. 

Regler:
- Svara endast med information från den givna kontexten
- När du citerar en källa, använd formatet: (Namn, från konversation X [ID:xxx]) där ID är det exakta ID:t från konversationsrubriken
- Om frågan inte kan besvaras från kontexten, säg det tydligt
- Var koncis men informativ
- Använd markdown-formatering för tydlighet
- Inkludera ALLTID [ID:xxx] i dina källhänvisningar så användaren kan klicka på dem`

export interface AISource {
  id: string
  title: string
  snippet: string
  score: number
}

export interface AIResponse {
  content: string
  sources: AISource[]
}

// Expand keywords with synonyms and related terms
const KEYWORD_EXPANSIONS: Record<string, string[]> = {
  'fear': ['fear', 'rädsla', 'rädd', 'ångest', 'oro', 'skräck', 'afraid', 'anxiety', 'worried'],
  'rädsla': ['fear', 'rädsla', 'rädd', 'ångest', 'oro', 'skräck', 'afraid', 'anxiety'],
  'love': ['love', 'kärlek', 'älska', 'loving', 'kärleksfull'],
  'kärlek': ['love', 'kärlek', 'älska', 'loving', 'kärleksfull'],
  'acceptance': ['acceptance', 'acceptans', 'acceptera', 'accept', 'godkännande'],
  'acceptans': ['acceptance', 'acceptans', 'acceptera', 'accept', 'godkännande'],
  'release': ['release', 'släppa', 'letting go', 'släpp', 'frigöra', 'frigörelse'],
  'släppa': ['release', 'släppa', 'letting go', 'släpp', 'frigöra', 'frigörelse'],
  'lester': ['lester', 'levenson', 'sedona'],
  'ego': ['ego', 'jag', 'själv', 'identity', 'identitet'],
  'meditation': ['meditation', 'meditera', 'stillhet', 'mindfulness'],
  'awakening': ['awakening', 'uppvaknande', 'vakna', 'enlightenment', 'upplysning'],
  'uppvaknande': ['awakening', 'uppvaknande', 'vakna', 'enlightenment', 'upplysning'],
  'consciousness': ['consciousness', 'medvetenhet', 'medveten', 'awareness'],
  'medvetenhet': ['consciousness', 'medvetenhet', 'medveten', 'awareness'],
}

function expandKeywords(words: string[]): string[] {
  const expanded = new Set<string>()
  for (const word of words) {
    expanded.add(word)
    const expansions = KEYWORD_EXPANSIONS[word]
    if (expansions) {
      expansions.forEach(e => expanded.add(e))
    }
  }
  return Array.from(expanded)
}

export function findRelevantConversations(
  conversations: Conversation[],
  query: string,
  limit: number = 10
): AISource[] {
  // Extract keywords and expand with synonyms
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const expandedWords = expandKeywords(queryWords)
  
  if (expandedWords.length === 0) {
    return []
  }
  
  const scored = conversations.map(conv => {
    const titleLower = conv.title.toLowerCase()
    const markdownLower = conv.markdown.slice(0, 5000).toLowerCase() // Check first 5000 chars
    
    let score = 0
    for (const word of expandedWords) {
      if (titleLower.includes(word)) score += 10
      if (markdownLower.includes(word)) score += 1
    }
    
    return { conv, score }
  }).filter(item => item.score > 0)
  
  // Sort by score descending and take top results
  scored.sort((a, b) => b.score - a.score)
  
  return scored.slice(0, limit).map(item => ({
    id: item.conv.id,
    title: item.conv.title,
    snippet: item.conv.markdown.slice(0, 500) + '...',
    score: item.score
  }))
}

function buildContext(sources: AISource[], conversations: Conversation[]): string {
  return sources.map((source, index) => {
    const conversation = conversations.find(c => c.id === source.id)
    if (!conversation) return ''
    const content = conversation.markdown.slice(0, 4000)
    // Include the conversation ID in brackets so it can be parsed later
    return `--- Konversation ${index + 1} [ID:${source.id}]: "${source.title}" ---\n${content}\n`
  }).join('\n\n')
}

export async function* streamAIResponse(
  apiKey: string,
  query: string,
  conversations: Conversation[],
  onSourcesFound: (sources: AISource[]) => void,
  customSystemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  // Find relevant conversations
  const sources = findRelevantConversations(conversations, query, 10)
  onSourcesFound(sources)

  if (sources.length === 0) {
    yield 'Jag kunde inte hitta några relevanta konversationer för din fråga. Försök med andra sökord.'
    return
  }

  const context = buildContext(sources, conversations)

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: customSystemPrompt || DEFAULT_SYSTEM_PROMPT },
        { 
          role: 'user', 
          content: `Baserat på följande konversationer från mitt ChatGPT-arkiv:\n\n${context}\n\nFråga: ${query}`
        }
      ],
      stream: true,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Ignore parse errors for incomplete JSON
        }
      }
    }
  }
}

export async function* streamDistillation(
  apiKey: string,
  content: string,
  systemPrompt: string
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: content
        }
      ],
      stream: true,
      max_tokens: 2000,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`DeepSeek API error: ${response.status} - ${error}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) {
            yield content
          }
        } catch {
          // Ignore parse errors for incomplete JSON
        }
      }
    }
  }
}
