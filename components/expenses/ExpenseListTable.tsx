'use client'

// components/expenses/ExpenseListTable.tsx
import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Edit, 
  Trash2,
  Eye,
  Download
} from 'lucide-react'

interface Expense {
  id: string
  date: string
  amount: number
  description: string
  vendor?: { id: string; name: string }
  category?: { id: string; name: string; deductible: boolean }
  subscription?: { id: string; name: string }
}

interface ExpenseListTableProps {
  onEdit?: (expense: Expense) => void
  onDelete?: (expenseId: string) => void
  onView?: (expense: Expense) => void
}

export default function ExpenseListTable({ onEdit, onDelete, onView }: ExpenseListTableProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const pageSize = 20

  useEffect(() => {
    loadExpenses()
  }, [page, searchTerm, filterVendor, filterCategory, sortBy, sortOrder])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      })

      if (filterVendor) params.append('vendor_id', filterVendor)
      if (filterCategory) params.append('category_id', filterCategory)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/expenses?${params}`)
      const data = await response.json()

      if (data.success) {
        setExpenses(data.expenses || [])
        setTotalPages(Math.ceil((data.summary?.total_count || 0) / pageSize))
      }
    } catch (error) {
      console.error('Failed to load expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadExpenses()
        if (onDelete) onDelete(expenseId)
      }
    } catch (error) {
      console.error('Failed to delete expense:', error)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="border rounded-lg">
          <div className="h-64 bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          variant="outline" 
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
        </Button>

        <Button variant="outline" onClick={() => window.open('/api/expenses/export?type=expenses&format=csv', '_blank')}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('vendor')}>
                Vendor {sortBy === 'vendor' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                Category {sortBy === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
              </TableHead>
              <TableHead>Tax Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No expenses found. Add your first expense to get started.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {new Date(expense.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${expense.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {expense.description || '-'}
                  </TableCell>
                  <TableCell>
                    {expense.vendor?.name || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {expense.category?.name || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell>
                    {expense.category?.deductible ? (
                      <Badge variant="secondary" className="bg-cyan-500 text-cyan-500">
                        Deductible
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        Non-deductible
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView && onView(expense)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit && onEdit(expense)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(expense.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
