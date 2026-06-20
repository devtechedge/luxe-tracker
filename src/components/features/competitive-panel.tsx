'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { Swords, Trophy, TrendingDown, TrendingUp } from 'lucide-react'
import { CompetitiveResponse, CompetitiveCategory, fetchAPI, BRAND_COLORS } from '@/lib/fashion-types'

export function CompetitivePanel() {
  const [data, setData] = useState<CompetitiveResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/competitive/matrix').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Computing competitive matrix…</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">Failed to load</div>

  // Build chart data: category × brand avg price
  const chartData = data.categories.map(cat => {
    const row: any = { category: cat.category }
    for (const b of cat.brands) row[b.brand] = b.avgPriceEUR
    return row
  })

  return (
    <div className="space-y-4">
      {/* Stacked bar chart */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Swords className="h-4 w-4" /> Cross-Brand Price Positioning
          </CardTitle>
          <CardDescription className="text-white/30">Average regional price (EUR) per brand within each product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `€${v}`} />
                <RTooltip
                  formatter={(v: number) => [`€${v.toLocaleString()}`, '']}
                  contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {Object.entries(BRAND_COLORS).map(([brand, color]) => (
                  <Bar key={brand} dataKey={brand} fill={color} radius={[3, 3, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category breakdown cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.categories.map((cat: CompetitiveCategory) => (
          <Card key={cat.category} className="border-white/[0.06] shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white/90">{cat.category}</CardTitle>
                <Badge variant="outline" className="text-[10px] bg-white/[0.06] text-white/40 border-white/[0.06]">{cat.totalProducts} SKUs</Badge>
              </div>
              <CardDescription className="text-[10px] text-white/30">
                Spread: €{cat.priceSpreadEUR.toLocaleString()} ({cat.priceSpreadPct}%)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Value leader */}
              <div className="rounded bg-emerald-500/[0.08] border border-emerald-500/[0.15] p-2 mb-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingDown className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] font-semibold uppercase text-emerald-400">Value Leader</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">{cat.valueLeader}</span>
                  <span className="text-xs font-mono text-emerald-400">
                    €{cat.brands.find(b => b.brand === cat.valueLeader)?.avgPriceEUR.toLocaleString()}
                  </span>
                </div>
              </div>
              {/* Premium leader */}
              <div className="rounded bg-violet-500/[0.08] border border-violet-500/[0.15] p-2 mb-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TrendingUp className="h-3 w-3 text-violet-400" />
                  <span className="text-[9px] font-semibold uppercase text-violet-400">Premium Leader</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300">{cat.premiumLeader}</span>
                  <span className="text-xs font-mono text-violet-400">
                    €{cat.brands.find(b => b.brand === cat.premiumLeader)?.avgPriceEUR.toLocaleString()}
                  </span>
                </div>
              </div>
              {/* All brands ranked */}
              <ScrollArea className="h-[100px]">
                <div className="space-y-1">
                  {cat.brands.map((b, idx) => (
                    <div key={b.brand} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/30 w-3">{idx + 1}.</span>
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[b.brand] }} />
                        <span className="text-white/60">{b.brand}</span>
                        <span className="text-white/30">({b.productCount})</span>
                      </div>
                      <span className="font-mono text-white/90">€{b.avgPriceEUR.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
