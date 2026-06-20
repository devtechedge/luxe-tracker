'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Flame, TrendingUp, Clock, Crown, Sparkles } from 'lucide-react'
import { HypeResponse, HypeProduct, fetchAPI, BRAND_COLORS } from '@/lib/fashion-types'

export function HypePanel() {
  const [data, setData] = useState<HypeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/hype/predict').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Computing hype scores…</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">Failed to load</div>

  const top10 = data.topHyped

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-white/[0.06] bg-gradient-to-br from-orange-500/[0.08] to-orange-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-orange-400">Avg Hype</span>
            </div>
            <p className="text-2xl font-bold text-orange-300">{data.avgHypeScore}</p>
            <p className="text-[10px] text-orange-500/70">across {data.totalProducts} products</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="h-4 w-4 text-white/60" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Top Score</span>
            </div>
            <p className="text-2xl font-bold text-white/90">{top10[0]?.hypeScore || '—'}</p>
            <p className="text-[10px] text-white/30 truncate">{top10[0]?.productName.slice(0, 28)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400">Limited Editions</span>
            </div>
            <p className="text-2xl font-bold text-violet-300">
              {data.allProducts.filter(p => p.editionType === 'limited' || p.editionType === 'exclusive').length}
            </p>
            <p className="text-[10px] text-violet-500/70">high-exclusivity SKUs</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Upcoming (7d)</span>
            </div>
            <p className="text-2xl font-bold text-amber-300">
              {data.allProducts.filter(p => p.daysToLaunch !== null && p.daysToLaunch >= 0 && p.daysToLaunch <= 7).length}
            </p>
            <p className="text-[10px] text-amber-500/70">launches this week</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Flame className="h-4 w-4" /> Top 10 Hype Predictions
          </CardTitle>
          <CardDescription className="text-white/30">Weighted scoring: brand tier (20%) + category demand (30%) + season (15%) + exclusivity (20%) + decay (15%)</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px]">
            <div className="space-y-3">
              {top10.map((p: HypeProduct, idx) => (
                <div key={p.productId} className="rounded-lg border border-white/[0.06] p-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${idx < 3 ? 'bg-amber-500/[0.15] text-amber-300' : 'bg-white/[0.06] text-white/40'}`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/90 truncate">{p.productName}</p>
                        <p className="text-[10px] text-white/30">
                          <span style={{ color: BRAND_COLORS[p.brand] }} className="font-medium">{p.brand}</span>
                          {' · '}{p.category}{' · '}{p.season}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-bold ${p.hypeScore > 80 ? 'text-red-400' : p.hypeScore > 65 ? 'text-orange-400' : 'text-amber-400'}`}>
                        {p.hypeScore}
                      </div>
                      <p className="text-[9px] text-white/30 uppercase">hype</p>
                    </div>
                  </div>
                  {/* Hype breakdown bar */}
                  {p.hypeBreakdown && (
                    <div className="space-y-1.5">
                      <Progress value={p.hypeScore} className="h-2" />
                      <div className="grid grid-cols-5 gap-1.5 text-[9px]">
                        {[
                          { label: 'Brand', val: p.hypeBreakdown.brandTier, max: 20, color: 'bg-white/40' },
                          { label: 'Category', val: p.hypeBreakdown.category, max: 30, color: 'bg-emerald-500' },
                          { label: 'Season', val: p.hypeBreakdown.season, max: 15, color: 'bg-sky-500' },
                          { label: 'Exclusivity', val: p.hypeBreakdown.exclusivity, max: 20, color: 'bg-violet-500' },
                          { label: 'Decay', val: p.hypeBreakdown.decay, max: 15, color: 'bg-amber-500' },
                        ].map(b => (
                          <div key={b.label}>
                            <div className="flex justify-between mb-0.5">
                              <span className="text-white/30">{b.label}</span>
                              <span className="font-mono text-white/60">{(b.val).toFixed(0)}</span>
                            </div>
                            <div className="h-1 bg-white/[0.06] rounded overflow-hidden">
                              <div className={`h-full ${b.color}`} style={{ width: `${(b.val / b.max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Footer info */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] capitalize bg-white/[0.06] text-white/40 border-white/[0.06]">{p.editionType}</Badge>
                      <Badge variant="outline" className="text-[9px] bg-white/[0.06] text-white/40 border-white/[0.06]">Resale: {(p.resaleValueIdx * 100).toFixed(0)}%</Badge>
                    </div>
                    {p.daysToLaunch !== null && (
                      <Badge className={`text-[9px] ${p.daysToLaunch <= 0 ? 'bg-red-500/[0.1] text-red-400' : p.daysToLaunch <= 7 ? 'bg-amber-500/[0.1] text-amber-400' : 'bg-white/[0.06] text-white/40'}`}>
                        {p.daysToLaunch <= 0 ? 'Launched' : `${p.daysToLaunch}d to launch`}
                        {p.launchRegion ? ` · ${p.launchRegion}` : ''}
                      </Badge>
                    )}
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
