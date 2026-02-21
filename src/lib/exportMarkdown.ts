import type { BookNote } from '@/store/bookNoteStore'

export function exportChapterToMarkdown(chapterTitle: string, notes: BookNote[]): string {
  const lines: string[] = []
  
  lines.push(`## ${chapterTitle}`)
  lines.push('')

  for (const note of notes) {
    lines.push(note.text)
    
    if (note.comment) {
      lines.push(`> Kommentar: ${note.comment}`)
    }
    
    lines.push('')
    lines.push('---')
    lines.push('')
  }

  // Remove trailing separator
  if (lines.length > 2) {
    lines.pop() // empty line
    lines.pop() // ---
    lines.pop() // empty line
  }

  return lines.join('\n')
}
