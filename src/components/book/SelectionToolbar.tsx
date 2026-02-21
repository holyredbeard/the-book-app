import { useState, useEffect, useCallback } from 'react'
import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectionToolbarProps {
  containerRef: React.RefObject<HTMLElement | null>
  onSaveSelection: (text: string) => void
}

export function SelectionToolbar({ containerRef, onSaveSelection }: SelectionToolbarProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedText, setSelectedText] = useState('')

  const checkSelection = useCallback(() => {
    const selection = window.getSelection()
    
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setPosition(null)
      setSelectedText('')
      return
    }

    const text = selection.toString().trim()
    if (!text) {
      setPosition(null)
      return
    }

    // Check if selection is within our container
    const container = containerRef.current
    if (!container) {
      setPosition(null)
      return
    }

    const range = selection.getRangeAt(0)
    const commonAncestor = range.commonAncestorContainer
    
    if (!container.contains(commonAncestor)) {
      setPosition(null)
      return
    }

    // Get position for toolbar - use viewport coordinates (fixed positioning)
    const rect = range.getBoundingClientRect()
    
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
    setSelectedText(text)
  }, [containerRef])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseUp = (e: MouseEvent) => {
      // Don't process if clicking on the toolbar button
      const target = e.target as HTMLElement
      if (target.closest('[data-selection-toolbar]')) return
      
      // Small delay to let selection finalize
      setTimeout(checkSelection, 10)
    }

    const handleMouseDown = (e: MouseEvent) => {
      // Don't hide if clicking on the toolbar button
      const target = e.target as HTMLElement
      if (target.closest('[data-selection-toolbar]')) {
        console.log('Click on toolbar detected, not hiding')
        return
      }
      
      // Hide toolbar when starting new selection
      setPosition(null)
      setSelectedText('')
    }

    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mousedown', handleMouseDown)
    
    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mousedown', handleMouseDown)
    }
  }, [containerRef, checkSelection])

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Save button clicked, selectedText:', selectedText)
    
    if (selectedText) {
      const textToSave = selectedText
      // Clear state first
      setPosition(null)
      setSelectedText('')
      window.getSelection()?.removeAllRanges()
      // Then trigger the callback
      onSaveSelection(textToSave)
    }
  }

  if (!position || !selectedText) return null

  return (
    <div
      data-selection-toolbar
      className="fixed z-50 transform -translate-x-1/2 -translate-y-full pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Button
        size="sm"
        className="gap-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
        onClick={handleSave}
        onMouseUp={handleSave}
      >
        <BookOpen className="h-3 w-3" />
        Spara till boken
      </Button>
    </div>
  )
}
