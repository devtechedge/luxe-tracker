'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TrendingDown, ArrowRight, Ship, PiggyBank, Trophy } from 'lucide-react'
import { ArbitrageOpportunity, ArbitrageResponse, fetchAPI, formatPrice, REGION_COLORS } from '@/lib/fashion-types'

export function ArbitragePanel() {
  const [data, setData] = useState<ArbitrageResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAPI('/api/arbitrage/opportunities').then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-8 text-center text-sm text-white/30">Scanning arbitrage routes…</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">Failed to load</div>

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-white/[0.06] bg-gradient-to-br from-emerald-500/[0.08] to-emerald-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-400">Active Routes</span>
            </div>
            <p className="text-2xl font-bold text-emerald-300">{data.totalOpportunities}</p>
            <p className="text-[10px] text-emerald-500/70">profitable buy-ship combos</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06] bg-gradient-to-br from-amber-500/[0.08] to-amber-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Avg Savings</span>
            </div>
            <p className="text-2xl font-bold text-amber-300">{data.avgSavingsPct}%</p>
            <p className="text-[10px] text-amber-500/70">vs. local retail</p>
          </CardContent>
        </Card>
        <Card className="border-white/[0.06] bg-gradient-to-br from-violet-500/[0.08] to-violet-600/[0.02]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-violet-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-400">Best Route</span>
            </div>
            <p className="text-sm font-bold text-violet-300">
              {data.topOpportunities[0] ? `${data.topOpportunities[0].savingsPct}%` : '—'}
            </p>
            <p className="text-[10px] text-violet-500/70 truncate">
              {data.topOpportunities[0]?.productName.slice(0, 28) || 'no data'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Ship className="h-4 w-4" /> Top Arbitrage Opportunities
          </CardTitle>
          <CardDescription className="text-white/30">Buy in cheaper region, ship to expensive region — net of duties, taxes, and shipping</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.04]">
                  <TableHead className="text-[11px]">Product</TableHead>
                  <TableHead className="text-[11px]">Brand</TableHead>
                  <TableHead className="text-[11px]">Route</TableHead>
                  <TableHead className="text-[11px] text-right">Buy @</TableHead>
                  <TableHead className="text-[11px] text-right">Landed</TableHead>
                  <TableHead className="text-[11px] text-right">Local</TableHead>
                  <TableHead className="text-[11px] text-right">Savings</TableHead>
                  <TableHead className="text-[11px]">Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.topOpportunities.map((o: ArbitrageOpportunity, i) => (
                  <TableRow key={i} className="hover:bg-white/[0.03] border-white/[0.04]">
                    <TableCell>
                      <p className="text-xs font-medium text-white/90 truncate max-w-[160px]">{o.productName}</p>
                      <p className="text-[10px] text-white/30">{o.sku}</p>
                    </TableCell>
                    <TableCell><span className="text-xs text-white/60">{o.brand}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]" style={{ backgroundColor: REGION_COLORS[o.buyFromRegion] + '20', color: REGION_COLORS[o.buyFromRegion], borderColor: REGION_COLORS[o.buyFromRegion] + '40' }}>
                          {o.buyFromRegion}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-white/30" />
                        <Badge variant="outline" className="text-[10px]" style={{ backgroundColor: REGION_COLORS[o.shipToRegion] + '20', color: REGION_COLORS[o.shipToRegion], borderColor: REGION_COLORS[o.shipToRegion] + '40' }}>
                          {o.shipToRegion}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-xs font-medium text-white/60">{formatPrice(o.buyAtPrice, o.buyCurrency)}</p>
                      <p className="text-[10px] text-white/30">€{o.buyPriceEUR}</p>
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium text-white/60">€{o.totalLandedCostEUR}</TableCell>
                    <TableCell className="text-right">
                      <p className="text-xs text-white/30 line-through">{formatPrice(o.localPriceAtTarget, o.localCurrency)}</p>
                      <p className="text-[10px] text-white/30">€{o.localPriceEUR}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-emerald-400">+{o.savingsPct}%</span>
                        <span className="text-[10px] text-emerald-500/70">€{o.savingsEUR}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${o.stockLevelAtSource > 60 ? 'bg-emerald-500/[0.1] text-emerald-400 border-emerald-500/[0.15]' : o.stockLevelAtSource > 30 ? 'bg-amber-500/[0.1] text-amber-400 border-amber-500/[0.15]' : 'bg-red-500/[0.1] text-red-400 border-red-500/[0.15]'}`}>
                        {o.stockLevelAtSource}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
