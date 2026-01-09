'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, CreditCard } from 'lucide-react'

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      
      const [subRes, invRes] = await Promise.all([
        fetch('/api/admin/billing/subscription'),
        fetch('/api/admin/billing/invoices?limit=10')
      ])
      
      const subData = await subRes.json()
      const invData = await invRes.json()
      
      if (subData.hasSubscription) {
        setSubscription(subData.subscription)
      }
      setInvoices(invData.invoices || [])
    } catch (err) {
      console.error('Error fetching billing data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return
    
    try {
      setCancelling(true)
      const res = await fetch('/api/admin/billing/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediately: false })
      })
      
      if (res.ok) {
        alert('Subscription will be cancelled at the end of the billing period')
        fetchBillingData()
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err)
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-8">Billing Management</h1>
        <Card>
          <CardContent className="pt-6">
            <div className="h-40 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing Management</h1>
        <p className="text-muted-foreground">Manage your subscription and billing</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          {!subscription ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No Active Subscription</p>
              <p className="text-muted-foreground mb-4">You're currently on pay-as-you-go</p>
              <Button asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    {subscription.items[0]?.productName || 'Subscription'}
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {formatCurrency(subscription.items[0]?.amount || 0, subscription.items[0]?.currency || 'usd')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per {subscription.items[0]?.interval}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Billing Period</span>
                  <span className="font-medium">
                    {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className="bg-cyan-400 border border-cyan-400 rounded p-3">
                    <p className="text-sm text-cyan-400">
                      Your subscription will be cancelled on {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                )}
              </div>

              {!subscription.cancelAtPeriodEnd && (
                <div className="border-t pt-4">
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
          <CardDescription>Your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Invoice #{invoice.number || invoice.id.slice(-8)}</div>
                    <div className="text-sm text-muted-foreground">{formatDate(invoice.created)}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(invoice.amountPaid, invoice.currency)}
                      </div>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.invoicePdf && (
                      <Button asChild size="sm" variant="outline">
                        <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
