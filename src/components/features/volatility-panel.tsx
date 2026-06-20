'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, TrendingUp, AlertTriangle, Shield } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { VolatilityResponse, CurrencyVolatility, fetchAPI, REGION_COLORS } from '@/lib/fashion-types'

export function VolatilityPanel() {
  const [data, setData] = useState<VolatilityResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/currency/volatility').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Analyzing FX volatility…</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">Failed to load</div>

  return (
    <div className="space-y-4">
      {/* Overall risk */}
      <Card className="border-white/[0.06] shadow-none bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className={`h-4 w-4 ${data.overallRisk > 60 ? 'text-red-400' : data.overallRisk > 30 ? 'text-amber-400' : 'text-emerald-400'}`} />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Portfolio FX Risk Score</span>
              </div>
              <p className={`text-3xl font-bold ${data.overallRisk > 60 ? 'text-red-400' : data.overallRisk > 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {data.overallRisk}<span className="text-base text-white/30">/100</span>
              </p>
              <p className="text-[10px] text-white/30">Aggregated across 4 currency pairs (90-day window)</p>
            </div>
            <Badge className={`text-xs ${data.overallRisk > 60 ? 'bg-red-500/[0.1] text-red-400 border-red-500/[0.15]' : data.overallRisk > 30 ? 'bg-amber-500/[0.1] text-amber-400 border-amber-500/[0.15]' : 'bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/[0.15]'}`}>
              {data.overallRisk > 60 ? 'HIGH RISK' : data.overallRisk > 30 ? 'MEDIUM RISK' : 'LOW RISK'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Per-pair breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        {data.pairs.map((pair: CurrencyVolatility) => (
          <Card key={pair.pair} className="border-white/[0.06] shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                  <Activity className="h-4 w-4" /> {pair.pair}
                </CardTitle>
                <Badge className={`text-[10px] ${pair.riskLevel === 'high' ? 'bg-red-500/[0.1] text-red-400 border-red-500/[0.15]' : pair.riskLevel === 'medium' ? 'bg-amber-500/[0.1] text-amber-400 border-amber-500/[0.15]' : 'bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/[0.15]'}`}>
                  {pair.riskLevel.toUpperCase()} · {pair.riskScore}/100
                </Badge>
              </div>
              <CardDescription className="text-white/30">90-day exchange rate movement with volatility bands</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Line chart */}
              <div className="h-40 mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pair.series} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} interval={14} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} domain={['auto', 'auto']} />
                    <RTooltip
                      formatter={(v: number) => [v.toFixed(4), 'Rate']}
                      labelFormatter={(l) => `Date: ${l}`}
                      contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <ReferenceLine y={pair.mean} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" label={{ value: 'μ', fontSize: 9, fill: 'rgba(255,255,255,0.3)' }} />
                    <Line type="monotone" dataKey="rate" stroke={REGION_COLORS['UK']} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 text-[10px]">
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">Current</p>
                  <p className="font-mono font-bold text-white/90">{pair.currentRate.toFixed(4)}</p>
                </div>
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">90d Change</p>
                  <p className={`font-mono font-bold ${pair.change90dPct > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pair.change90dPct > 0 ? '+' : ''}{pair.change90dPct}%
                  </p>
                </div>
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">Volatility</p>
                  <p className="font-mono font-bold text-amber-400">{pair.volatilityPct}%</p>
                </div>
                <div className="rounded bg-white/[0.04] p-2">
                  <p className="text-white/30">Range</p>
                  <p className="font-mono font-bold text-white/60">{pair.rangePct}%</p>
                </div>
              </div>
              {/* Min / Max */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-white/30">
                <span>Min: <span className="font-mono text-white/60">{pair.min.toFixed(4)}</span></span>
                <span>Mean: <span className="font-mono text-white/60">{pair.mean.toFixed(4)}</span></span>
                <span>Max: <span className="font-mono text-white/60">{pair.max.toFixed(4)}</span></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
