'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Palette, TrendingUp, Eye, Sparkles, SwatchBook, Zap } from 'lucide-react'
import { TrendResponse, TrendForecast, fetchAPI, BRAND_COLORS } from '@/lib/fashion-types'

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  color: <SwatchBook className="h-4 w-4" />,
  material: <Sparkles className="h-4 w-4" />,
  silhouette: <Palette className="h-4 w-4" />,
  accessory: <Zap className="h-4 w-4" />,
  vibe: <Eye className="h-4 w-4" />,
}

const TYPE_COLORS: Record<string, string> = {
  color: '#f59e0b',
  material: '#8b5cf6',
  silhouette: '#3b82f6',
  accessory: '#ec4899',
  vibe: '#10b981',
}

export function TrendForecastPanel() {
  const [data, setData] = useState<TrendResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchAPI('/api/trends/forecast').then((d: TrendResponse) => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Forecasting trends...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-400">Failed to load</div>

  const filtered = selectedType === 'all' ? data.trends : data.trends.filter((t: TrendForecast) => t.trendType === selectedType)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={0}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-pink-500/[0.08] to-pink-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Palette className="h-4 w-4 text-pink-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-pink-400/70">Active Trends</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.totalTrends}</p>
              <p className="text-[10px] text-white/30">tracked trend signals</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={1}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/70">Hottest Trend</span>
              </div>
              <p className="text-sm font-bold text-white/90 truncate">{data.trends[0]?.trendName}</p>
              <p className="text-[10px] text-white/30">intensity: {data.trends[0]?.intensity}/100</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={2}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] to-emerald-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/70">Seasons</span>
              </div>
              <p className="text-2xl font-bold text-white/90">{data.seasons.length}</p>
              <p className="text-[10px] text-white/30">{data.seasons.join(', ')}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Type filter tabs */}
      <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                <Palette className="h-4 w-4 text-pink-400" /> Seasonal Trend Forecast
              </CardTitle>
              <CardDescription className="text-white/30">Predicted color, material, silhouette, and vibe trends</CardDescription>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                  selectedType === 'all' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                }`}
              >
                All
              </button>
              {Object.keys(data.byType).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                    selectedType === type ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/[0.04] text-white/40 border border-white/[0.06]'
                  }`}
                >
                  {TYPE_ICONS[type]} {type}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((trend: TrendForecast, idx: number) => (
              <motion.div
                key={trend.id}
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                whileHover={{ scale: 1.02, y: -2 }}
                className="rounded-xl border border-white/[0.06] p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span style={{ color: TYPE_COLORS[trend.trendType] }}>
                        {TYPE_ICONS[trend.trendType]}
                      </span>
                      <Badge className="text-[8px] bg-white/[0.06] text-white/40 border-white/[0.06] capitalize">{trend.trendType}</Badge>
                    </div>
                    <p className="text-sm font-semibold text-white/90">{trend.trendName}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: idx * 0.05 }}
                      className="text-xl font-bold"
                      style={{ color: TYPE_COLORS[trend.trendType] }}
                    >
                      {trend.intensity}
                    </motion.div>
                    <p className="text-[8px] text-white/25 uppercase">intensity</p>
                  </div>
                </div>

                {/* Color palette */}
                {trend.colorPalette && trend.colorPalette.length > 0 && (
                  <div className="flex gap-1 mb-2">
                    {trend.colorPalette.map((color: string, ci: number) => (
                      <motion.div
                        key={ci}
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: idx * 0.05 + ci * 0.08 }}
                        className="h-7 w-7 rounded-md border border-white/10 shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-white/40 leading-relaxed mb-2">{trend.description}</p>

                <Separator className="my-2 bg-white/[0.06]" />

                <div className="flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1.5 text-white/30">
                    <span>{trend.season}</span>
                    <span>\u00B7</span>
                    <span>{trend.category}</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/30">
                    <span>Confidence:</span>
                    <span className={`font-bold ${trend.confidence >= 80 ? 'text-emerald-400' : trend.confidence >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                      {trend.confidence}%
                    </span>
                  </div>
                </div>

                {trend.keyBrands && trend.keyBrands.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {trend.keyBrands.map((brand: string, bi: number) => (
                      <Badge
                        key={bi}
                        variant="outline"
                        className="text-[8px] border-white/[0.08] text-white/40"
                        style={{ borderColor: BRAND_COLORS[brand] || 'rgba(255,255,255,0.08)', color: BRAND_COLORS[brand] || 'rgba(255,255,255,0.4)' }}
                      >
                        {brand}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
