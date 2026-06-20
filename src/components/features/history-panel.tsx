'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceDot, Legend,
} from 'recharts'
import { TrendingUp, Activity, AlertCircle, History, ChevronRight } from 'lucide-react'
import { DisparityRow, PriceMover, HistoryResponse, fetchAPI, REGION_COLORS } from '@/lib/fashion-types'

export function HistoryPanel() {
  const [products, setProducts] = useState<DisparityRow[]>([])
  const [movers, setMovers] = useState<PriceMover[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('EU')
  const [timeline, setTimeline] = useState<{ date: string; price: number; changePct: number }[] | null>(null)
  const [anomalies, setAnomalies] = useState<{ date: string; price: number; changePct: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchAPI('/api/disparity/matrix'),
      fetchAPI('/api/history/timeline'),
    ]).then(([d, h]: [DisparityRow[], HistoryResponse]) => {
      if (cancelled) return
      setProducts(d)
      setMovers(h.topMovers)
      if (d.length > 0) setSelectedProductId(d[0].productId)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedProductId) return
    let cancelled = false
    fetchAPI(`/api/history/timeline?productId=${selectedProductId}`)
      .then((d: any) => {
        if (cancelled) return
        const t = d.timelines.find((tl: any) => tl.region === selectedRegion)
        setTimeline(t?.series || [])
        setAnomalies(t?.anomalies || [])
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedProductId, selectedRegion])

  return (
    <div className="space-y-4">
      {/* Top movers */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <TrendingUp className="h-4 w-4" /> Top Price Movers (90 days)
          </CardTitle>
          <CardDescription className="text-white/30">Products with largest price changes across all regions — tap to inspect</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[180px]">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {movers.slice(0, 12).map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedProductId(m.productId)}
                  className={`text-left rounded-lg border p-2 transition-all hover:bg-white/[0.04] ${
                    selectedProductId === m.productId ? 'border-amber-500/[0.3] bg-amber-500/[0.06]' : 'border-white/[0.06] bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-white/90 truncate">{m.productName}</span>
                    <Badge variant="outline" className="text-[9px]" style={{
                      backgroundColor: REGION_COLORS[m.region] + '20',
                      color: REGION_COLORS[m.region],
                      borderColor: REGION_COLORS[m.region] + '40',
                    }}>
                      {m.region}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/30">{m.brand}</span>
                    <span className={`text-xs font-bold ${m.change90dPct > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {m.change90dPct > 0 ? '+' : ''}{m.change90dPct}%
                    </span>
                  </div>
                  {m.anomalyCount > 0 && (
                    <p className="text-[9px] text-amber-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-2.5 w-2.5" /> {m.anomalyCount} anomalies
                    </p>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Timeline chart */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                <History className="h-4 w-4" /> Price History Timeline
              </CardTitle>
              <CardDescription className="text-white/30">90-day price evolution with anomaly detection</CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="text-xs border border-white/10 rounded px-2 py-1 bg-white/[0.04] text-white/70 max-w-[200px]"
              >
                {products.map(p => (
                  <option key={p.productId} value={p.productId}>{p.brand} — {p.productName.slice(0, 30)}</option>
                ))}
              </select>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-xs border border-white/10 rounded px-2 py-1 bg-white/[0.04] text-white/70"
              >
                {['EU', 'US', 'UK', 'Norway', 'India'].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-white/30">Loading timeline…</div>
          ) : timeline && timeline.length > 0 ? (
            <>
              <div className="h-72 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} interval={14} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => v.toLocaleString()} />
                    <RTooltip
                      formatter={(v: number, n: string) => [v.toLocaleString(), n === 'price' ? 'Price' : 'Change %']}
                      labelFormatter={(l) => `Date: ${l}`}
                      contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <Line type="monotone" dataKey="price" stroke={REGION_COLORS[selectedRegion]} strokeWidth={2} dot={false} />
                    {anomalies.map((a, i) => (
                      <ReferenceDot
                        key={i}
                        x={a.date}
                        y={a.price}
                        r={4}
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Anomaly list */}
              {anomalies.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-xs font-semibold text-white/60">Detected Anomalies ({anomalies.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {anomalies.map((a, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] bg-red-500/[0.1] border-red-500/[0.15] text-red-400">
                        {a.date} · {a.changePct > 0 ? '+' : ''}{a.changePct}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-2 mt-3 text-[10px]">
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">90d Start</p>
                  <p className="font-mono font-bold text-white/90">{timeline[0]?.price.toLocaleString()}</p>
                </div>
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">90d End</p>
                  <p className="font-mono font-bold text-white/90">{timeline[timeline.length - 1]?.price.toLocaleString()}</p>
                </div>
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">Change</p>
                  <p className={`font-mono font-bold ${
                    ((timeline[timeline.length - 1]?.price || 0) - (timeline[0]?.price || 0)) > 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}>
                    {((((timeline[timeline.length - 1]?.price || 0) - (timeline[0]?.price || 0)) / (timeline[0]?.price || 1)) * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">Anomalies</p>
                  <p className="font-mono font-bold text-amber-400">{anomalies.length}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-white/30">No timeline data</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
