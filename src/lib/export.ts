import { format } from 'date-fns'
import type { Conversation } from '@/types/conversation'

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100)
}

export function downloadMarkdown(conversation: Conversation) {
  const filename = `${sanitizeFilename(conversation.title)}_${format(conversation.createTime, 'yyyy-MM-dd')}.md`
  
  const header = `# ${conversation.title}

**Datum:** ${format(conversation.createTime, 'yyyy-MM-dd HH:mm')}
**Meddelanden:** ${conversation.messageCount}
**Typ:** ${conversation.isLester ? 'Lester/Levenson' : conversation.gizmoId ? 'Custom GPT' : 'Standard'}

---

`
  
  const content = header + conversation.markdown
  
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function downloadMultipleMarkdown(conversations: Conversation[]) {
  if (conversations.length === 0) return
  
  if (conversations.length === 1) {
    downloadMarkdown(conversations[0])
    return
  }
  
  // For multiple files, create a combined markdown
  const filename = `chat_export_${format(new Date(), 'yyyy-MM-dd_HHmm')}.md`
  
  const content = conversations.map((conv, index) => {
    const header = `# ${index + 1}. ${conv.title}

**Datum:** ${format(conv.createTime, 'yyyy-MM-dd HH:mm')}
**Meddelanden:** ${conv.messageCount}
**Typ:** ${conv.isLester ? 'Lester/Levenson' : conv.gizmoId ? 'Custom GPT' : 'Standard'}

---

`
    return header + conv.markdown
  }).join('\n\n---\n\n# ═══════════════════════════════════════\n\n')
  
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
