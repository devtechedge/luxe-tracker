'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertOctagon, Clock, Flame, PackageX } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { StockRiskResponse, StockRisk, fetchAPI, REGION_COLORS, RISK_COLORS } from '@/lib/fashion-types'

export function StockRiskPanel() {
  const [data, setData] = useState<StockRiskResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/stock/risk-forecast').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Forecasting stock-out risk…</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">Failed to load</div>

  // Aggregate by region
  const regionAgg: Record<string, { critical: number; high: number; moderate: number; low: number }> = {}
  for (const r of data.allRisks) {
    if (!regionAgg[r.region]) regionAgg[r.region] = { critical: 0, high: 0, moderate: 0, low: 0 }
    regionAgg[r.region][r.riskLevel]++
  }
  const regionChart = Object.entries(regionAgg).map(([region, counts]) => ({
    region, ...counts, total: counts.critical + counts.high + counts.moderate + counts.low,
  }))

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-white/[0.06] bg-gradient-to-br from-red-500/[0.08] to-red-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertOctagon className="h-4 w-4 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-400">Critical</span>
            </div>
            <p className="text-2xl font-bold text-red-300">{data.criticalCount}</p>
            <p className="text-[10px] text-red-500/70">stock-outs imminent</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06] bg-gradient-to-br from-orange-500/[0.08] to-orange-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PackageX className="h-4 w-4 text-orange-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-400">High Risk</span>
            </div>
            <p className="text-2xl font-bold text-orange-300">{data.highCount}</p>
            <p className="text-[10px] text-orange-500/70">depleting fast</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-white/60" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Total Watched</span>
            </div>
            <p className="text-2xl font-bold text-white/90">{data.totalEntries}</p>
            <p className="text-[10px] text-white/30">product × region entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Region risk distribution */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white/90">Risk Distribution by Region</CardTitle>
          <CardDescription className="text-white/30">Stacked count of stock-out risk levels across regions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="region" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
                <Bar dataKey="high" stackId="a" fill="#f97316" name="High" />
                <Bar dataKey="moderate" stackId="a" fill="#f59e0b" name="Moderate" />
                <Bar dataKey="low" stackId="a" fill="#10b981" name="Low" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top risks list */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Flame className="h-4 w-4" /> Critical Stock-Out Forecast
          </CardTitle>
          <CardDescription className="text-white/30">Products at highest risk of running out — ranked by demand pressure × stock level</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[440px]">
            <div className="space-y-2">
              {data.topRisks.map((r: StockRisk, idx) => (
                <div key={idx} className="rounded-lg border border-white/[0.06] p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge className={`text-[10px] ${RISK_COLORS[r.riskLevel]}`} variant="outline">
                        {r.riskLevel.toUpperCase()}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white/90 truncate">{r.productName}</p>
                        <p className="text-[10px] text-white/30">{r.brand} · {r.category} · {r.region}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-lg font-bold ${
                        r.riskScore > 70 ? 'text-red-400' : r.riskScore > 45 ? 'text-orange-400' : r.riskScore > 25 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{r.riskScore}</div>
                      <p className="text-[9px] text-white/30 uppercase">risk</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <div className="rounded bg-white/[0.04] p-1.5">
                      <p className="text-white/30">Stock</p>
                      <p className="font-bold text-white/90">{r.stockLevel}%</p>
                    </div>
                    <div className="rounded bg-white/[0.04] p-1.5">
                      <p className="text-white/30">Hype</p>
                      <p className="font-bold text-white/90">{r.hypeScore}</p>
                    </div>
                    <div className="rounded bg-white/[0.04] p-1.5">
                      <p className="text-white/30">~Days Left</p>
                      <p className={`font-bold ${r.estimatedDaysToStockout < 7 ? 'text-red-400' : r.estimatedDaysToStockout < 30 ? 'text-amber-400' : 'text-white/90'}`}>
                        {r.estimatedDaysToStockout}d
                      </p>
                    </div>
                    <div className="rounded bg-white/[0.04] p-1.5">
                      <p className="text-white/30">Urgency</p>
                      <p className="font-bold text-white/90 text-[9px]">{r.restockUrgency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
