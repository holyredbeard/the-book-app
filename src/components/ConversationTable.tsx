import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { ArrowUpDown, Sparkles, Bot, User, MessageSquare, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useConversationStore } from '@/store/conversationStore'
import { useFilterStore } from '@/store/filterStore'
import { type Conversation, getGPTType } from '@/types/conversation'
import { downloadMultipleMarkdown } from '@/lib/export'

interface ConversationTableProps {
  onSelectConversation: (conversation: Conversation) => void
  selectedConversationId: string | null
}

const PAGE_SIZE = 100

export function ConversationTable({ onSelectConversation, selectedConversationId }: ConversationTableProps) {
  const { conversations } = useConversationStore()
  const { searchQuery, showLesterOnly, showCustomGPTOnly, showStandardOnly, teacherFilter } = useFilterStore()
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createTime', desc: true }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Filter conversations - simple text search on title only (fast)
  const filteredConversations = useMemo(() => {
    let result = conversations

    // Apply teacher filter
    if (teacherFilter !== 'all') {
      result = result.filter(c => c.teacher === teacherFilter)
    }

    // Apply type filters (legacy)
    if (showLesterOnly || showCustomGPTOnly || showStandardOnly) {
      result = result.filter(c => {
        if (showLesterOnly && c.isLester) return true
        if (showCustomGPTOnly && !c.isLester && c.gizmoId) return true
        if (showStandardOnly && !c.gizmoId) return true
        return false
      })
    }

    // Apply search - simple case-insensitive title search (much faster than Fuse.js for large datasets)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(c => c.title.toLowerCase().includes(query))
    }

    return result
  }, [conversations, searchQuery, showLesterOnly, showCustomGPTOnly, showStandardOnly, teacherFilter])

  const columns = useMemo<ColumnDef<Conversation>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Välj alla"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Välj rad"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      size: 40,
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -ml-2"
        >
          Titel
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="line-clamp-1 font-medium">{row.getValue('title')}</span>
      ),
    },
    {
      accessorKey: 'createTime',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-8 px-2 -ml-2"
        >
          Datum
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(row.getValue('createTime'), 'd MMM yyyy', { locale: sv })}
        </span>
      ),
      size: 120,
    },
    {
      id: 'type',
      header: 'Typ',
      cell: ({ row }) => {
        const teacher = row.original.teacher
        if (teacher === 'lester') {
          return (
            <Badge variant="lester" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Lester
            </Badge>
          )
        }
        if (teacher === 'neville') {
          return (
            <Badge className="gap-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
              <Sparkles className="h-3 w-3" />
              Neville
            </Badge>
          )
        }
        if (teacher === 'osho') {
          return (
            <Badge className="gap-1 bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Sparkles className="h-3 w-3" />
              Osho
            </Badge>
          )
        }
        if (teacher === 'krishnamurti') {
          return (
            <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              <Sparkles className="h-3 w-3" />
              Krishnamurti
            </Badge>
          )
        }
        const type = getGPTType(row.original)
        if (type === 'custom') {
          return (
            <Badge variant="custom" className="gap-1">
              <Bot className="h-3 w-3" />
              Custom
            </Badge>
          )
        }
        return (
          <Badge variant="standard" className="gap-1">
            <User className="h-3 w-3" />
            Standard
          </Badge>
        )
      },
      size: 120,
    },
    {
      accessorKey: 'messageCount',
      header: 'Meddelanden',
      cell: ({ row }) => (
        <span className="flex items-center gap-1 text-muted-foreground text-sm">
          <MessageSquare className="h-3 w-3" />
          {row.getValue('messageCount')}
        </span>
      ),
      size: 100,
    },
  ], [])

  const table = useReactTable({
    data: filteredConversations,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    initialState: {
      pagination: {
        pageSize: PAGE_SIZE,
      },
    },
  })

  const { rows } = table.getRowModel()
  const selectedCount = Object.keys(rowSelection).length
  const selectedConversations = useMemo(() => {
    return Object.keys(rowSelection)
      .map(index => filteredConversations[parseInt(index)])
      .filter(Boolean)
  }, [rowSelection, filteredConversations])

  const handleExportSelected = () => {
    if (selectedConversations.length > 0) {
      downloadMultipleMarkdown(selectedConversations)
    }
  }

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-2 py-2 border-b">
        <div className="text-sm text-muted-foreground">
          {filteredConversations.length} av {conversations.length} konversationer
          {selectedCount > 0 && (
            <span className="ml-2 text-primary">
              ({selectedCount} markerade)
            </span>
          )}
        </div>
        {selectedCount > 0 && (
          <Button size="sm" variant="outline" onClick={handleExportSelected}>
            <Download className="h-4 w-4 mr-2" />
            Exportera ({selectedCount})
          </Button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-background z-10 border-b">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="h-10 px-2 text-left align-middle font-medium text-muted-foreground"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map(row => {
              const isSelected = row.original.id === selectedConversationId
              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectConversation(row.original)}
                  className={`cursor-pointer border-b transition-colors hover:bg-accent/50 ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="p-2 align-middle"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination - always visible */}
      <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/50 shrink-0">
        <div className="text-sm text-muted-foreground">
          Sida {currentPage + 1} av {pageCount || 1} ({filteredConversations.length} konversationer)
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Första</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">Förra</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="mr-1 hidden sm:inline">Nästa</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="mr-1 hidden sm:inline">Sista</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
