import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL || 'file:/home/z/my-project/db/custom.db' } }
})
const PORT = 3030

// ──────────── Helper: Compute disparity metrics ────────────
function computeDisparity(prices: any[]) {
  const euPrice = prices.find((p: any) => p.region === 'EU')
  if (!euPrice) return null

  const rateMap: Record<string, number> = {
    EUR: 1, USD: 1 / 1.085, GBP: 1 / 0.856, NOK: 1 / 11.52, INR: 1 / 92.45
  }

  const results = prices.map((p: any) => {
    const euConverted = euPrice.price
    const rateToEUR = rateMap[p.currency] || 1
    const localInEUR = p.price * rateToEUR
    const disparityPct = ((localInEUR - euConverted) / euConverted) * 100
    const importDutyImpact = localInEUR * p.importDuty
    const taxImpact = localInEUR * p.taxRate
    const totalLandedCost = localInEUR + importDutyImpact + taxImpact

    return {
      region: p.region,
      currency: p.currency,
      price: p.price,
      priceInEUR: Math.round(localInEUR * 100) / 100,
      disparityPct: Math.round(disparityPct * 100) / 100,
      importDuty: p.importDuty,
      importDutyImpact: Math.round(importDutyImpact * 100) / 100,
      taxRate: p.taxRate,
      taxImpact: Math.round(taxImpact * 100) / 100,
      totalLandedCost: Math.round(totalLandedCost * 100) / 100,
      stockStatus: p.stockStatus,
    }
  })

  const maxDisparity = results.reduce((max: any, r: any) =>
    Math.abs(r.disparityPct) > Math.abs(max.disparityPct) ? r : max, results[0])
  const avgDisparity = results.reduce((sum: number, r: any) => sum + r.disparityPct, 0) / results.length

  return { regionalBreakdown: results, maxDisparity, avgDisparity: Math.round(avgDisparity * 100) / 100 }
}

// ──────────── HTTP Router ────────────
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname

    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      })
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }

    try {
      // ────── Health Check ──────
      if (path === '/health') {
        const dbCheck = await prisma.$queryRaw`SELECT 1`
        return new Response(JSON.stringify({
          status: 'healthy',
          service: 'analytics-engine',
          timestamp: new Date().toISOString(),
          database: 'connected',
          version: '1.0.0',
        }), { headers })
      }

      // ────── GET /api/brands ──────
      if (path === '/api/brands') {
        const brands = await prisma.brand.findMany({ include: { _count: { select: { products: true, launches: true } } } })
        return new Response(JSON.stringify(brands), { headers })
      }

      // ────── GET /api/products ──────
      if (path === '/api/products') {
        const products = await prisma.product.findMany({
          include: { brand: true, regionalPrices: true },
        })
        const enriched = products.map(p => {
          const disparity = computeDisparity(p.regionalPrices)
          return { ...p, disparity }
        })
        enriched.sort((a, b) => {
          const aMax = Math.abs(a.disparity?.maxDisparity?.disparityPct || 0)
          const bMax = Math.abs(b.disparity?.maxDisparity?.disparityPct || 0)
          return bMax - aMax
        })
        return new Response(JSON.stringify(enriched), { headers })
      }

      // ────── GET /api/products/:id ──────
      if (path.startsWith('/api/products/') && path.split('/').length === 4) {
        const id = path.split('/')[3]
        const product = await prisma.product.findUnique({
          where: { id },
          include: { brand: true, regionalPrices: true, launches: true },
        })
        if (!product) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers })
        const disparity = computeDisparity(product.regionalPrices)
        return new Response(JSON.stringify({ ...product, disparity }), { headers })
      }

      // ────── GET /api/launches ──────
      if (path === '/api/launches') {
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
          where,
          include: { product: { include: { brand: true } }, brand: true },
          orderBy: { launchDate: 'asc' },
        })
        return new Response(JSON.stringify(launches), { headers })
      }

      // ────── GET /api/launches/calendar ──────
      if (path === '/api/launches/calendar') {
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
        return new Response(JSON.stringify(calendar), { headers })
      }

      // ────── GET /api/disparity/matrix ──────
      if (path === '/api/disparity/matrix') {
        const products = await prisma.product.findMany({
          include: { brand: true, regionalPrices: true },
        })
        const matrix = products.map(p => {
          const disparity = computeDisparity(p.regionalPrices)
          return {
            productId: p.id,
            productName: p.name,
            sku: p.sku,
            category: p.category,
            brand: p.brand.name,
            season: p.season,
            maxDisparityPct: disparity?.maxDisparity?.disparityPct || 0,
            maxDisparityRegion: disparity?.maxDisparity?.region || '',
            avgDisparityPct: disparity?.avgDisparity || 0,
            regionalBreakdown: disparity?.regionalBreakdown || [],
          }
        })
        matrix.sort((a, b) => Math.abs(b.maxDisparityPct) - Math.abs(a.maxDisparityPct))
        return new Response(JSON.stringify(matrix), { headers })
      }

      // ────── GET /api/disparity/telemetry ──────
      if (path === '/api/disparity/telemetry') {
        const products = await prisma.product.findMany({
          include: { brand: true, regionalPrices: true },
        })
        const currencyRates = await prisma.currencyRate.findMany()
        const totalProducts = products.length
        const allDisparities: number[] = []
        const regionAvgDisparity: Record<string, { sum: number; count: number }> = {}
        const brandAvgDisparity: Record<string, { sum: number; count: number }> = {}
        let highDutyProducts = 0
        let limitedStockCount = 0

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
          ? Math.round((allDisparities.reduce((a, b) => a + b, 0) / allDisparities.length) * 100) / 100
          : 0
        const maxDisparityOverall = allDisparities.length > 0
          ? Math.round(Math.max(...allDisparities.map(Math.abs)) * 100) / 100
          : 0
        const regionSummary = Object.entries(regionAvgDisparity).map(([region, data]) => ({
          region,
          avgDisparityPct: Math.round((data.sum / data.count) * 100) / 100,
        }))
        const brandSummary = Object.entries(brandAvgDisparity).map(([brand, data]) => ({
          brand,
          avgDisparityPct: Math.round((data.sum / data.count) * 100) / 100,
        }))

        return new Response(JSON.stringify({
          overview: {
            totalProducts,
            totalBrands: await prisma.brand.count(),
            totalLaunches: await prisma.launch.count(),
            avgDisparityOverall,
            maxDisparityOverall,
            highDutyProducts,
            limitedStockCount,
          },
          currencyRates: currencyRates.map(r => ({ pair: `${r.baseCurrency}/${r.targetCurrency}`, rate: r.rate })),
          regionSummary,
          brandSummary,
        }), { headers })
      }

      // ────── GET /api/lookbooks ──────
      if (path === '/api/lookbooks') {
        const lookbooks = await prisma.lookbookEntry.findMany({
          include: { brand: true },
          orderBy: [{ year: 'desc' }, { season: 'asc' }],
        })
        return new Response(JSON.stringify(lookbooks), { headers })
      }

      // ────── POST /api/scrape/simulate ──────
      if (path === '/api/scrape/simulate' && req.method === 'POST') {
        const body = await req.json().catch(() => ({}))
        await new Promise(resolve => setTimeout(resolve, 200))
        const result = {
          timestamp: new Date().toISOString(),
          scrapeType: body.type || 'full',
          brand: body.brand || 'all',
          status: 'completed',
          itemsScraped: Math.floor(Math.random() * 50) + 10,
          pricesUpdated: Math.floor(Math.random() * 30) + 5,
          launchesDiscovered: Math.floor(Math.random() * 8) + 1,
          nextScheduled: new Date(Date.now() + 3600000).toISOString(),
        }
        return new Response(JSON.stringify(result), { headers })
      }

      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers })

    } catch (error: any) {
      console.error('API Error:', error)
      return new Response(JSON.stringify({ error: 'Internal server error', message: error.message }), { status: 500, headers })
    }
  },
})

console.log(`🚀 Analytics Engine running on port ${PORT}`)
