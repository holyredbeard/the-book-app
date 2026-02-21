import { Filter, X, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useFilterStore } from '@/store/filterStore'
import { useConversationStore } from '@/store/conversationStore'
import { useMemo } from 'react'
import type { Teacher } from '@/types/conversation'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const TEACHER_OPTIONS: { value: Teacher | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Alla lärare', color: 'text-muted-foreground' },
  { value: 'lester', label: 'Lester Levenson', color: 'text-purple-400' },
  { value: 'neville', label: 'Neville Goddard', color: 'text-amber-400' },
  { value: 'osho', label: 'Osho', color: 'text-orange-400' },
  { value: 'krishnamurti', label: 'Krishnamurti', color: 'text-emerald-400' },
]

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { conversations } = useConversationStore()
  const {
    teacherFilter,
    setTeacherFilter,
    resetFilters,
  } = useFilterStore()

  const stats = useMemo(() => {
    const lester = conversations.filter(c => c.teacher === 'lester').length
    const neville = conversations.filter(c => c.teacher === 'neville').length
    const osho = conversations.filter(c => c.teacher === 'osho').length
    const krishnamurti = conversations.filter(c => c.teacher === 'krishnamurti').length
    const custom = conversations.filter(c => !c.isLester && c.gizmoId).length
    const standard = conversations.filter(c => !c.gizmoId).length
    return { lester, neville, osho, krishnamurti, custom, standard, total: conversations.length }
  }, [conversations])

  const hasActiveFilters = teacherFilter !== 'all'

  if (!isOpen) return null

  return (
    <div className="w-72 border-r bg-card/50 h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-semibold">Filter</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <Card className="bg-background/50">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Statistik</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Totalt</span>
              <span className="font-medium">{stats.total}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between">
              <span className="text-purple-400">Lester</span>
              <span className="font-medium text-purple-400">{stats.lester}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-400">Neville</span>
              <span className="font-medium text-amber-400">{stats.neville}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-orange-400">Osho</span>
              <span className="font-medium text-orange-400">{stats.osho}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">Krishnamurti</span>
              <span className="font-medium text-emerald-400">{stats.krishnamurti}</span>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Teacher filter */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Filtrera efter lärare</Label>
          <div className="space-y-2">
            {TEACHER_OPTIONS.map((option) => (
              <Button
                key={option.value ?? 'all'}
                variant={teacherFilter === option.value ? 'secondary' : 'ghost'}
                size="sm"
                className={`w-full justify-start ${option.color}`}
                onClick={() => setTeacherFilter(option.value)}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {option.label}
                {option.value !== 'all' && (
                  <span className="ml-auto text-xs opacity-70">
                    {option.value === 'lester' && stats.lester}
                    {option.value === 'neville' && stats.neville}
                    {option.value === 'osho' && stats.osho}
                    {option.value === 'krishnamurti' && stats.krishnamurti}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>


        {hasActiveFilters && (
          <>
            <Separator />
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="w-full"
            >
              Rensa filter
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
