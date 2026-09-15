// ============================================================
// ANALYTICS - all calculation logic (ported from /api/analytics)
// ============================================================
// These functions replace the server-side endpoints in the
// original Next.js API route. They run synchronously against
// the in-memory snapshot - instant, no network, no DB.
//
// All function signatures match the original endpoints 1:1
// so swapping back to a real backend later is mechanical.
// ============================================================

import {
  getSnapshot,
  round2,
  toEUR,
} from './data-snapshot'
import type {
  Telemetry,
  RegionalBreakdown,
  DisparityRow,
  Brand,
  ArbitrageResponse,
  HypeResponse,
  VolatilityResponse,
  CompetitiveResponse,
  ConflictResponse,
  StockRiskResponse,
  OptimizerResponse,
  HistoryResponse,
  PulseResponse,
  RunwayResponse,
  VIPSimulation,
} from './fashion-types'

// ============================================================
// HELPERS
// ============================================================

function computeDisparity(prices: any[]) {
  const euPrice = prices.find((p: any) => p.region === 'EU')
  if (!euPrice) return null
  const euConverted = euPrice.price
  const results = prices.map((p: any) => {
    const localInEUR = p.price * (toEUR(1, p.currency))
    const disparityPct = ((localInEUR - euConverted) / euConverted) * 100
    const importDutyImpact = localInEUR * p.importDuty
    const taxImpact = localInEUR * p.taxRate
    const totalLandedCost = localInEUR + importDutyImpact + taxImpact
    return {
      region: p.region,
      currency: p.currency,
      price: p.price,
      priceInEUR: round2(localInEUR),
      disparityPct: round2(disparityPct),
      importDuty: p.importDuty,
      importDutyImpact: round2(importDutyImpact),
      taxRate: p.taxRate,
      taxImpact: round2(taxImpact),
      totalLandedCost: round2(totalLandedCost),
      shippingCost: p.shippingCost || 0,
      stockStatus: p.stockStatus,
      stockLevel: p.stockLevel || 50,
    }
  })
  const maxDisparity = results.reduce(
    (max, r) => (Math.abs(r.disparityPct) > Math.abs(max.disparityPct) ? r : max),
    results[0],
  )
  const avgDisparity =
    results.reduce((s, r) => s + r.disparityPct, 0) / results.length
  return { regionalBreakdown: results, maxDisparity, avgDisparity: round2(avgDisparity) }
}

// ============================================================
// TELEMETRY (overview KPIs + region/brand summary)
// ============================================================

export function getTelemetry(): Telemetry {
  const snap = getSnapshot()
  const allDisparities: number[] = []
  const regionSums: Record<string, { sum: number; n: number }> = {}
  const brandSums: Record<string, { sum: number; n: number }> = {}
  let highDuty = 0
  let limitedStock = 0
  let hypeSum = 0

  for (const p of snap.products) {
    const d = computeDisparity(p.regionalPrices)
    if (!d) continue
    for (const r of d.regionalBreakdown) {
      allDisparities.push(r.disparityPct)
      regionSums[r.region] = regionSums[r.region] || { sum: 0, n: 0 }
      regionSums[r.region].sum += r.disparityPct
      regionSums[r.region].n += 1
      if (r.importDuty > 0.1) highDuty++
      if (r.stockLevel < 30) limitedStock++
    }
    const brandName = snap.brandDefs[parseInt(p.brandId.split('_')[1])].name
    brandSums[brandName] = brandSums[brandName] || { sum: 0, n: 0 }
    brandSums[brandName].sum += d.avgDisparity
    brandSums[brandName].n += 1
    hypeSum += p.hypeScore
  }

  const avgDisparity =
    allDisparities.length > 0
      ? round2(allDisparities.reduce((s, v) => s + v, 0) / allDisparities.length)
      : 0
  const maxDisparity = allDisparities.length > 0 ? round2(Math.max(...allDisparities.map(Math.abs))) : 0

  return {
    overview: {
      totalProducts: snap.products.length,
      totalBrands: snap.brands.length,
      totalLaunches: snap.launches.length,
      avgDisparityOverall: avgDisparity,
      maxDisparityOverall: maxDisparity,
      highDutyProducts: highDuty,
      limitedStockCount: limitedStock,
      avgHypeScore: snap.products.length > 0 ? Math.round(hypeSum / snap.products.length) : 0,
    },
    currencyRates: snap.currencyData.map((c) => ({ pair: c.pair, rate: c.currentRate })),
    regionSummary: Object.entries(regionSums).map(([region, v]) => ({
      region,
      avgDisparityPct: round2(v.sum / v.n),
    })),
    brandSummary: Object.entries(brandSums).map(([brand, v]) => ({
      brand,
      avgDisparityPct: round2(v.sum / v.n),
    })),
  }
}

// ============================================================
// BRANDS + PRODUCTS (the master lists)
// ============================================================

export function getBrands(): Brand[] {
  return getSnapshot().brands
}

export function getProducts() {
  const snap = getSnapshot()
  return snap.products
    .map((p) => {
      const d = computeDisparity(p.regionalPrices)
      const brandName = snap.brandDefs[parseInt(p.brandId.split('_')[1])].name
      return {
        ...p,
        brand: { id: p.brandId, name: brandName, country: snap.brandDefs[parseInt(p.brandId.split('_')[1])].country },
        disparity: d,
        hypeScore: p.hypeScore,
      }
    })
    .sort((a, b) => {
      const aMax = Math.abs(a.disparity?.maxDisparity?.disparityPct || 0)
      const bMax = Math.abs(b.disparity?.maxDisparity?.disparityPct || 0)
      return bMax - aMax
    })
}

export function getProductById(id: string) {
  const snap = getSnapshot()
  const p = snap.products.find((x) => x.id === id)
  if (!p) return null
  const brandIdx = parseInt(p.brandId.split('_')[1])
  const d = computeDisparity(p.regionalPrices)
  return {
    ...p,
    brand: { id: p.brandId, name: snap.brandDefs[brandIdx].name, country: snap.brandDefs[brandIdx].country },
    disparity: d,
    hypeScore: p.hypeScore,
    hypeBreakdown: p.hypeBreakdown,
    launches: snap.launches.filter((l) => l.productId === p.id),
  }
}

// ============================================================
// LAUNCHES
// ============================================================

export function getLaunches(filters: { brand?: string; region?: string; status?: string } = {}) {
  const snap = getSnapshot()
  return snap.launches
    .filter((l) => !filters.brand || l.brand.name === filters.brand)
    .filter((l) => !filters.region || l.region === filters.region)
    .filter((l) => !filters.status || l.status === filters.status)
}

export function getLaunchesCalendar() {
  const snap = getSnapshot()
  const calendar: Record<string, any[]> = {}
  for (const l of snap.launches) {
    const key = l.launchDate.slice(0, 7)
    ;(calendar[key] = calendar[key] || []).push(l)
  }
  return calendar
}

// ============================================================
// FEATURE 1: ARBITRAGE
// ============================================================

export function getArbitrage(): ArbitrageResponse {
  const snap = getSnapshot()
  const opportunities: any[] = []
  for (const p of snap.products) {
    const brandName = snap.brandDefs[parseInt(p.brandId.split('_')[1])].name
    for (const target of p.regionalPrices) {
      for (const source of p.regionalPrices) {
        if (source.region === target.region) continue
        if ((source.stockLevel || 50) < 20) continue
        const sourcePriceEUR = toEUR(source.price, source.currency)
        const shipping = source.shippingCost || 50
        const dutyApplied = sourcePriceEUR * target.importDuty
        const totalCostEUR = sourcePriceEUR + shipping + dutyApplied
        const targetLocalPriceEUR = toEUR(target.price, target.currency)
        const savingsEUR = targetLocalPriceEUR - totalCostEUR
        const savingsPct = round2((savingsEUR / targetLocalPriceEUR) * 100)
        if (savingsEUR > 20) {
          opportunities.push({
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            brand: brandName,
            category: p.category,
            buyFromRegion: source.region,
            buyAtPrice: source.price,
            buyCurrency: source.currency,
            buyPriceEUR: round2(sourcePriceEUR),
            shipToRegion: target.region,
            localPriceAtTarget: target.price,
            localCurrency: target.currency,
            localPriceEUR: round2(targetLocalPriceEUR),
            shippingCostEUR: shipping,
            importDutyApplied: target.importDuty,
            dutyImpactEUR: round2(dutyApplied),
            totalLandedCostEUR: round2(totalCostEUR),
            savingsEUR: round2(savingsEUR),
            savingsPct,
            stockLevelAtSource: source.stockLevel || 50,
          })
        }
      }
    }
  }
  opportunities.sort((a, b) => b.savingsPct - a.savingsPct)
  return {
    totalOpportunities: opportunities.length,
    avgSavingsPct:
      opportunities.length > 0
        ? round2(opportunities.reduce((s, o) => s + o.savingsPct, 0) / opportunities.length)
        : 0,
    topOpportunities: opportunities.slice(0, 30),
  }
}

// ============================================================
// FEATURE 2: HYPE PREDICTOR
// ============================================================

export function getHype(): HypeResponse {
  const snap = getSnapshot()
  const now = Date.now()
  const enriched = snap.products.map((p) => {
    const launch = snap.launches.find((l) => l.productId === p.id && new Date(l.launchDate).getTime() > now)
    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      brand: snap.brandDefs[parseInt(p.brandId.split('_')[1])].name,
      category: p.category,
      season: p.season,
      editionType: p.editionType,
      resaleValueIdx: p.resaleValueIdx,
      hypeScore: p.hypeScore,
      hypeBreakdown: p.hypeBreakdown,
      daysToLaunch: launch ? Math.ceil((new Date(launch.launchDate).getTime() - now) / 86400000) : null,
      launchRegion: launch?.region ?? null,
      launchType: launch?.launchType ?? null,
      expectedUnits: launch?.expectedUnits ?? 0,
    }
  })
  enriched.sort((a, b) => b.hypeScore - a.hypeScore)
  return {
    totalProducts: enriched.length,
    avgHypeScore: enriched.length > 0 ? Math.round(enriched.reduce((s, p) => s + p.hypeScore, 0) / enriched.length) : 0,
    topHyped: enriched.slice(0, 20),
    allProducts: enriched,
  }
}

// ============================================================
// FEATURE 3: FX VOLATILITY
// ============================================================

export function getVolatility(): VolatilityResponse {
  const snap = getSnapshot()
  const pairs = snap.currencyData.map((c) => ({
    pair: c.pair,
    currentRate: c.currentRate,
    mean: c.mean,
    min: c.min,
    max: c.max,
    volatilityPct: c.volatilityPct,
    rangePct: c.rangePct,
    change90dPct: c.change90dPct,
    riskScore: c.riskScore,
    riskLevel: c.riskLevel,
    series: c.series,
  }))
  const overallRisk =
    pairs.length > 0 ? Math.round(pairs.reduce((s, p) => s + p.riskScore, 0) / pairs.length) : 0
  return { pairs, overallRisk }
}

// ============================================================
// FEATURE 4: COMPETITIVE MATRIX
// ============================================================

export function getCompetitiveMatrix(): CompetitiveResponse {
  const snap = getSnapshot()
  const categories = ['Handbags', 'Footwear', 'Ready-to-Wear', 'Jewelry', 'Accessories']
  const cats = categories.map((cat) => {
    const productsInCat = snap.products.filter((p) => p.category === cat)
    const brandPrices: Record<string, { sum: number; n: number }> = {}
    for (const p of productsInCat) {
      const eu = p.regionalPrices.find((r: any) => r.region === 'EU')
      if (!eu) continue
      const euPriceInEUR = eu.price
      const brandName = snap.brandDefs[parseInt(p.brandId.split('_')[1])].name
      brandPrices[brandName] = brandPrices[brandName] || { sum: 0, n: 0 }
      brandPrices[brandName].sum += euPriceInEUR
      brandPrices[brandName].n += 1
    }
    const brands = Object.entries(brandPrices).map(([brand, v]) => ({
      brand,
      avgPriceEUR: round2(v.sum / v.n),
      productCount: v.n,
    }))
    brands.sort((a, b) => a.avgPriceEUR - b.avgPriceEUR)
    const valueLeader = brands[0]?.brand || 'N/A'
    const premiumLeader = brands[brands.length - 1]?.brand || 'N/A'
    const priceSpreadEUR = brands.length > 0 ? round2(brands[brands.length - 1].avgPriceEUR - brands[0].avgPriceEUR) : 0
    const priceSpreadPct = brands.length > 0 && brands[0].avgPriceEUR > 0 ? round2((priceSpreadEUR / brands[0].avgPriceEUR) * 100) : 0
    return {
      category: cat,
      totalProducts: productsInCat.length,
      brands,
      valueLeader,
      premiumLeader,
      priceSpreadEUR,
      priceSpreadPct,
    }
  })
  return { categories: cats }
}

// ============================================================
// FEATURE 5: LAUNCH CONFLICTS
// ============================================================

export function getConflicts(): ConflictResponse {
  const snap = getSnapshot()
  // Group launches by date
  const byDate: Record<string, any[]> = {}
  for (const l of snap.launches) {
    const date = l.launchDate.slice(0, 10)
    ;(byDate[date] = byDate[date] || []).push(l)
  }
  const conflictDays = Object.entries(byDate)
    .filter(([, events]) => events.length > 1)
    .map(([date, events]) => ({
      date,
      eventCount: events.length,
      brands: Array.from(new Set(events.map((e) => e.brand.name))),
      cannibalizationRisk: events.length > 4 ? 'high' : events.length > 2 ? 'medium' : 'low',
      events: events.map((e) => ({
        productName: e.product.name,
        brand: e.brand.name,
        region: e.region,
        launchType: e.launchType,
        status: e.status,
      })),
    }))
    .sort((a, b) => b.eventCount - a.eventCount)

  // Weekly density
  const weekly: Record<string, any[]> = {}
  for (const l of snap.launches) {
    const d = new Date(l.launchDate)
    const day = d.getDay()
    const diff = d.getDate() - day
    const weekStart = new Date(d.setDate(diff))
    const key = weekStart.toISOString().slice(0, 10)
    ;(weekly[key] = weekly[key] || []).push(l)
  }
  const weeklyDensity = Object.entries(weekly)
    .map(([weekStart, events]) => ({
      weekStart,
      totalLaunches: events.length,
      brandCount: new Set(events.map((e) => e.brand.name)).size,
      brands: Array.from(new Set(events.map((e) => e.brand.name))),
      densityScore: events.length * new Set(events.map((e) => e.brand.name)).size,
    }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-12)

  return {
    conflictDays: conflictDays.slice(0, 20),
    weeklyDensity,
    totalConflicts: conflictDays.length,
  }
}

// ============================================================
// FEATURE 6: STOCK RISK
// ============================================================

export function getStockRisk(): StockRiskResponse {
  const snap = getSnapshot()
  const risks: any[] = []
  for (const p of snap.products) {
    for (const rp of p.regionalPrices) {
      // Risk = inverse stock + hype weighting + duty adjustment
      const stockFactor = (100 - rp.stockLevel) / 100
      const hypeFactor = p.hypeScore / 100
      const riskScore = Math.round((stockFactor * 0.6 + hypeFactor * 0.4) * 100)
      const riskLevel = riskScore > 75 ? 'critical' : riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low'
      const estimatedDaysToStockout = Math.max(
        0,
        Math.round((rp.stockLevel / Math.max(1, p.hypeScore)) * 2),
      )
      const restockUrgency =
        riskScore > 75 ? 'immediate' : riskScore > 50 ? 'within-week' : riskScore > 25 ? 'within-month' : 'routine'
      risks.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        brand: snap.brandDefs[parseInt(p.brandId.split('_')[1])].name,
        category: p.category,
        region: rp.region,
        currency: rp.currency,
        price: rp.price,
        stockLevel: rp.stockLevel,
        stockStatus: rp.stockStatus,
        hypeScore: p.hypeScore,
        riskScore,
        riskLevel,
        estimatedDaysToStockout,
        restockUrgency,
      })
    }
  }
  risks.sort((a, b) => b.riskScore - a.riskScore)
  return {
    totalEntries: risks.length,
    criticalCount: risks.filter((r) => r.riskLevel === 'critical').length,
    highCount: risks.filter((r) => r.riskLevel === 'high').length,
    topRisks: risks.slice(0, 30),
    allRisks: risks,
  }
}

// ============================================================
// FEATURE 7: LANDED COST OPTIMIZER
// ============================================================

export function getOptimizer(productId: string, targetRegion: string): OptimizerResponse | null {
  const snap = getSnapshot()
  const product = snap.products.find((p) => p.id === productId)
  if (!product) return null
  const targetPrice = product.regionalPrices.find((r: any) => r.region === targetRegion)
  if (!targetPrice) return null
  const localPriceEUR = toEUR(targetPrice.price, targetPrice.currency)
  const allRoutes = product.regionalPrices.map((source: any) => {
    const sourcePriceEUR = toEUR(source.price, source.currency)
    const shipping = source.shippingCost || 50
    const importDutyRate = source.region === targetRegion ? 0 : targetPrice.importDuty
    const importDutyAmount = sourcePriceEUR * importDutyRate
    const totalLandedCost = sourcePriceEUR + shipping + importDutyAmount
    const savingsVsLocal = localPriceEUR - totalLandedCost
    const savingsVsLocalPct = round2((savingsVsLocal / localPriceEUR) * 100)
    return {
      sourceRegion: source.region,
      sourceCurrency: source.currency,
      sourcePrice: source.price,
      sourcePriceEUR: round2(sourcePriceEUR),
      shippingCostEUR: shipping,
      importDutyRate,
      importDutyAmountEUR: round2(importDutyAmount),
      totalLandedCostEUR: round2(totalLandedCost),
      stockLevelAtSource: source.stockLevel || 50,
      stockStatusAtSource: source.stockStatus,
      savingsVsLocalEUR: round2(savingsVsLocal),
      savingsVsLocalPct,
      isLocalPurchase: source.region === targetRegion,
    }
  })
  allRoutes.sort((a, b) => a.totalLandedCostEUR - b.totalLandedCostEUR)
  const bestRoute = allRoutes[0]
  const potentialSavings = round2(localPriceEUR - bestRoute.totalLandedCostEUR)
  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      brand: snap.brandDefs[parseInt(product.brandId.split('_')[1])].name,
      category: product.category,
    },
    targetRegion,
    localPriceEUR: round2(localPriceEUR),
    bestRoute,
    allRoutes,
    potentialSavingsEUR: potentialSavings,
  }
}

// ============================================================
// FEATURE 8: PRICE HISTORY
// ============================================================

export function getPriceHistory(): HistoryResponse {
  const snap = getSnapshot()
  // Aggregate by (productId, region) → compute 90d change + anomaly count
  // Key format: `${productId}_${region}` where productId is e.g. 'prod_0' (contains an underscore!)
  // We use lastIndexOf to find the separator between productId and region,
  // because splitting on '_' would chop 'prod_0' into 'prod' and '0'.
  const byProductRegion: Record<string, any[]> = {}
  let totalAnomalies = 0
  for (const ph of snap.products.flatMap((p) => p.priceHistory)) {
    const key = `${ph.productId}_${ph.region}`
    ;(byProductRegion[key] = byProductRegion[key] || []).push(ph)
    if (ph.anomalyFlag) totalAnomalies++
  }
  const movers = Object.entries(byProductRegion).map(([key, series]) => {
    const lastSep = key.lastIndexOf('_')
    const productId = key.slice(0, lastSep)
    const region = key.slice(lastSep + 1)
    series.sort((a, b) => a.date.localeCompare(b.date))
    const product = snap.products.find((p) => p.id === productId)
    if (!product) return null
    return {
      productId,
      productName: product.name,
      brand: snap.brandDefs[parseInt(product.brandId.split('_')[1])].name,
      region,
      currency: series[0].currency,
      startPrice: series[0].price,
      endPrice: series[series.length - 1].price,
      change90dPct: round2(((series[series.length - 1].price - series[0].price) / series[0].price) * 100),
      anomalyCount: series.filter((s) => s.anomalyFlag).length,
    }
  }).filter((m): m is NonNullable<typeof m> => m !== null)
  movers.sort((a, b) => Math.abs(b.change90dPct) - Math.abs(a.change90dPct))
  return {
    topMovers: movers.slice(0, 30),
    totalAnomalies,
    totalSeries: movers.length,
  }
}

// ============================================================
// FEATURE 9: BRAND PULSE
// ============================================================

export function getBrandPulse(): PulseResponse {
  const snap = getSnapshot()
  const brands = snap.brandDefs.map((b, i) => {
    const brandId = `brand_${i}`
    const products = snap.products.filter((p) => p.brandId === brandId)
    const upcoming = snap.launches.filter(
      (l) => l.brandId === brandId && new Date(l.launchDate).getTime() > Date.now(),
    ).length
    const avgHype =
      products.length > 0 ? Math.round(products.reduce((s, p) => s + p.hypeScore, 0) / products.length) : 0
    const avgDisparityForBrand =
      products.length > 0
        ? round2(
            products.reduce((s, p) => {
              const d = computeDisparity(p.regionalPrices)
              return s + (d?.avgDisparity || 0)
            }, 0) / products.length,
          )
        : 0
    // 5-dimension scoring
    const prestige = b.tierScore
    const pricingPower = Math.min(100, Math.round(avgDisparityForBrand * 8 + 30))
    const hypeIndex = avgHype
    const launchVelocity = Math.min(100, upcoming * 8)
    const avgStock = products.length > 0
      ? Math.round(products.reduce((s, p) => {
          const eu = p.regionalPrices.find((r: any) => r.region === 'EU')
          return s + (eu?.stockLevel || 50)
        }, 0) / products.length)
      : 50
    const stockHealth = avgStock
    const overallScore = Math.round(
      (prestige * 0.3 + pricingPower * 0.2 + hypeIndex * 0.25 + launchVelocity * 0.15 + stockHealth * 0.1),
    )
    return {
      brandId,
      brand: b.name,
      logo: b.logo,
      country: b.country,
      dimensions: { prestige, pricingPower, hypeIndex, launchVelocity, stockHealth },
      overallScore,
      productCount: products.length,
      upcomingLaunches: upcoming,
      avgHypeScore: avgHype,
    }
  })
  brands.sort((a, b) => b.overallScore - a.overallScore)
  return { brands }
}

// ============================================================
// FEATURE 11: RUNWAY SHOWS
// ============================================================

export function getRunway(): RunwayResponse {
  const snap = getSnapshot()
  const shows = snap.runwayShows
  const byCity: Record<string, number> = {}
  const bySeason: Record<string, number> = {}
  for (const s of shows) {
    byCity[s.city] = (byCity[s.city] || 0) + 1
    bySeason[s.season] = (bySeason[s.season] || 0) + 1
  }
  return {
    totalShows: shows.length,
    shows,
    byCity,
    bySeason,
    cities: Object.keys(byCity),
  }
}

// ============================================================
// FEATURE 12: VIP TIER SIMULATOR
// ============================================================

export function getVIPSimulation(brandIdx: number, annualSpendEUR: number): VIPSimulation {
  const snap = getSnapshot()
  const b = snap.brandDefs[brandIdx]
  const brandId = `brand_${brandIdx}`
  const tiers = snap.vipTierDefs.map((t) => ({
    ...t,
    achievable: annualSpendEUR >= t.minAnnualSpendEUR,
  }))
  const qualified = tiers.filter((t) => t.achievable).pop()
  const nextTier = tiers.find((t) => !t.achievable)
  return {
    brand: b.name,
    brandId,
    qualifiedTier: qualified
      ? {
          tierName: qualified.tierName,
          discountPct: qualified.discountPct,
          earlyAccessDays: qualified.earlyAccessDays,
          allocationPriority: qualified.allocationPriority,
          privateViewing: qualified.privateViewing,
          personalShopper: qualified.personalShopper,
        }
      : null,
    nextTier: nextTier
      ? {
          tierName: nextTier.tierName,
          minAnnualSpendEUR: nextTier.minAnnualSpendEUR,
          gapEUR: nextTier.minAnnualSpendEUR - annualSpendEUR,
        }
      : null,
    allTiers: tiers,
  }
}

// ============================================================
// FEATURE 13: SUSTAINABILITY
// ============================================================

export function getSustainability() {
  return getSnapshot().sustainability
}

// ============================================================
// FEATURE 14: TREND FORECAST
// ============================================================

export function getTrends() {
  return getSnapshot().trends.sort((a, b) => b.intensity - a.intensity)
}

// ============================================================
// FEATURE 15: DROP QUEUE
// ============================================================

export function getDropQueue() {
  return getSnapshot().dropQueue.sort(
    (a, b) => new Date(a.opensAt).getTime() - new Date(b.opensAt).getTime(),
  )
}
