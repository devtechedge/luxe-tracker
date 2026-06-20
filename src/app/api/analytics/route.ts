import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// ──────────── Shared helpers ────────────
const RATE_TO_EUR: Record<string, number> = {
  EUR: 1, USD: 1 / 1.085, GBP: 1 / 0.856, NOK: 1 / 11.52, INR: 1 / 92.45
}

function toEUR(price: number, currency: string) {
  return price * (RATE_TO_EUR[currency] || 1)
}

function round2(n: number) { return Math.round(n * 100) / 100 }

function computeDisparity(prices: any[]) {
  const euPrice = prices.find((p: any) => p.region === 'EU')
  if (!euPrice) return null
  const results = prices.map((p: any) => {
    const euConverted = euPrice.price
    const localInEUR = p.price * (RATE_TO_EUR[p.currency] || 1)
    const disparityPct = ((localInEUR - euConverted) / euConverted) * 100
    const importDutyImpact = localInEUR * p.importDuty
    const taxImpact = localInEUR * p.taxRate
    const totalLandedCost = localInEUR + importDutyImpact + taxImpact
    return {
      region: p.region, currency: p.currency, price: p.price,
      priceInEUR: round2(localInEUR), disparityPct: round2(disparityPct),
      importDuty: p.importDuty, importDutyImpact: round2(importDutyImpact),
      taxRate: p.taxRate, taxImpact: round2(taxImpact),
      totalLandedCost: round2(totalLandedCost),
      shippingCost: p.shippingCost || 0, stockStatus: p.stockStatus, stockLevel: p.stockLevel || 50,
    }
  })
  const maxDisparity = results.reduce((max: any, r: any) =>
    Math.abs(r.disparityPct) > Math.abs(max.disparityPct) ? r : max, results[0])
  const avgDisparity = results.reduce((sum: number, r: any) => sum + r.disparityPct, 0) / results.length
  return { regionalBreakdown: results, maxDisparity, avgDisparity: round2(avgDisparity) }
}

// ════════════════════════════════════════════════
// ROUTE HANDLERS
// ════════════════════════════════════════════════
export async function GET(request: Request) {
  const url = new URL(request.url)
  // The front-end fetchAPI() helper embeds the full path (including any query string)
  // into a single `path` query parameter, e.g. path=/api/optimizer/landed-cost?productId=X&targetRegion=Y
  // Split the embedded query string off the path and merge those params back into url.searchParams
  // so the route handlers below can match the clean path and read params normally.
  const rawPath = url.searchParams.get('path') || '/health'
  const qIdx = rawPath.indexOf('?')
  const subPath = qIdx === -1 ? rawPath : rawPath.slice(0, qIdx)
  if (qIdx !== -1) {
    const embedded = new URLSearchParams(rawPath.slice(qIdx + 1))
    for (const [k, v] of embedded.entries()) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v)
    }
  }

  try {
    // ────── Health ──────
    if (subPath === '/health') {
      await prisma.$queryRaw`SELECT 1`
      return NextResponse.json({
        status: 'healthy', service: 'analytics-engine',
        timestamp: new Date().toISOString(), database: 'connected', version: '2.0.0',
      })
    }

    // ────── /api/brands ──────
    if (subPath === '/api/brands') {
      const brands = await prisma.brand.findMany({
        include: { _count: { select: { products: true, launches: true } } }
      })
      return NextResponse.json(brands)
    }

    // ────── /api/products ──────
    if (subPath === '/api/products') {
      const products = await prisma.product.findMany({
        include: { brand: true, regionalPrices: true, hypeFactors: { take: 1, orderBy: { createdAt: 'desc' } } }
      })
      const enriched = products.map(p => {
        const disparity = computeDisparity(p.regionalPrices)
        return {
          ...p,
          disparity,
          hypeScore: p.hypeFactors[0]?.hypeScore || 0,
        }
      })
      enriched.sort((a, b) => {
        const aMax = Math.abs(a.disparity?.maxDisparity?.disparityPct || 0)
        const bMax = Math.abs(b.disparity?.maxDisparity?.disparityPct || 0)
        return bMax - aMax
      })
      return NextResponse.json(enriched)
    }

    // ────── /api/products/:id ──────
    if (subPath.startsWith('/api/products/') && subPath.split('/').length === 4) {
      const id = subPath.split('/')[3]
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          brand: true, regionalPrices: true, launches: true,
          hypeFactors: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      })
      if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const disparity = computeDisparity(product.regionalPrices)
      return NextResponse.json({
        ...product, disparity,
        hypeScore: product.hypeFactors[0]?.hypeScore || 0,
        hypeBreakdown: product.hypeFactors[0] || null,
      })
    }

    // ────── /api/launches ──────
    if (subPath === '/api/launches') {
      const brandFilter = url.searchParams.get('brand')
      const regionFilter = url.searchParams.get('region')
      const statusFilter = url.searchParams.get('status')
      const where: any = {}
      if (brandFilter) {
        const brand = await prisma.brand.findFirst({ where: { name: brandFilter } })
        if (brand) where.brandId = brand.id
      }
      if (regionFilter) where.region = regionFilter
      if (statusFilter) where.status = statusFilter
      const launches = await prisma.launch.findMany({
        where, include: { product: { include: { brand: true } }, brand: true },
        orderBy: { launchDate: 'asc' },
      })
      return NextResponse.json(launches)
    }

    // ────── /api/launches/calendar ──────
    if (subPath === '/api/launches/calendar') {
      const launches = await prisma.launch.findMany({
        include: { product: { include: { brand: true } }, brand: true },
        orderBy: { launchDate: 'asc' },
      })
      const calendar: Record<string, any[]> = {}
      for (const launch of launches) {
        const monthKey = launch.launchDate.toISOString().slice(0, 7)
        if (!calendar[monthKey]) calendar[monthKey] = []
        calendar[monthKey].push(launch)
      }
      return NextResponse.json(calendar)
    }

    // ════════════════════════════════════════════════
    // FEATURE 1: ARBITRAGE OPPORTUNITY FINDER
    // ════════════════════════════════════════════════
    if (subPath === '/api/arbitrage/opportunities') {
      const products = await prisma.product.findMany({
        include: { brand: true, regionalPrices: true },
      })
      const opportunities: any[] = []
      for (const p of products) {
        const prices = p.regionalPrices
        // For each target region, find best source region to buy from and ship
        for (const target of prices) {
          for (const source of prices) {
            if (source.region === target.region) continue
            // Skip if source stock is critical
            if ((source.stockLevel || 50) < 20) continue
            // Buy at source price, convert to EUR, add shipping + import duty (using target's duty if shipped to target)
            const sourcePriceEUR = toEUR(source.price, source.currency)
            const shipping = source.shippingCost || 50
            // If shipping to target, target's import duty may apply (simplified model)
            const dutyApplied = sourcePriceEUR * target.importDuty
            const totalCostEUR = sourcePriceEUR + shipping + dutyApplied
            // Compare to buying locally at target
            const targetLocalPriceEUR = toEUR(target.price, target.currency)
            const savingsEUR = targetLocalPriceEUR - totalCostEUR
            const savingsPct = round2((savingsEUR / targetLocalPriceEUR) * 100)
            // Only include profitable opportunities
            if (savingsEUR > 20) {
              opportunities.push({
                productId: p.id, productName: p.name, sku: p.sku,
                brand: p.brand.name, category: p.category,
                buyFromRegion: source.region, buyAtPrice: source.price, buyCurrency: source.currency,
                buyPriceEUR: round2(sourcePriceEUR),
                shipToRegion: target.region, localPriceAtTarget: target.price, localCurrency: target.currency,
                localPriceEUR: round2(targetLocalPriceEUR),
                shippingCostEUR: shipping, importDutyApplied: target.importDuty,
                dutyImpactEUR: round2(dutyApplied),
                totalLandedCostEUR: round2(totalCostEUR),
                savingsEUR: round2(savingsEUR), savingsPct,
                stockLevelAtSource: source.stockLevel || 50,
              })
            }
          }
        }
      }
      // Sort by savings %
      opportunities.sort((a, b) => b.savingsPct - a.savingsPct)
      return NextResponse.json({
        totalOpportunities: opportunities.length,
        avgSavingsPct: opportunities.length > 0
          ? round2(opportunities.reduce((s, o) => s + o.savingsPct, 0) / opportunities.length) : 0,
        topOpportunities: opportunities.slice(0, 30),
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 2: LAUNCH HYPE PREDICTOR
    // ════════════════════════════════════════════════
    if (subPath === '/api/hype/predict') {
      const products = await prisma.product.findMany({
        include: { brand: true, hypeFactors: { take: 1, orderBy: { createdAt: 'desc' } },
          launches: { where: { launchDate: { gte: new Date() } }, orderBy: { launchDate: 'asc' }, take: 1 } }
      })
      const hyped = products.map(p => {
        const hf = p.hypeFactors[0]
        const upcomingLaunch = p.launches[0]
        let daysToLaunch: number | null = null
        if (upcomingLaunch) {
          daysToLaunch = Math.ceil((upcomingLaunch.launchDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        }
        return {
          productId: p.id, productName: p.name, sku: p.sku,
          brand: p.brand.name, category: p.category, season: p.season,
          editionType: p.editionType, resaleValueIdx: p.resaleValueIdx,
          hypeScore: hf?.hypeScore || 0,
          hypeBreakdown: hf ? {
            brandTier: hf.brandTierWeight, category: hf.categoryWeight,
            season: hf.seasonWeight, exclusivity: hf.exclusivityWeight, decay: hf.decayWeight,
          } : null,
          daysToLaunch, launchRegion: upcomingLaunch?.region || null,
          launchType: upcomingLaunch?.launchType || null,
          expectedUnits: upcomingLaunch?.expectedUnits || 0,
        }
      })
      hyped.sort((a, b) => b.hypeScore - a.hypeScore)
      return NextResponse.json({
        totalProducts: hyped.length,
        avgHypeScore: hyped.length > 0 ? Math.round(hyped.reduce((s, h) => s + h.hypeScore, 0) / hyped.length) : 0,
        topHyped: hyped.slice(0, 10),
        allProducts: hyped,
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 3: CURRENCY VOLATILITY TRACKER
    // ════════════════════════════════════════════════
    if (subPath === '/api/currency/volatility') {
      const rates = await prisma.currencyRate.findMany({
        where: { targetCurrency: { not: 'EUR' } },
        include: { history: { orderBy: { date: 'asc' } } },
      })
      const analysis = rates.map(r => {
        const history = r.history
        if (history.length < 2) return null
        const values = history.map(h => h.rate)
        const mean = values.reduce((a, b) => a + b, 0) / values.length
        const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length
        const stdDev = Math.sqrt(variance)
        const volatilityPct = round2((stdDev / mean) * 100)
        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = round2(((max - min) / min) * 100)
        const firstRate = values[0]
        const lastRate = values[values.length - 1]
        const change90d = round2(((lastRate - firstRate) / firstRate) * 100)
        // Risk score: combine volatility + range + abs(change)
        const riskScore = Math.min(100, Math.round(volatilityPct * 8 + range * 3 + Math.abs(change90d) * 2))
        // Build time series for chart
        const series = history.map(h => ({ date: h.date.toISOString().slice(0, 10), rate: h.rate }))
        return {
          pair: `${r.baseCurrency}/${r.targetCurrency}`,
          currentRate: lastRate, mean: round2(mean),
          min: round2(min), max: round2(max),
          volatilityPct, rangePct: range, change90dPct: change90d,
          riskScore, riskLevel: riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low',
          series,
        }
      }).filter(Boolean)
      return NextResponse.json({
        pairs: analysis,
        overallRisk: analysis.length > 0
          ? Math.round(analysis.reduce((s: number, a: any) => s + a.riskScore, 0) / analysis.length) : 0,
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 4: CROSS-BRAND COMPETITIVE INTELLIGENCE
    // ════════════════════════════════════════════════
    if (subPath === '/api/competitive/matrix') {
      const products = await prisma.product.findMany({
        include: { brand: true, regionalPrices: true },
      })
      // Group by category
      const categories: Record<string, any[]> = {}
      for (const p of products) {
        if (!categories[p.category]) categories[p.category] = []
        categories[p.category].push(p)
      }
      const matrix = Object.entries(categories).map(([category, prods]) => {
        // For each brand in this category, compute avg EUR price across regions
        const brandStats: Record<string, { prices: number[]; count: number }> = {}
        for (const p of prods) {
          if (!brandStats[p.brand.name]) brandStats[p.brand.name] = { prices: [], count: 0 }
          for (const rp of p.regionalPrices) {
            brandStats[p.brand.name].prices.push(toEUR(rp.price, rp.currency))
            brandStats[p.brand.name].count++
          }
        }
        const brandEntries = Object.entries(brandStats).map(([brand, data]) => {
          const avgPrice = data.prices.reduce((a, b) => a + b, 0) / data.prices.length
          return { brand, avgPriceEUR: round2(avgPrice), productCount: prods.filter(p => p.brand.name === brand).length }
        })
        brandEntries.sort((a, b) => a.avgPriceEUR - b.avgPriceEUR)
        const valueLeader = brandEntries[0]
        const premiumLeader = brandEntries[brandEntries.length - 1]
        const spread = round2(premiumLeader.avgPriceEUR - valueLeader.avgPriceEUR)
        const spreadPct = round2((spread / valueLeader.avgPriceEUR) * 100)
        return {
          category, totalProducts: prods.length,
          brands: brandEntries,
          valueLeader: valueLeader?.brand || null,
          premiumLeader: premiumLeader?.brand || null,
          priceSpreadEUR: spread, priceSpreadPct: spreadPct,
        }
      })
      return NextResponse.json({ categories: matrix })
    }

    // ════════════════════════════════════════════════
    // FEATURE 5: DROP CALENDAR CONFLICT DETECTOR
    // ════════════════════════════════════════════════
    if (subPath === '/api/launches/conflicts') {
      const launches = await prisma.launch.findMany({
        include: { product: { include: { brand: true } }, brand: true },
        orderBy: { launchDate: 'asc' },
      })
      // Group by day
      const byDay: Record<string, any[]> = {}
      for (const l of launches) {
        const dayKey = l.launchDate.toISOString().slice(0, 10)
        if (!byDay[dayKey]) byDay[dayKey] = []
        byDay[dayKey].push(l)
      }
      // Also build week buckets for "competition windows"
      const byWeek: Record<string, any[]> = {}
      for (const l of launches) {
        const d = new Date(l.launchDate)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        const weekKey = weekStart.toISOString().slice(0, 10)
        if (!byWeek[weekKey]) byWeek[weekKey] = []
        byWeek[weekKey].push(l)
      }
      // Find conflict days (2+ launches from different brands)
      const conflicts = Object.entries(byDay)
        .filter(([, events]) => {
          const brands = new Set(events.map((e: any) => e.brandId))
          return brands.size >= 2
        })
        .map(([day, events]) => {
          const brands = [...new Set(events.map((e: any) => e.brand.name))]
          return {
            date: day, eventCount: events.length, brands,
            cannibalizationRisk: events.length >= 3 ? 'critical' : events.length === 2 ? 'moderate' : 'low',
            events: events.map(e => ({
              productName: e.product.name, brand: e.brand.name, region: e.region,
              launchType: e.launchType, status: e.status,
            })),
          }
        })
      // Weekly density
      const weeklyDensity = Object.entries(byWeek).map(([week, events]) => {
        const brands = [...new Set(events.map((e: any) => e.brand.name))]
        return {
          weekStart: week, totalLaunches: events.length,
          brandCount: brands.length, brands,
          densityScore: Math.min(100, events.length * 12 + brands.length * 8),
        }
      }).sort((a, b) => a.weekStart.localeCompare(b.weekStart))
      return NextResponse.json({
        conflictDays: conflicts.sort((a, b) => b.eventCount - a.eventCount),
        weeklyDensity,
        totalConflicts: conflicts.length,
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 6: REGIONAL STOCK-OUT RISK FORECAST
    // ════════════════════════════════════════════════
    if (subPath === '/api/stock/risk-forecast') {
      const products = await prisma.product.findMany({
        include: { brand: true, regionalPrices: true,
          hypeFactors: { take: 1, orderBy: { createdAt: 'desc' } } }
      })
      const risks: any[] = []
      for (const p of products) {
        const hype = p.hypeFactors[0]?.hypeScore || 50
        for (const rp of p.regionalPrices) {
          const stock = rp.stockLevel || 50
          // Higher hype + lower stock + pre-order status = higher risk
          const demandPressure = (hype / 100) * 40
          const stockPressure = (100 - stock) * 0.5
          const statusMultiplier = rp.stockStatus === 'pre-order' ? 1.3 : rp.stockStatus === 'limited' ? 1.15 : 1.0
          const riskScore = Math.min(100, Math.round((demandPressure + stockPressure) * statusMultiplier))
          const riskLevel = riskScore > 70 ? 'critical' : riskScore > 45 ? 'high' : riskScore > 25 ? 'moderate' : 'low'
          // Estimate days to stockout (simplified)
          const dailySellRate = (hype / 100) * (100 - stock) * 0.05 + 0.5
          const estimatedDaysToStockout = stock > 5 ? Math.round(stock / dailySellRate) : 0
          risks.push({
            productId: p.id, productName: p.name, sku: p.sku,
            brand: p.brand.name, category: p.category,
            region: rp.region, currency: rp.currency, price: rp.price,
            stockLevel: stock, stockStatus: rp.stockStatus,
            hypeScore: hype, riskScore, riskLevel,
            estimatedDaysToStockout,
            restockUrgency: riskScore > 70 ? 'immediate' : riskScore > 45 ? 'within 2 weeks' : riskScore > 25 ? 'within 1 month' : 'monitor',
          })
        }
      }
      risks.sort((a, b) => b.riskScore - a.riskScore)
      return NextResponse.json({
        totalEntries: risks.length,
        criticalCount: risks.filter(r => r.riskLevel === 'critical').length,
        highCount: risks.filter(r => r.riskLevel === 'high').length,
        topRisks: risks.slice(0, 20),
        allRisks: risks,
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 7: LANDED COST OPTIMIZER (Personal Shopper)
    // ════════════════════════════════════════════════
    if (subPath === '/api/optimizer/landed-cost') {
      const productId = url.searchParams.get('productId')
      const targetRegion = url.searchParams.get('targetRegion')
      if (!productId || !targetRegion) {
        return NextResponse.json({ error: 'productId and targetRegion required' }, { status: 400 })
      }
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { brand: true, regionalPrices: true },
      })
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      const routes: any[] = []
      for (const rp of product.regionalPrices) {
        const sourcePriceEUR = toEUR(rp.price, rp.currency)
        const shipping = rp.shippingCost || 50
        // If shipping to target region, target's import duty may apply
        const targetRp = product.regionalPrices.find(r => r.region === targetRegion)
        const dutyRate = targetRp?.importDuty || 0
        const dutyAmount = sourcePriceEUR * dutyRate
        const totalLanded = sourcePriceEUR + shipping + dutyAmount
        // Local purchase option
        const localPriceEUR = targetRp ? toEUR(targetRp.price, targetRp.currency) : 0
        const savingsVsLocal = localPriceEUR - totalLanded
        const savingsPct = localPriceEUR > 0 ? round2((savingsVsLocal / localPriceEUR) * 100) : 0
        routes.push({
          sourceRegion: rp.region, sourceCurrency: rp.currency,
          sourcePrice: rp.price, sourcePriceEUR: round2(sourcePriceEUR),
          shippingCostEUR: shipping, importDutyRate: dutyRate,
          importDutyAmountEUR: round2(dutyAmount),
          totalLandedCostEUR: round2(totalLanded),
          stockLevelAtSource: rp.stockLevel || 50,
          stockStatusAtSource: rp.stockStatus,
          savingsVsLocalEUR: round2(savingsVsLocal),
          savingsVsLocalPct: savingsPct,
          isLocalPurchase: rp.region === targetRegion,
        })
      }
      routes.sort((a, b) => a.totalLandedCostEUR - b.totalLandedCostEUR)
      const bestRoute = routes[0]
      const localRoute = routes.find(r => r.isLocalPurchase)
      return NextResponse.json({
        product: { id: product.id, name: product.name, sku: product.sku, brand: product.brand.name, category: product.category },
        targetRegion,
        localPriceEUR: localRoute?.sourcePriceEUR || 0,
        bestRoute,
        allRoutes: routes,
        potentialSavingsEUR: bestRoute ? Math.max(0, round2((localRoute?.totalLandedCostEUR || 0) - bestRoute.totalLandedCostEUR)) : 0,
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 8: LUXURY PRICE HISTORY TIMELINE
    // ════════════════════════════════════════════════
    if (subPath === '/api/history/timeline') {
      const productId = url.searchParams.get('productId')
      const where: any = {}
      if (productId) where.productId = productId
      const history = await prisma.priceHistory.findMany({
        where, include: { product: { include: { brand: true } } },
        orderBy: { date: 'asc' },
      })
      // Group by product + region
      const grouped: Record<string, any> = {}
      for (const h of history) {
        const key = `${h.productId}|${h.region}`
        if (!grouped[key]) {
          grouped[key] = {
            productId: h.productId, productName: h.product.name,
            brand: h.product.brand.name, region: h.region,
            currency: h.currency, series: [], anomalies: [],
          }
        }
        grouped[key].series.push({ date: h.date.toISOString().slice(0, 10), price: h.price, changePct: h.changePct })
        if (h.anomalyFlag) {
          grouped[key].anomalies.push({ date: h.date.toISOString().slice(0, 10), price: h.price, changePct: h.changePct })
        }
      }
      const result = Object.values(grouped)
      // If single product, return all regions; else return summary
      if (productId) {
        return NextResponse.json({ product: result[0]?.productName, timelines: result })
      }
      // Summary: top movers (biggest 90d change)
      const movers = result.map(t => {
        const first = t.series[0]?.price || 0
        const last = t.series[t.series.length - 1]?.price || 0
        const change90d = first > 0 ? round2(((last - first) / first) * 100) : 0
        return {
          productId: t.productId, productName: t.productName, brand: t.brand,
          region: t.region, currency: t.currency,
          startPrice: first, endPrice: last, change90dPct: change90d,
          anomalyCount: t.anomalies.length,
        }
      })
      movers.sort((a, b) => Math.abs(b.change90dPct) - Math.abs(a.change90dPct))
      return NextResponse.json({
        topMovers: movers.slice(0, 15),
        totalAnomalies: movers.reduce((s, m) => s + m.anomalyCount, 0),
        totalSeries: result.length,
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 9: BRAND TREND PULSE RADAR
    // ════════════════════════════════════════════════
    if (subPath === '/api/brand/pulse') {
      const brands = await prisma.brand.findMany({
        include: {
          products: { include: { regionalPrices: true, hypeFactors: { take: 1, orderBy: { createdAt: 'desc' } } } },
          launches: true,
        },
      })
      const pulses = brands.map(brand => {
        const products = brand.products
        // Compute 5 dimensions: Prestige, Pricing Power, Hype Index, Launch Velocity, Stock Health
        const prestige = brand.tierScore
        // Pricing Power: avg disparity (higher = stronger pricing power)
        let totalDisp = 0, dispCount = 0
        for (const p of products) {
          const disp = computeDisparity(p.regionalPrices)
          if (disp) { totalDisp += disp.avgDisparity; dispCount++ }
        }
        const pricingPower = dispCount > 0 ? Math.min(100, Math.round((totalDisp / dispCount) * 3)) : 0
        // Hype Index: avg hype score
        const hypeScores = products.map(p => p.hypeFactors[0]?.hypeScore || 0).filter(s => s > 0)
        const hypeIndex = hypeScores.length > 0 ? Math.round(hypeScores.reduce((a, b) => a + b, 0) / hypeScores.length) : 0
        // Launch Velocity: launches in next 30 days / total products (scaled)
        const now = new Date()
        const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        const upcomingLaunches = brand.launches.filter(l =>
          l.launchDate >= now && l.launchDate <= thirtyDaysLater).length
        const launchVelocity = Math.min(100, Math.round((upcomingLaunches / Math.max(1, products.length)) * 100))
        // Stock Health: avg stock level across all regional prices
        let totalStock = 0, stockCount = 0
        for (const p of products) {
          for (const rp of p.regionalPrices) {
            totalStock += rp.stockLevel || 50
            stockCount++
          }
        }
        const stockHealth = stockCount > 0 ? Math.round(totalStock / stockCount) : 0
        // Overall pulse
        const overallScore = Math.round(
          prestige * 0.25 + pricingPower * 0.20 + hypeIndex * 0.25 + launchVelocity * 0.15 + stockHealth * 0.15
        )
        return {
          brandId: brand.id, brand: brand.name, logo: brand.logo, country: brand.country,
          dimensions: {
            prestige, pricingPower, hypeIndex, launchVelocity, stockHealth,
          },
          overallScore,
          productCount: products.length,
          upcomingLaunches,
          avgHypeScore: hypeIndex,
        }
      })
      pulses.sort((a, b) => b.overallScore - a.overallScore)
      return NextResponse.json({ brands: pulses })
    }

    // ════════════════════════════════════════════════
    // FEATURE 10: WATCHLIST & ALERTS
    // ════════════════════════════════════════════════
    if (subPath === '/api/watchlist') {
      const items = await prisma.watchlistItem.findMany({
        include: { product: { include: { brand: true, regionalPrices: true } }, brand: true },
        orderBy: { createdAt: 'desc' },
      })
      // Enrich with current price info
      const enriched = items.map(item => {
        const disparity = item.product ? computeDisparity(item.product.regionalPrices) : null
        return {
          id: item.id, watchType: item.watchType,
          productId: item.productId, productName: item.product?.name,
          brand: item.product?.brand?.name || item.brand?.name,
          region: item.region, targetPrice: item.targetPrice,
          createdAt: item.createdAt,
          currentMinPriceEUR: disparity ? Math.min(...disparity.regionalBreakdown.map((r: any) => r.priceInEUR)) : null,
          currentMaxPriceEUR: disparity ? Math.max(...disparity.regionalBreakdown.map((r: any) => r.priceInEUR)) : null,
          regionalBreakdown: disparity?.regionalBreakdown || [],
        }
      })
      return NextResponse.json({ items: enriched, count: enriched.length })
    }

    if (subPath === '/api/alerts') {
      const alerts = await prisma.alert.findMany({
        include: { product: { include: { brand: true } }, brand: true },
        orderBy: { createdAt: 'desc' }, take: 50,
      })
      return NextResponse.json({ alerts, count: alerts.length })
    }

    // ────── /api/disparity/matrix (kept from v1) ──────
    if (subPath === '/api/disparity/matrix') {
      const products = await prisma.product.findMany({
        include: { brand: true, regionalPrices: true, hypeFactors: { take: 1, orderBy: { createdAt: 'desc' } } },
      })
      const matrix = products.map(p => {
        const disparity = computeDisparity(p.regionalPrices)
        return {
          productId: p.id, productName: p.name, sku: p.sku,
          category: p.category, brand: p.brand.name, season: p.season,
          editionType: p.editionType, resaleValueIdx: p.resaleValueIdx,
          maxDisparityPct: disparity?.maxDisparity?.disparityPct || 0,
          maxDisparityRegion: disparity?.maxDisparity?.region || '',
          avgDisparityPct: disparity?.avgDisparity || 0,
          regionalBreakdown: disparity?.regionalBreakdown || [],
          hypeScore: p.hypeFactors[0]?.hypeScore || 0,
        }
      })
      matrix.sort((a, b) => Math.abs(b.maxDisparityPct) - Math.abs(a.maxDisparityPct))
      return NextResponse.json(matrix)
    }

    // ────── /api/disparity/telemetry (kept from v1, expanded) ──────
    if (subPath === '/api/disparity/telemetry') {
      const products = await prisma.product.findMany({
        include: { brand: true, regionalPrices: true, hypeFactors: { take: 1, orderBy: { createdAt: 'desc' } } },
      })
      const currencyRates = await prisma.currencyRate.findMany()
      const allDisparities: number[] = []
      const regionAvgDisparity: Record<string, { sum: number; count: number }> = {}
      const brandAvgDisparity: Record<string, { sum: number; count: number }> = {}
      let highDutyProducts = 0, limitedStockCount = 0
      for (const p of products) {
        const disparity = computeDisparity(p.regionalPrices)
        if (!disparity) continue
        for (const rb of disparity.regionalBreakdown) {
          allDisparities.push(rb.disparityPct)
          if (!regionAvgDisparity[rb.region]) regionAvgDisparity[rb.region] = { sum: 0, count: 0 }
          regionAvgDisparity[rb.region].sum += rb.disparityPct
          regionAvgDisparity[rb.region].count += 1
          if (rb.importDuty > 0.15) highDutyProducts++
          if (rb.stockStatus === 'limited' || rb.stockStatus === 'pre-order') limitedStockCount++
        }
        if (!brandAvgDisparity[p.brand.name]) brandAvgDisparity[p.brand.name] = { sum: 0, count: 0 }
        brandAvgDisparity[p.brand.name].sum += disparity.avgDisparity
        brandAvgDisparity[p.brand.name].count += 1
      }
      const avgDisparityOverall = allDisparities.length > 0
        ? round2(allDisparities.reduce((a, b) => a + b, 0) / allDisparities.length) : 0
      const maxDisparityOverall = allDisparities.length > 0
        ? round2(Math.max(...allDisparities.map(Math.abs))) : 0
      const regionSummary = Object.entries(regionAvgDisparity).map(([region, data]) => ({
        region, avgDisparityPct: round2((data.sum / data.count) * 100) / 100,
      }))
      const brandSummary = Object.entries(brandAvgDisparity).map(([brand, data]) => ({
        brand, avgDisparityPct: round2((data.sum / data.count) * 100) / 100,
      }))
      const hypeScores = products.map(p => p.hypeFactors[0]?.hypeScore || 0).filter(s => s > 0)
      return NextResponse.json({
        overview: {
          totalProducts: products.length,
          totalBrands: await prisma.brand.count(),
          totalLaunches: await prisma.launch.count(),
          avgDisparityOverall, maxDisparityOverall, highDutyProducts, limitedStockCount,
          avgHypeScore: hypeScores.length > 0 ? Math.round(hypeScores.reduce((a, b) => a + b, 0) / hypeScores.length) : 0,
        },
        currencyRates: currencyRates.map(r => ({ pair: `${r.baseCurrency}/${r.targetCurrency}`, rate: r.rate })),
        regionSummary, brandSummary,
      })
    }

    // ────── /api/lookbooks ──────
    if (subPath === '/api/lookbooks') {
      const lookbooks = await prisma.lookbookEntry.findMany({
        include: { brand: true },
        orderBy: [{ year: 'desc' }, { season: 'asc' }],
      })
      return NextResponse.json(lookbooks)
    }

    // ════════════════════════════════════════════════
    // FEATURE 11: RUNWAY COLLECTION TRACKER
    // ════════════════════════════════════════════════
    if (subPath === '/api/runway/shows') {
      const brandFilter = url.searchParams.get('brand')
      const seasonFilter = url.searchParams.get('season')
      const where: any = {}
      if (brandFilter) {
        const brand = await prisma.brand.findFirst({ where: { name: brandFilter } })
        if (brand) where.brandId = brand.id
      }
      if (seasonFilter) where.season = seasonFilter
      const shows = await prisma.runwayShow.findMany({
        where, include: { brand: true },
        orderBy: { showDate: 'desc' },
      })
      const byCity: Record<string, any[]> = {}
      const bySeason: Record<string, any[]> = {}
      for (const show of shows) {
        const entry = {
          id: show.id, showName: show.showName, season: show.season, year: show.year,
          city: show.city, venue: show.venue, showDate: show.showDate.toISOString(),
          mood: show.mood, theme: show.theme, lookCount: show.lookCount, standouts: show.standouts,
          brand: { id: show.brand.id, name: show.brand.name, logo: show.brand.logo, country: show.brand.country },
        }
        if (!byCity[show.city]) byCity[show.city] = []
        byCity[show.city].push(entry)
        if (!bySeason[show.season]) bySeason[show.season] = []
        bySeason[show.season].push(entry)
      }
      return NextResponse.json({
        totalShows: shows.length,
        shows: shows.map(s => ({
          id: s.id, showName: s.showName, season: s.season, year: s.year,
          city: s.city, venue: s.venue, showDate: s.showDate.toISOString(),
          mood: s.mood, theme: s.theme, lookCount: s.lookCount, standouts: s.standouts,
          brand: { id: s.brand.id, name: s.brand.name, logo: s.brand.logo, country: s.brand.country },
        })),
        byCity, bySeason,
        cities: Object.keys(byCity).sort(),
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 12: VIP CLIENT TIER SIMULATOR
    // ════════════════════════════════════════════════
    if (subPath === '/api/vip/simulate') {
      const brandName = url.searchParams.get('brand')
      const spendEUR = parseFloat(url.searchParams.get('spendEUR') || '50000')
      const where: any = {}
      if (brandName) {
        const brand = await prisma.brand.findFirst({ where: { name: brandName } })
        if (brand) where.brandId = brand.id
      }
      const tiers = await prisma.vIPTier.findMany({
        where, include: { brand: true },
        orderBy: [{ brandId: 'asc' }, { minAnnualSpendEUR: 'asc' }],
      })
      const simulations = []
      const brandGroups: Record<string, any[]> = {}
      for (const tier of tiers) {
        if (!brandGroups[tier.brand.name]) brandGroups[tier.brand.name] = []
        brandGroups[tier.brand.name].push(tier)
      }
      for (const [bName, brandTiers] of Object.entries(brandGroups)) {
        let qualifiedTier: any = null
        let nextTier: any = null
        for (const tier of brandTiers) {
          if (spendEUR >= tier.minAnnualSpendEUR) qualifiedTier = tier
          else if (!nextTier) nextTier = tier
        }
        simulations.push({
          brand: bName,
          brandId: brandTiers[0].brandId,
          qualifiedTier: qualifiedTier ? {
            tierName: qualifiedTier.tierName,
            discountPct: qualifiedTier.discountPct,
            earlyAccessDays: qualifiedTier.earlyAccessDays,
            allocationPriority: qualifiedTier.allocationPriority,
            privateViewing: qualifiedTier.privateViewing,
            personalShopper: qualifiedTier.personalShopper,
          } : null,
          nextTier: nextTier ? {
            tierName: nextTier.tierName,
            minAnnualSpendEUR: nextTier.minAnnualSpendEUR,
            gapEUR: round2(nextTier.minAnnualSpendEUR - spendEUR),
          } : null,
          allTiers: brandTiers.map(t => ({
            tierName: t.tierName, minAnnualSpendEUR: t.minAnnualSpendEUR,
            discountPct: t.discountPct, earlyAccessDays: t.earlyAccessDays,
            allocationPriority: t.allocationPriority,
            privateViewing: t.privateViewing, personalShopper: t.personalShopper,
            achievable: spendEUR >= t.minAnnualSpendEUR,
          })),
        })
      }
      const products = await prisma.product.findMany({
        include: { brand: true, regionalPrices: { where: { region: 'EU' } } },
        take: 5,
      })
      const savingsExamples = products.map(p => {
        const euPrice = p.regionalPrices[0]?.price || 0
        const sim = simulations.find(s => s.brand === p.brand.name)
        const discountPct = sim?.qualifiedTier?.discountPct || 0
        return {
          product: p.name, brand: p.brand.name, retailPrice: euPrice,
          discountPct, savingsEUR: round2(euPrice * discountPct / 100),
          vipPrice: round2(euPrice * (1 - discountPct / 100)),
        }
      })
      return NextResponse.json({
        spendEUR, simulations, savingsExamples,
        totalTiers: tiers.length,
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 13: SUSTAINABILITY SCORE
    // ════════════════════════════════════════════════
    if (subPath === '/api/sustainability/scores') {
      const metrics = await prisma.sustainabilityMetric.findMany({
        include: { brand: true },
        orderBy: { overallScore: 'desc' },
      })
      const scores = metrics.map(m => ({
        brandId: m.brandId, brand: m.brand.name, logo: m.brand.logo,
        dimensions: {
          carbonScore: m.carbonScore,
          materialSourcing: m.materialSourcing,
          supplyChainTransparency: m.supplyChainTransparency,
          circularityIndex: m.circularityIndex,
          laborPracticeScore: m.laborPracticeScore,
        },
        overallScore: m.overallScore, reportYear: m.reportYear,
      }))
      const avgCarbon = round2(scores.reduce((s, m) => s + m.dimensions.carbonScore, 0) / scores.length)
      const avgMaterial = round2(scores.reduce((s, m) => s + m.dimensions.materialSourcing, 0) / scores.length)
      const avgSupply = round2(scores.reduce((s, m) => s + m.dimensions.supplyChainTransparency, 0) / scores.length)
      const avgCircularity = round2(scores.reduce((s, m) => s + m.dimensions.circularityIndex, 0) / scores.length)
      const avgLabor = round2(scores.reduce((s, m) => s + m.dimensions.laborPracticeScore, 0) / scores.length)
      return NextResponse.json({
        scores,
        industryAvg: {
          carbonScore: avgCarbon, materialSourcing: avgMaterial,
          supplyChainTransparency: avgSupply, circularityIndex: avgCircularity,
          laborPracticeScore: avgLabor,
          overall: round2((avgCarbon + avgMaterial + avgSupply + avgCircularity + avgLabor) / 5),
        },
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 14: SEASONAL TREND FORECAST
    // ════════════════════════════════════════════════
    if (subPath === '/api/trends/forecast') {
      const seasonFilter = url.searchParams.get('season')
      const typeFilter = url.searchParams.get('type')
      const where: any = {}
      if (seasonFilter) where.season = seasonFilter
      if (typeFilter) where.trendType = typeFilter
      const trends = await prisma.trendForecast.findMany({
        where, orderBy: { intensity: 'desc' },
      })
      const result = trends.map(t => ({
        id: t.id, season: t.season, year: t.year, category: t.category,
        trendName: t.trendName, trendType: t.trendType,
        intensity: t.intensity,
        colorPalette: t.colorPalette ? JSON.parse(t.colorPalette) : null,
        description: t.description,
        keyBrands: t.keyBrands ? JSON.parse(t.keyBrands) : null,
        confidence: t.confidence,
      }))
      const byType: Record<string, any[]> = {}
      for (const t of result) {
        if (!byType[t.trendType]) byType[t.trendType] = []
        byType[t.trendType].push(t)
      }
      return NextResponse.json({
        totalTrends: result.length,
        trends: result,
        byType,
        seasons: [...new Set(trends.map(t => t.season))].sort(),
      })
    }

    // ════════════════════════════════════════════════
    // FEATURE 15: EXCLUSIVE DROP QUEUE
    // ════════════════════════════════════════════════
    if (subPath === '/api/drops/queue') {
      const statusFilter = url.searchParams.get('status')
      const regionFilter = url.searchParams.get('region')
      const where: any = {}
      if (statusFilter) where.status = statusFilter
      if (regionFilter) where.region = regionFilter
      const queues = await prisma.dropQueue.findMany({
        where, include: { product: { include: { brand: true } }, brand: true },
        orderBy: { opensAt: 'asc' },
      })
      const result = queues.map(q => ({
        id: q.id, productId: q.productId, productName: q.product.name,
        brand: q.brand.name, editionType: q.product.editionType,
        region: q.region, queueType: q.queueType,
        totalSlots: q.totalSlots, filledSlots: q.filledSlots,
        fillPct: round2((q.filledSlots / q.totalSlots) * 100),
        userPosition: q.userPosition,
        oddsOfSuccess: q.oddsOfSuccess,
        opensAt: q.opensAt.toISOString(),
        closesAt: q.closesAt?.toISOString() || null,
        status: q.status,
        daysUntilOpen: Math.max(0, Math.ceil((q.opensAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      }))
      const openQueues = result.filter(q => q.status === 'open')
      const upcomingQueues = result.filter(q => q.status === 'upcoming')
      const avgOdds = result.length > 0 ? round2(result.reduce((s, q) => s + q.oddsOfSuccess, 0) / result.length) : 0
      return NextResponse.json({
        totalQueues: result.length,
        openCount: openQueues.length,
        upcomingCount: upcomingQueues.length,
        avgOdds,
        queues: result,
      })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  } catch (error: any) {
    console.error('Analytics API Error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}

// ════════════════════════════════════════════════
// POST HANDLERS (watchlist + scrape simulate + alerts)
// ════════════════════════════════════════════════
export async function POST(request: Request) {
  const url = new URL(request.url)
  // Same path/query-string split as GET handler (see comment there for rationale).
  const rawPath = url.searchParams.get('path') || '/api/scrape/simulate'
  const qIdx = rawPath.indexOf('?')
  const subPath = qIdx === -1 ? rawPath : rawPath.slice(0, qIdx)
  if (qIdx !== -1) {
    const embedded = new URLSearchParams(rawPath.slice(qIdx + 1))
    for (const [k, v] of embedded.entries()) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v)
    }
  }
  const body = await request.json().catch(() => ({}))

  try {
    // ────── Add to watchlist ──────
    if (subPath === '/api/watchlist') {
      const item = await prisma.watchlistItem.create({
        data: {
          userId: 'default',
          productId: body.productId,
          brandId: body.brandId,
          watchType: body.watchType || 'product',
          region: body.region,
          targetPrice: body.targetPrice,
        },
        include: { product: { include: { brand: true } }, brand: true },
      })
      return NextResponse.json({ success: true, item })
    }

    // ────── Delete from watchlist ──────
    if (subPath === '/api/watchlist/delete') {
      await prisma.watchlistItem.delete({ where: { id: body.id } })
      return NextResponse.json({ success: true })
    }

    // ────── Mark alert as read ──────
    if (subPath === '/api/alerts/read') {
      await prisma.alert.update({ where: { id: body.id }, data: { read: true } })
      return NextResponse.json({ success: true })
    }

    // ────── Simulate scrape ──────
    if (subPath === '/api/scrape/simulate') {
      await new Promise(resolve => setTimeout(resolve, 200))
      return NextResponse.json({
        timestamp: new Date().toISOString(),
        scrapeType: body.type || 'full',
        brand: body.brand || 'all',
        status: 'completed',
        itemsScraped: Math.floor(Math.random() * 50) + 10,
        pricesUpdated: Math.floor(Math.random() * 30) + 5,
        launchesDiscovered: Math.floor(Math.random() * 8) + 1,
        nextScheduled: new Date(Date.now() + 3600000).toISOString(),
      })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error: any) {
    console.error('POST API Error:', error)
    return NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 })
  }
}
