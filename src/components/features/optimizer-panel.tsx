'use client'

import React, { useState, useEffect } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Calculator, MapPin, Ship, TrendingDown, Trophy, DollarSign } from 'lucide-react'
import { DisparityRow, OptimizerResponse, fetchAPI, formatPrice, REGION_COLORS } from '@/lib/fashion-types'

export function OptimizerPanel() {
  const [products, setProducts] = useState<DisparityRow[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedRegion, setSelectedRegion] = useState<string>('India')
  const [result, setResult] = useState<OptimizerResponse | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchAPI('/api/disparity/matrix').then((d: DisparityRow[]) => {
      if (cancelled) return
      setProducts(d)
      if (d.length > 0) setSelectedProductId(d[0].productId)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!selectedProductId || !selectedRegion) return
    let cancelled = false
    fetchAPI(`/api/optimizer/landed-cost?productId=${selectedProductId}&targetRegion=${selectedRegion}`)
      .then((r: OptimizerResponse) => { if (!cancelled) { setResult(r); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [selectedProductId, selectedRegion])

  return (
    <div className="space-y-4">
      <Card className="border-white/[0.06] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
            <Calculator className="h-4 w-4" /> Personal Shopper — Landed Cost Optimizer
          </CardTitle>
          <CardDescription className="text-white/30">Select a product and your region — we&apos;ll find the cheapest way to acquire it (local purchase vs. import route)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-white/60 mb-1 block">Product</label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white/70"><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.productId} value={p.productId}>
                      {p.brand} — {p.productName.slice(0, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wide text-white/60 mb-1 block">Your Region (Target)</label>
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="bg-white/[0.04] border-white/10 text-white/70"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['EU', 'US', 'UK', 'Norway', 'India'].map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="py-8 text-center text-sm text-white/30">Calculating optimal route…</div>}

      {result && !loading && (
        <>
          {/* Best route highlight */}
          <Card className="border-emerald-500/[0.15] shadow-none bg-gradient-to-br from-emerald-500/[0.08] to-emerald-600/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-400">Optimal Purchase Route</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] text-white/30 uppercase">Product</p>
                  <p className="text-sm font-bold text-white/90">{result.product.name}</p>
                  <p className="text-[10px] text-white/30">{result.product.brand} · {result.product.category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase">Best Source</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs" style={{
                      backgroundColor: REGION_COLORS[result.bestRoute.sourceRegion] + '20',
                      color: REGION_COLORS[result.bestRoute.sourceRegion],
                      borderColor: REGION_COLORS[result.bestRoute.sourceRegion] + '40',
                    }}>
                      {result.bestRoute.sourceRegion}
                    </Badge>
                    <Ship className="h-3.5 w-3.5 text-white/30" />
                    <Badge variant="outline" className="text-xs" style={{
                      backgroundColor: REGION_COLORS[result.targetRegion] + '20',
                      color: REGION_COLORS[result.targetRegion],
                      borderColor: REGION_COLORS[result.targetRegion] + '40',
                    }}>
                      {result.targetRegion}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">Stock at source: {result.bestRoute.stockLevelAtSource}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-white/30 uppercase">Total Landed Cost</p>
                  <p className="text-2xl font-bold text-emerald-400">€{result.bestRoute.totalLandedCostEUR.toLocaleString()}</p>
                  {result.potentialSavingsEUR > 0 && (
                    <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      Saves €{result.potentialSavingsEUR.toLocaleString()} vs. local
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost breakdown */}
          <Card className="border-white/[0.06] shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-white/90">All Purchase Routes Compared</CardTitle>
              <CardDescription className="text-white/30">Ranked cheapest to most expensive — includes shipping, duties, and taxes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.allRoutes.map((route, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-3 ${
                      idx === 0 ? 'border-emerald-500/[0.15] bg-emerald-500/[0.04]' :
                      route.isLocalPurchase ? 'border-sky-500/[0.15] bg-sky-500/[0.04]' :
                      'border-white/[0.06] bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs" style={{
                          backgroundColor: REGION_COLORS[route.sourceRegion] + '20',
                          color: REGION_COLORS[route.sourceRegion],
                          borderColor: REGION_COLORS[route.sourceRegion] + '40',
                        }}>
                          <MapPin className="h-3 w-3 mr-1" /> {route.sourceRegion}
                        </Badge>
                        {idx === 0 && <Badge className="text-[9px] bg-emerald-500/[0.1] text-emerald-400">BEST</Badge>}
                        {route.isLocalPurchase && <Badge className="text-[9px] bg-sky-500/[0.1] text-sky-400">LOCAL</Badge>}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white/90">€{route.totalLandedCostEUR.toLocaleString()}</p>
                        {route.savingsVsLocalEUR < 0 && (
                          <p className="text-[10px] text-red-400">+€{Math.abs(route.savingsVsLocalEUR)} vs local</p>
                        )}
                        {route.savingsVsLocalEUR > 0 && (
                          <p className="text-[10px] text-emerald-400">−€{route.savingsVsLocalEUR} vs local ({route.savingsVsLocalPct}%)</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                      <div>
                        <span className="text-white/30">Retail: </span>
                        <span className="font-mono text-white/60">{formatPrice(route.sourcePrice, route.sourceCurrency)} (€{route.sourcePriceEUR})</span>
                      </div>
                      <div>
                        <span className="text-white/30">Shipping: </span>
                        <span className="font-mono text-white/60">€{route.shippingCostEUR}</span>
                      </div>
                      <div>
                        <span className="text-white/30">Duty ({(route.importDutyRate * 100).toFixed(1)}%): </span>
                        <span className="font-mono text-white/60">€{route.importDutyAmountEUR}</span>
                      </div>
                      <div>
                        <span className="text-white/30">Stock: </span>
                        <span className={`font-mono ${route.stockLevelAtSource < 25 ? 'text-red-400' : route.stockLevelAtSource < 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {route.stockLevelAtSource}% ({route.stockStatusAtSource})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
