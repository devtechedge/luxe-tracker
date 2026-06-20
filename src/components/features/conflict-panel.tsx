'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { AlertTriangle, Calendar, Users, Zap } from 'lucide-react'
import { ConflictResponse, fetchAPI, BRAND_COLORS } from '@/lib/fashion-types'

const RISK_COLORS = {
  critical: '#ef4444', moderate: '#f59e0b', low: '#10b981',
}

export function ConflictPanel() {
  const [data, setData] = useState<ConflictResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/launches/conflicts').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Scanning for cannibalization…</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">Failed to load</div>

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-white/[0.06] bg-gradient-to-br from-red-500/[0.08] to-red-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-400">Conflict Days</span>
            </div>
            <p className="text-2xl font-bold text-red-300">{data.totalConflicts}</p>
            <p className="text-[10px] text-red-500/70">multi-brand launch collisions</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Critical Days</span>
            </div>
            <p className="text-2xl font-bold text-amber-300">
              {data.conflictDays.filter(d => d.cannibalizationRisk === 'critical').length}
            </p>
            <p className="text-[10px] text-amber-500/70">3+ launches same day</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-white/60" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">Peak Brands</span>
            </div>
            <p className="text-2xl font-bold text-white/90">
              {Math.max(...data.weeklyDensity.map(w => w.brandCount), 0)}
            </p>
            <p className="text-[10px] text-white/30">in busiest week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly density chart */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white/90">Weekly Launch Density</CardTitle>
          <CardDescription className="text-white/30">Competition intensity per week — total launches + unique brands</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyDensity} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="weekStart" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                <RTooltip
                  formatter={(v: number, name: string) => [v, name === 'totalLaunches' ? 'Launches' : 'Brands']}
                  labelFormatter={(l) => `Week of ${l}`}
                  contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Bar yAxisId="left" dataKey="totalLaunches" name="Launches" fill="#e94560" radius={[3, 3, 0, 0]} />
                <Bar yAxisId="right" dataKey="brandCount" name="Brands" fill="#533483" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Conflict days list */}
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Calendar className="h-4 w-4" /> Cannibalization Risk Days
          </CardTitle>
          <CardDescription className="text-white/30">Dates when multiple brands launch — competing for the same consumer attention</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {data.conflictDays.map((day, idx) => (
                <div key={idx} className={`rounded-lg border p-3 ${
                  day.cannibalizationRisk === 'critical' ? 'border-red-500/[0.15] bg-red-500/[0.04]' :
                  day.cannibalizationRisk === 'moderate' ? 'border-amber-500/[0.15] bg-amber-500/[0.04]' :
                  'border-white/[0.06] bg-white/[0.02]'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-white/30" />
                      <span className="text-xs font-semibold text-white/90">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <Badge
                      className="text-[9px]"
                      style={{
                        backgroundColor: RISK_COLORS[day.cannibalizationRisk as keyof typeof RISK_COLORS] + '20',
                        color: RISK_COLORS[day.cannibalizationRisk as keyof typeof RISK_COLORS],
                        borderColor: RISK_COLORS[day.cannibalizationRisk as keyof typeof RISK_COLORS] + '40',
                      }}
                      variant="outline"
                    >
                      {day.cannibalizationRisk.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-white/30">{day.eventCount} launches · {day.brands.length} brands:</span>
                    {day.brands.map(b => (
                      <Badge key={b} variant="outline" className="text-[9px]" style={{
                        borderColor: BRAND_COLORS[b], color: BRAND_COLORS[b],
                      }}>
                        {b}
                      </Badge>
                    ))}
                  </div>
                  <Separator className="my-2 bg-white/[0.06]" />
                  <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    {day.events.map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[e.brand] }} />
                        <span className="text-white/60 truncate flex-1">{e.productName}</span>
                        <span className="text-white/30">{e.region}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.conflictDays.length === 0 && (
                <div className="py-8 text-center text-sm text-white/30">No conflicts detected</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
