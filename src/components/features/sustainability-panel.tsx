'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { TreePine, Leaf, ShieldCheck, Recycle, Heart, TrendingUp } from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'
import { SustainabilityResponse, SustainabilityScore, fetchAPI, BRAND_COLORS } from '@/lib/fashion-types'

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const DIMENSION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  carbonScore: { label: 'Carbon', icon: <TreePine className="h-3 w-3" />, color: '#10b981' },
  materialSourcing: { label: 'Materials', icon: <Leaf className="h-3 w-3" />, color: '#84cc16' },
  supplyChainTransparency: { label: 'Supply Chain', icon: <ShieldCheck className="h-3 w-3" />, color: '#3b82f6' },
  circularityIndex: { label: 'Circularity', icon: <Recycle className="h-3 w-3" />, color: '#8b5cf6' },
  laborPracticeScore: { label: 'Labor', icon: <Heart className="h-3 w-3" />, color: '#f59e0b' },
}

export function SustainabilityPanel() {
  const [data, setData] = useState<SustainabilityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string>('')

  useEffect(() => {
    fetchAPI('/api/sustainability/scores').then((d: SustainabilityResponse) => {
      setData(d)
      if (d.scores.length > 0) setSelectedBrand(d.scores[0].brand)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Computing sustainability scores...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-400">Failed to load</div>

  const selected = data.scores.find((s: SustainabilityScore) => s.brand === selectedBrand) || data.scores[0]
  const radarData = Object.entries(selected.dimensions).map(([key, value]) => ({
    dimension: DIMENSION_LABELS[key]?.label || key,
    value,
    industry: data.industryAvg[key as keyof typeof data.industryAvg] || 50,
  }))

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={0}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] to-emerald-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TreePine className="h-4 w-4 text-emerald-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400/70">Top Scorer</span>
              </div>
              <p className="text-lg font-bold text-white/90">{data.scores[0]?.brand}</p>
              <p className="text-[10px] text-white/30">{data.scores[0]?.overallScore}/100 overall</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={1}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-amber-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/70">Industry Avg</span>
              </div>
              <p className="text-lg font-bold text-white/90">{data.industryAvg.overall}</p>
              <p className="text-[10px] text-white/30">across 5 luxury houses</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={staggerItem} initial="hidden" animate="visible" custom={2}>
          <Card className="border-white/[0.06] bg-gradient-to-br from-violet-500/[0.08] to-violet-600/[0.02] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Recycle className="h-4 w-4 text-violet-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400/70">Best Circularity</span>
              </div>
              <p className="text-lg font-bold text-white/90">
                {[...data.scores].sort((a, b) => b.dimensions.circularityIndex - a.dimensions.circularityIndex)[0]?.brand}
              </p>
              <p className="text-[10px] text-white/30">circularity index leader</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Radar chart */}
        <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                  <TreePine className="h-4 w-4 text-emerald-400" /> Sustainability Radar
                </CardTitle>
                <CardDescription className="text-white/30">5-dimensional sustainability profile</CardDescription>
              </div>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="text-xs border border-white/10 rounded px-2 py-1 bg-white/[0.04] text-white/70"
              >
                {data.scores.map((s: SustainabilityScore) => (
                  <option key={s.brand} value={s.brand}>{s.brand}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.2)' }} />
                  <RTooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Radar name="Brand" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  <Radar name="Industry Avg" dataKey="industry" stroke="rgba(255,255,255,0.2)" fill="rgba(255,255,255,0.05)" fillOpacity={0.3} strokeWidth={1} strokeDasharray="5 5" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* All brands comparison */}
        <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
              <ShieldCheck className="h-4 w-4 text-cyan-400" /> Brand Comparison
            </CardTitle>
            <CardDescription className="text-white/30">Overall sustainability scores and dimension breakdowns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.scores.map((score: SustainabilityScore, idx: number) => (
                <motion.div
                  key={score.brand}
                  variants={staggerItem}
                  initial="hidden"
                  animate="visible"
                  custom={idx}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedBrand(score.brand)}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    selectedBrand === score.brand ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white/80" style={{ color: BRAND_COLORS[score.brand] }}>
                        {score.brand}
                      </span>
                      <Badge className="text-[9px] bg-white/[0.06] text-white/40 border-white/[0.06]">#{idx + 1}</Badge>
                    </div>
                    <span className={`text-lg font-bold ${score.overallScore >= 70 ? 'text-emerald-400' : score.overallScore >= 55 ? 'text-amber-400' : 'text-red-400'}`}>
                      {score.overallScore}
                    </span>
                  </div>
                  <Progress value={score.overallScore} className="h-1.5 mb-2" />
                  <div className="grid grid-cols-5 gap-1.5 text-[9px]">
                    {Object.entries(score.dimensions).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex items-center gap-0.5 mb-0.5 text-white/30">
                          {DIMENSION_LABELS[key]?.icon}
                          <span>{DIMENSION_LABELS[key]?.label}</span>
                        </div>
                        <div className="h-1 bg-white/[0.06] rounded overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className="h-full rounded"
                            style={{ backgroundColor: DIMENSION_LABELS[key]?.color }}
                          />
                        </div>
                        <span className="font-mono text-white/40 mt-0.5 block">{val}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
