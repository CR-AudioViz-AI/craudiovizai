'use client'

// components/expenses/SubscriptionListTable.tsx
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
  MoreVertical, 
  Edit, 
  Trash2,
  Eye,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  PauseCircle
} from 'lucide-react'

interface Subscription {
  id: string
  name: string
  amount: number
  billing_cycle: 'monthly' | 'quarterly' | 'annual'
  status: 'active' | 'paused' | 'cancelled'
  next_renewal_date?: string
  auto_renew: boolean
  vendor?: { id: string; name: string }
}

interface SubscriptionListTableProps {
  onEdit?: (subscription: Subscription) => void
  onDelete?: (subscriptionId: string) => void
  onView?: (subscription: Subscription) => void
}

export default function SubscriptionListTable({ onEdit, onDelete, onView }: SubscriptionListTableProps) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadSubscriptions()
  }, [filterStatus, searchTerm])

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        status: filterStatus,
        sort_by: 'next_renewal_date'
      })

      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/expenses/subscriptions?${params}`)
      const data = await response.json()

      if (data.success) {
        setSubscriptions(data.subscriptions || [])
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/expenses/subscriptions/${subscriptionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        loadSubscriptions()
      }
    } catch (error) {
      console.error('Failed to update subscription status:', error)
    }
  }

  const handleDelete = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return

    try {
      const response = await fetch(`/api/expenses/subscriptions/${subscriptionId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadSubscriptions()
        if (onDelete) onDelete(subscriptionId)
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-cyan-500 text-cyan-500"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>
      case 'paused':
        return <Badge className="bg-cyan-400 text-cyan-400"><PauseCircle className="h-3 w-3 mr-1" />Paused</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDaysUntilRenewal = (renewalDate: string) => {
    const today = new Date()
    const renewal = new Date(renewalDate)
    const days = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return days
  }

  const getRenewalBadge = (renewalDate?: string) => {
    if (!renewalDate) return null
    
    const days = getDaysUntilRenewal(renewalDate)
    
    if (days < 0) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>
    } else if (days <= 7) {
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />{days}d</Badge>
    } else if (days <= 30) {
      return <Badge className="bg-cyan-500 text-cyan-500"><Calendar className="h-3 w-3 mr-1" />{days}d</Badge>
    } else {
      return <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />{days}d</Badge>
    }
  }

  const getCycleBadge = (cycle: string) => {
    const colors = {
      monthly: 'bg-blue-100 text-blue-800',
      quarterly: 'bg-cyan-500 text-cyan-500',
      annual: 'bg-cyan-500 text-cyan-500'
    }
    return <Badge className={colors[cycle as keyof typeof colors] || ''}>{cycle}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="h-10 w-64 bg-muted animate-pulse rounded" />
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
          placeholder="Search subscriptions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subscriptions</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => window.open('/api/expenses/export?type=subscriptions&format=csv', '_blank')}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Monthly Cost</p>
          <p className="text-2xl font-bold">
            ${subscriptions
              .filter(s => s.status === 'active')
              .reduce((sum, s) => {
                if (s.billing_cycle === 'monthly') return sum + s.amount
                if (s.billing_cycle === 'quarterly') return sum + (s.amount / 3)
                if (s.billing_cycle === 'annual') return sum + (s.amount / 12)
                return sum
              }, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Annual Cost</p>
          <p className="text-2xl font-bold">
            ${subscriptions
              .filter(s => s.status === 'active')
              .reduce((sum, s) => {
                if (s.billing_cycle === 'monthly') return sum + (s.amount * 12)
                if (s.billing_cycle === 'quarterly') return sum + (s.amount * 4)
                if (s.billing_cycle === 'annual') return sum + s.amount
                return sum
              }, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Upcoming Renewals (30d)</p>
          <p className="text-2xl font-bold">
            {subscriptions.filter(s => {
              if (!s.next_renewal_date || s.status !== 'active') return false
              return getDaysUntilRenewal(s.next_renewal_date) <= 30
            }).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Billing Cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next Renewal</TableHead>
              <TableHead>Auto Renew</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  No subscriptions found. Add your first subscription to get started.
                </TableCell>
              </TableRow>
            ) : (
              subscriptions.map((subscription) => (
                <TableRow key={subscription.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{subscription.name}</TableCell>
                  <TableCell>
                    {subscription.vendor?.name || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${subscription.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{getCycleBadge(subscription.billing_cycle)}</TableCell>
                  <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                  <TableCell>
                    {subscription.next_renewal_date ? (
                      <div className="flex items-center gap-2">
                        {new Date(subscription.next_renewal_date).toLocaleDateString()}
                        {getRenewalBadge(subscription.next_renewal_date)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {subscription.auto_renew ? (
                      <Badge variant="secondary">Yes</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
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
                        <DropdownMenuItem onClick={() => onView && onView(subscription)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit && onEdit(subscription)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        {subscription.status === 'active' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(subscription.id, 'paused')}>
                            <PauseCircle className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {subscription.status === 'paused' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(subscription.id, 'active')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate
                          </DropdownMenuItem>
                        )}
                        {subscription.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleStatusChange(subscription.id, 'cancelled')}>
                            Cancel
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDelete(subscription.id)}
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
    </div>
  )
}
