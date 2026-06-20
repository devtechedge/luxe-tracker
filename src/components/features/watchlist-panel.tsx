'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Bell, Bookmark, BookmarkCheck, Trash2, AlertCircle, Info, AlertTriangle, X,
} from 'lucide-react'
import {
  DisparityRow, WatchlistItem, AlertItem, fetchAPI, postAPI, formatPrice,
  BRAND_COLORS, REGION_COLORS,
} from '@/lib/fashion-types'

export function WatchlistPanel() {
  const [products, setProducts] = useState<DisparityRow[]>([])
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const [prods, wl, al] = await Promise.all([
          fetchAPI('/api/disparity/matrix'),
          fetchAPI('/api/watchlist'),
          fetchAPI('/api/alerts'),
        ])
        if (cancelled) return
        setProducts(prods)
        setItems(wl.items)
        setAlerts(al.alerts)
        if (prods.length > 0 && !selectedProductId) setSelectedProductId(prods[0].productId)
      } catch (e) { console.error(e) }
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [])

  const refreshData = async () => {
    try {
      const [wl, al] = await Promise.all([
        fetchAPI('/api/watchlist'),
        fetchAPI('/api/alerts'),
      ])
      setItems(wl.items)
      setAlerts(al.alerts)
    } catch (e) { console.error(e) }
  }

  const addToWatchlist = async () => {
    if (!selectedProductId) return
    await postAPI('/api/watchlist', { productId: selectedProductId, watchType: 'product' })
    refreshData()
  }

  const removeFromWatchlist = async (id: string) => {
    await postAPI('/api/watchlist/delete', { id })
    refreshData()
  }

  const markAlertRead = async (id: string) => {
    await postAPI('/api/alerts/read', { id })
    refreshData()
  }

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <AlertCircle className="h-3.5 w-3.5 text-red-400" />
    if (severity === 'warning') return <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
    return <Info className="h-3.5 w-3.5 text-sky-400" />
  }

  const getAlertTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      price_drop: 'bg-emerald-500/[0.1] text-emerald-400',
      launch_reminder: 'bg-amber-500/[0.1] text-amber-400',
      stock_change: 'bg-red-500/[0.1] text-red-400',
      arbitrage: 'bg-violet-500/[0.1] text-violet-400',
    }
    return map[type] || 'bg-white/[0.06] text-white/40'
  }

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Loading watchlist…</div>

  return (
    <div className="space-y-4">
      {/* Add to watchlist */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Bookmark className="h-4 w-4" /> Track a Product
          </CardTitle>
          <CardDescription className="text-white/30">Pin products to your watchlist — we&apos;ll monitor price changes and stock levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={selectedProductId} onValueChange={setSelectedProductId}>
              <SelectTrigger className="bg-white/[0.04] border-white/10 text-white/70 flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={p.productId} value={p.productId}>
                    {p.brand} — {p.productName.slice(0, 40)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addToWatchlist} size="sm">
              <BookmarkPlus /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Watchlist items */}
        <Card className="border-white/[0.06] shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                <BookmarkCheck className="h-4 w-4" /> My Watchlist
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-white/[0.06] text-white/40 border-white/[0.06]">{items.length} items</Badge>
            </div>
            <CardDescription className="text-white/30">Pinned products with current regional price ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[480px]">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <Bookmark className="h-8 w-8 mx-auto mb-2 text-white/20" />
                  <p className="text-xs text-white/30">No items yet — add one above</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/[0.06] p-3 bg-white/[0.02]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white/90 truncate">{item.productName}</p>
                          <p className="text-[10px] text-white/30">{item.brand}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-white/30 hover:text-red-400"
                          onClick={() => removeFromWatchlist(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="rounded bg-emerald-500/[0.08] p-1.5">
                          <p className="text-white/30">Cheapest (EUR)</p>
                          <p className="font-bold text-emerald-400">
                            {item.currentMinPriceEUR ? `€${item.currentMinPriceEUR.toLocaleString()}` : '—'}
                          </p>
                        </div>
                        <div className="rounded bg-red-500/[0.08] p-1.5">
                          <p className="text-white/30">Most Expensive (EUR)</p>
                          <p className="font-bold text-red-400">
                            {item.currentMaxPriceEUR ? `€${item.currentMaxPriceEUR.toLocaleString()}` : '—'}
                          </p>
                        </div>
                      </div>
                      {item.regionalBreakdown.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.regionalBreakdown.map((rb, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[9px]"
                              style={{
                                backgroundColor: REGION_COLORS[rb.region] + '20',
                                color: REGION_COLORS[rb.region],
                                borderColor: REGION_COLORS[rb.region] + '40',
                              }}
                            >
                              {rb.region}: {formatPrice(rb.price, rb.currency)}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-[9px] text-white/30 mt-2">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alerts feed */}
        <Card className="border-white/[0.06] shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                <Bell className="h-4 w-4" /> Alert Feed
              </CardTitle>
              <Badge variant="outline" className="text-[10px] bg-white/[0.06] text-white/40 border-white/[0.06]">
                {alerts.filter(a => !a.read).length} unread
              </Badge>
            </div>
            <CardDescription className="text-white/30">Price drops, launch reminders, and stock changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[480px]">
              {alerts.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-white/20" />
                  <p className="text-xs text-white/30">No alerts yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-lg border p-3 ${
                        alert.read ? 'border-white/[0.06] bg-white/[0.02]' :
                        alert.severity === 'critical' ? 'border-red-500/[0.15] bg-red-500/[0.04]' :
                        alert.severity === 'warning' ? 'border-amber-500/[0.15] bg-amber-500/[0.04]' :
                        'border-sky-500/[0.15] bg-sky-500/[0.04]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">{getAlertIcon(alert.alertType, alert.severity)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[9px] ${getAlertTypeBadge(alert.alertType)}`}>
                              {alert.alertType.replace('_', ' ')}
                            </Badge>
                            <span className="text-[9px] text-white/30">
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-white/70">{alert.message}</p>
                          {alert.region && (
                            <p className="text-[10px] text-white/30 mt-1">Region: {alert.region}</p>
                          )}
                        </div>
                        {!alert.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-white/30 hover:text-white/60"
                            onClick={() => markAlertRead(alert.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Inline BookmarkPlus since lucide may not have it
function BookmarkPlus({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h6" />
      <path d="M18 14v6" />
      <path d="M15 17h6" />
    </svg>
  )
}
