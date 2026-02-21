export type Teacher = 'lester' | 'neville' | 'osho' | 'krishnamurti' | null

export interface Conversation {
  id: string
  title: string
  createTime: Date
  gizmoId: string | null
  isLester: boolean
  teacher: Teacher
  messageCount: number
  markdown: string
}

export type GPTType = 'lester' | 'custom' | 'standard'

export function getGPTType(conversation: Conversation): GPTType {
  if (conversation.isLester) return 'lester'
  if (conversation.gizmoId) return 'custom'
  return 'standard'
}

export function detectTeacher(title: string, content: string): Teacher {
  const text = (title + ' ' + content).toLowerCase()
  
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
