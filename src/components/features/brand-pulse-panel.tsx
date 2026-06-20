'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Activity, Crown, Gauge } from 'lucide-react'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'
import { PulseResponse, BrandPulse, fetchAPI, BRAND_COLORS } from '@/lib/fashion-types'

export function BrandPulsePanel() {
  const [data, setData] = useState<PulseResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/brand/pulse').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Measuring brand pulses…</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">Failed to load</div>

  return (
    <div className="space-y-4">
      {/* Overall ranking */}
      <Card className="border-white/[0.06] shadow-none bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wide text-white/60">Brand Trend Pulse Ranking</span>
          </div>
          <div className="space-y-2">
            {data.brands.map((b: BrandPulse, idx) => (
              <div key={b.brandId} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${idx === 0 ? 'bg-amber-500/[0.15] text-amber-300' : 'bg-white/[0.06] text-white/40'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold" style={{ color: BRAND_COLORS[b.brand] }}>{b.logo} {b.brand}</span>
                      <span className="text-[10px] text-white/30">{b.country}</span>
                    </div>
                    <span className="text-sm font-bold text-white/90">{b.overallScore}<span className="text-[10px] text-white/30">/100</span></span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${b.overallScore}%`,
                        backgroundColor: BRAND_COLORS[b.brand],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-brand radar charts */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.brands.map((brand: BrandPulse) => {
          const radarData = [
            { metric: 'Prestige', value: brand.dimensions.prestige },
            { metric: 'Pricing', value: brand.dimensions.pricingPower },
            { metric: 'Hype', value: brand.dimensions.hypeIndex },
            { metric: 'Velocity', value: brand.dimensions.launchVelocity },
            { metric: 'Stock', value: brand.dimensions.stockHealth },
          ]
          return (
            <Card key={brand.brandId} className="border-white/[0.06] shadow-none">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold" style={{ color: BRAND_COLORS[brand.brand] }}>
                    {brand.logo} {brand.brand}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-white/[0.06] text-white/40 border-white/[0.06]">{brand.overallScore}/100</Badge>
                </div>
                <CardDescription className="text-[10px] text-white/30">{brand.productCount} products · {brand.upcomingLaunches} upcoming</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="75%">
                      <PolarGrid stroke="rgba(255,255,255,0.04)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.3)' }} />
                      <RTooltip
                        formatter={(v: number) => [`${v}/100`, 'Score']}
                        contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <Radar
                        dataKey="value"
                        stroke={BRAND_COLORS[brand.brand]}
                        fill={BRAND_COLORS[brand.brand]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                {/* Dimension scores */}
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {radarData.map(d => (
                    <div key={d.metric} className="text-center">
                      <p className="text-[8px] text-white/30 uppercase">{d.metric}</p>
                      <p className="text-[10px] font-bold text-white/90">{d.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dimension comparison table */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Gauge className="h-4 w-4" /> Dimension Comparison Matrix
          </CardTitle>
          <CardDescription className="text-white/30">Side-by-side comparison of all 5 dimensions across brands</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[260px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left py-2 text-[10px] font-semibold text-white/30 uppercase">Brand</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-white/30 uppercase">Prestige</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-white/30 uppercase">Pricing Power</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-white/30 uppercase">Hype Index</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-white/30 uppercase">Launch Velocity</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-white/30 uppercase">Stock Health</th>
                  <th className="text-right py-2 text-[10px] font-semibold text-white/30 uppercase">Overall</th>
                </tr>
              </thead>
              <tbody>
                {data.brands.map(b => (
                  <tr key={b.brandId} className="border-b border-white/[0.04]">
                    <td className="py-2 font-semibold" style={{ color: BRAND_COLORS[b.brand] }}>
                      {b.logo} {b.brand}
                    </td>
                    <td className="text-right font-mono text-white/60">{b.dimensions.prestige}</td>
                    <td className="text-right font-mono text-white/60">{b.dimensions.pricingPower}</td>
                    <td className="text-right font-mono text-white/60">{b.dimensions.hypeIndex}</td>
                    <td className="text-right font-mono text-white/60">{b.dimensions.launchVelocity}</td>
                    <td className="text-right font-mono text-white/60">{b.dimensions.stockHealth}</td>
                    <td className="text-right font-mono font-bold text-white/90">{b.overallScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
