'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Users, Crown, ShieldCheck, Clock, Percent, Star, Eye, Heart } from 'lucide-react'
import { VIPResponse, VIPSimulation, VIPSavingsExample, fetchAPI, BRAND_COLORS, formatPrice } from '@/lib/fashion-types'

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const TIER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Silver':   { bg: 'from-slate-400/[0.08]', text: 'text-slate-300', border: 'border-slate-400/20' },
  'Gold':     { bg: 'from-amber-400/[0.08]', text: 'text-amber-300', border: 'border-amber-400/20' },
  'Platinum': { bg: 'from-cyan-400/[0.08]',  text: 'text-cyan-300',  border: 'border-cyan-400/20' },
  'Diamond':  { bg: 'from-violet-400/[0.08]',text: 'text-violet-300',border: 'border-violet-400/20' },
}

export function VIPPanel() {
  const [data, setData] = useState<VIPResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [spendEUR, setSpendEUR] = useState(50000)

  useEffect(() => {
    fetchAPI(`/api/vip/simulate?spendEUR=${spendEUR}`).then((d: VIPResponse) => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [spendEUR])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Simulating VIP tiers...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-400">Failed to load</div>

  return (
    <div className="space-y-4">
      {/* Spend slider */}
      <Card className="border-white/[0.06] bg-gradient-to-br from-amber-500/[0.06] to-amber-600/[0.02] shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Annual Spend Simulator</span>
            </div>
            <p className="text-lg font-bold text-amber-400">&euro;{spendEUR.toLocaleString()}</p>
          </div>
          <input
            type="range"
            min={0}
            max={300000}
            step={5000}
            value={spendEUR}
            onChange={(e) => setSpendEUR(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[9px] text-white/25 mt-1">
            <span>&euro;0</span><span>&euro;75k</span><span>&euro;150k</span><span>&euro;225k</span><span>&euro;300k</span>
          </div>
        </CardContent>
      </Card>

      {/* Brand tier cards */}
      <div className="grid gap-3 lg:grid-cols-2">
        {data.simulations.map((sim: VIPSimulation, idx: number) => (
          <motion.div
            key={sim.brand}
            variants={staggerItem}
            initial="hidden"
            animate="visible"
            custom={idx}
            whileHover={{ scale: 1.01 }}
          >
            <Card className="border-white/[0.06] bg-white/[0.02] shadow-none overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-white/90" style={{ color: BRAND_COLORS[sim.brand] }}>
                    {sim.brand}
                  </CardTitle>
                  {sim.qualifiedTier ? (
                    <Badge className={`text-[10px] ${TIER_COLORS[sim.qualifiedTier.tierName]?.text || 'text-white/60'} bg-white/[0.06] border ${TIER_COLORS[sim.qualifiedTier.tierName]?.border || 'border-white/10'}`}>
                      {sim.qualifiedTier.tierName}
                    </Badge>
                  ) : (
                    <Badge className="text-[10px] text-white/30 bg-white/[0.04]">Below threshold</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {sim.qualifiedTier && (
                  <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Percent className="h-3 w-3 text-amber-400" />
                      <span>{sim.qualifiedTier.discountPct}% discount</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      <span>{sim.qualifiedTier.earlyAccessDays}d early access</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Eye className="h-3 w-3 text-violet-400" />
                      <span>{sim.qualifiedTier.privateViewing ? 'Private viewings' : 'No private viewings'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Heart className="h-3 w-3 text-rose-400" />
                      <span>{sim.qualifiedTier.personalShopper ? 'Personal shopper' : 'No personal shopper'}</span>
                    </div>
                  </div>
                )}
                {/* Tier progress bar */}
                <div className="space-y-1">
                  {sim.allTiers.map((tier) => (
                    <div key={tier.tierName} className="flex items-center gap-2">
                      <span className={`text-[9px] w-16 font-medium ${tier.achievable ? TIER_COLORS[tier.tierName]?.text || 'text-white/60' : 'text-white/20'}`}>
                        {tier.tierName}
                      </span>
                      <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${tier.achievable ? 100 : Math.min(100, (spendEUR / tier.minAnnualSpendEUR) * 100)}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          className={`h-full rounded-full ${tier.achievable ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-white/10'}`}
                        />
                      </div>
                      <span className="text-[9px] text-white/25 font-mono">&euro;{(tier.minAnnualSpendEUR / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
                {sim.nextTier && (
                  <p className="text-[10px] text-amber-400/60 mt-2">
                    Spend &euro;{sim.nextTier.gapEUR.toLocaleString()} more to reach {sim.nextTier.tierName}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Savings examples */}
      <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> VIP Pricing at Your Tier
          </CardTitle>
          <CardDescription className="text-white/30">Sample savings across products with your qualified discount</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {data.savingsExamples.map((ex: VIPSavingsExample, idx: number) => (
              <motion.div
                key={idx}
                variants={staggerItem}
                initial="hidden"
                animate="visible"
                custom={idx}
                className="rounded-lg border border-white/[0.06] p-3 bg-white/[0.02]"
              >
                <p className="text-[11px] font-semibold text-white/80 truncate">{ex.product}</p>
                <p className="text-[9px] text-white/30 mb-2">{ex.brand}</p>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-white/30">Retail</span>
                    <span className="text-white/50 line-through">&euro;{ex.retailPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">VIP Price</span>
                    <span className="text-white/90 font-bold">&euro;{ex.vipPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Savings</span>
                    <span className="text-emerald-400 font-bold">-&euro;{ex.savingsEUR.toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
