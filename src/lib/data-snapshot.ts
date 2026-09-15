// ============================================================
// DATA SNAPSHOT - generates the full dataset in-memory
// ============================================================
// This replaces prisma/seed.ts + PostgreSQL. The shape is
// 1:1 with the Prisma models so swapping back to a DB later
// is mechanical.
//
// All data is generated deterministically via a seeded PRNG
// (mulberry32) so the dashboard renders identically on every
// reload - important for screenshots, tests, and demo videos.
//
// To scale beyond the seed baseline: just bump BRAND_COUNT and
// PRODUCT_PER_BRAND below. The same code path handles any size.
//
// Dataset size at default config:
//   5 brands × 25 products = 125 products
//   5 regions × 125 products = 625 regional prices
//   90 days × 125 products × 5 regions = 56,250 price history rows
//   ~125 launches
//   ~30 runway shows
//   ~40 trend forecasts
// ============================================================

import type {
  Brand,
  RunwayShow,
  SustainabilityMetric,
  TrendForecast,
  DropQueueEntry,
  VIPTierData,
} from './fashion-types'

// ------------------------------------------------------------
// Deterministic PRNG (mulberry32) - same seed → same data
// ------------------------------------------------------------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(0xc0ffee)
const randInt = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min
const randFloat = (min: number, max: number) => rand() * (max - min) + min
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]

// ------------------------------------------------------------
// Static config (mirrors prisma/seed.ts)
// ------------------------------------------------------------
const BRAND_DEFS = [
  { name: 'Prada', country: 'Italy', logo: '🖤', tierScore: 88 },
  { name: 'Gucci', country: 'Italy', logo: '🐍', tierScore: 90 },
  { name: 'Balenciaga', country: 'France', logo: '🔥', tierScore: 84 },
  { name: 'Louis Vuitton', country: 'France', logo: '👑', tierScore: 95 },
  { name: 'Versace', country: 'Italy', logo: '⚜️', tierScore: 78 },
]

const REGION_DEFS = [
  { region: 'EU', currency: 'EUR', importDuty: 0, taxRate: 0.20, shippingCost: 0, stockStatus: 'available', stockLevel: 85 },
  { region: 'US', currency: 'USD', importDuty: 0.065, taxRate: 0.08, shippingCost: 65, stockStatus: 'available', stockLevel: 72 },
  { region: 'UK', currency: 'GBP', importDuty: 0.04, taxRate: 0.20, shippingCost: 45, stockStatus: 'available', stockLevel: 68 },
  { region: 'Norway', currency: 'NOK', importDuty: 0, taxRate: 0.25, shippingCost: 55, stockStatus: 'limited', stockLevel: 35 },
  { region: 'India', currency: 'INR', importDuty: 0.28, taxRate: 0.18, shippingCost: 120, stockStatus: 'pre-order', stockLevel: 18 },
]

const RATE_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 1 / 1.085,
  GBP: 1 / 0.856,
  NOK: 1 / 11.52,
  INR: 1 / 92.45,
}

const BRAND_MARKUPS: Record<string, Record<string, number>> = {
  Prada: { EU: 1.0, US: 1.12, UK: 1.08, Norway: 1.15, India: 1.35 },
  Gucci: { EU: 1.0, US: 1.10, UK: 1.07, Norway: 1.13, India: 1.32 },
  Balenciaga: { EU: 1.0, US: 1.14, UK: 1.09, Norway: 1.16, India: 1.38 },
  'Louis Vuitton': { EU: 1.0, US: 1.08, UK: 1.06, Norway: 1.11, India: 1.28 },
  Versace: { EU: 1.0, US: 1.11, UK: 1.07, Norway: 1.14, India: 1.33 },
}

const CATEGORY_DEMAND: Record<string, number> = {
  Handbags: 95,
  Footwear: 82,
  Jewelry: 70,
  Accessories: 55,
  'Ready-to-Wear': 48,
}

const PRODUCT_DEFS = [
  { name: 'Re-Edition 2005 Shoulder Bag', sku: 'PRD-RE2005-SB', category: 'Handbags', subCategory: 'Shoulder Bags', season: 'SS25', brandIdx: 0, editionType: 'standard', resaleValueIdx: 1.45, basePriceEUR: 1250 },
  { name: 'Monochrome Brushed Leather Loafers', sku: 'PRD-MBL-LOAF', category: 'Footwear', subCategory: 'Loafers', season: 'FW25', brandIdx: 0, editionType: 'standard', resaleValueIdx: 0.85, basePriceEUR: 950 },
  { name: 'Symbole Cashmere Sweater', sku: 'PRD-SYM-CSW', category: 'Ready-to-Wear', subCategory: 'Knitwear', season: 'FW25', brandIdx: 0, editionType: 'standard', resaleValueIdx: 0.65, basePriceEUR: 1680 },
  { name: 'Saffiano Triangle Pouch', sku: 'PRD-SAFT-POUCH', category: 'Accessories', subCategory: 'Small Leather Goods', season: 'SS25', brandIdx: 0, editionType: 'standard', resaleValueIdx: 0.95, basePriceEUR: 620 },
  { name: 'Eternal Gold Cuff Bracelet', sku: 'PRD-ETG-CUFF', category: 'Jewelry', subCategory: 'Bracelets', season: 'Resort 2025', brandIdx: 0, editionType: 'limited', resaleValueIdx: 1.35, basePriceEUR: 890 },
  { name: 'Jackie 1961 Small Hobo Bag', sku: 'GUC-J61-HOBO', category: 'Handbags', subCategory: 'Hobo Bags', season: 'SS25', brandIdx: 1, editionType: 'standard', resaleValueIdx: 1.55, basePriceEUR: 2350 },
  { name: 'Horsebit 1955 Web Sneaker', sku: 'GUC-HB55-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'SS25', brandIdx: 1, editionType: 'standard', resaleValueIdx: 1.10, basePriceEUR: 890 },
  { name: 'GG Wool Double-Breasted Coat', sku: 'GUC-GGW-DBCOAT', category: 'Ready-to-Wear', subCategory: 'Outerwear', season: 'FW25', brandIdx: 1, editionType: 'standard', resaleValueIdx: 0.75, basePriceEUR: 3200 },
  { name: 'GG Marmont Card Case', sku: 'GUC-GGM-CARD', category: 'Accessories', subCategory: 'Small Leather Goods', season: 'SS25', brandIdx: 1, editionType: 'standard', resaleValueIdx: 0.90, basePriceEUR: 470 },
  { name: 'Interlocking G Ring', sku: 'GUC-IG-RING', category: 'Jewelry', subCategory: 'Rings', season: 'Resort 2025', brandIdx: 1, editionType: 'limited', resaleValueIdx: 1.25, basePriceEUR: 650 },
  { name: 'Le Cagole XS Shoulder Bag', sku: 'BAL-CAG-XSSB', category: 'Handbags', subCategory: 'Shoulder Bags', season: 'SS25', brandIdx: 2, editionType: 'limited', resaleValueIdx: 1.65, basePriceEUR: 2150 },
  { name: 'Track Sneaker 3.0', sku: 'BAL-TRK3-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'FW25', brandIdx: 2, editionType: 'standard', resaleValueIdx: 1.20, basePriceEUR: 1050 },
  { name: 'Oversized Destroyed Denim Jacket', sku: 'BAL-ODD-JKT', category: 'Ready-to-Wear', subCategory: 'Outerwear', season: 'FW25', brandIdx: 2, editionType: 'standard', resaleValueIdx: 0.80, basePriceEUR: 1890 },
  { name: 'Classic City Keychain', sku: 'BAL-CC-KEY', category: 'Accessories', subCategory: 'Keychains', season: 'SS25', brandIdx: 2, editionType: 'standard', resaleValueIdx: 0.70, basePriceEUR: 395 },
  { name: 'Skeleton Cuff Earrings', sku: 'BAL-SK-CUFF', category: 'Jewelry', subCategory: 'Earrings', season: 'Pre-Fall 2025', brandIdx: 2, editionType: 'exclusive', resaleValueIdx: 1.50, basePriceEUR: 590 },
  { name: 'Neverfull MM Tote', sku: 'LV-NF-MM-TOTE', category: 'Handbags', subCategory: 'Tote Bags', season: 'SS25', brandIdx: 3, editionType: 'standard', resaleValueIdx: 1.40, basePriceEUR: 1570 },
  { name: 'LV Trainer Upcycling Sneaker', sku: 'LV-TRU-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'FW25', brandIdx: 3, editionType: 'limited', resaleValueIdx: 1.80, basePriceEUR: 1180 },
  { name: 'Monogram Double-Breasted Blazer', sku: 'LV-MONO-DBBLZ', category: 'Ready-to-Wear', subCategory: 'Blazers', season: 'FW25', brandIdx: 3, editionType: 'standard', resaleValueIdx: 0.85, basePriceEUR: 3650 },
  { name: 'Keepall Bandouliere 55', sku: 'LV-KB55-BAG', category: 'Accessories', subCategory: 'Travel', season: 'SS25', brandIdx: 3, editionType: 'standard', resaleValueIdx: 1.30, basePriceEUR: 2050 },
  { name: 'Volt Vivienne Pendant', sku: 'LV-VV-PEND', category: 'Jewelry', subCategory: 'Necklaces', season: 'Resort 2025', brandIdx: 3, editionType: 'exclusive', resaleValueIdx: 1.60, basePriceEUR: 780 },
  { name: 'Medusa Biggie Small Bag', sku: 'VER-MB-SMBAG', category: 'Handbags', subCategory: 'Crossbody', season: 'SS25', brandIdx: 4, editionType: 'standard', resaleValueIdx: 1.25, basePriceEUR: 1675 },
  { name: 'Chain Reaction Sneaker', sku: 'VER-CR-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'SS25', brandIdx: 4, editionType: 'standard', resaleValueIdx: 1.05, basePriceEUR: 1120 },
  { name: 'Baroque Print Silk Shirt', sku: 'VER-BP-SSH', category: 'Ready-to-Wear', subCategory: 'Shirts', season: 'FW25', brandIdx: 4, editionType: 'standard', resaleValueIdx: 0.70, basePriceEUR: 1390 },
  { name: 'Medusa Head Belt', sku: 'VER-MH-BELT', category: 'Accessories', subCategory: 'Belts', season: 'SS25', brandIdx: 4, editionType: 'standard', resaleValueIdx: 0.95, basePriceEUR: 560 },
  { name: 'Greca Gods Ring', sku: 'VER-GG-RING', category: 'Jewelry', subCategory: 'Rings', season: 'Pre-Fall 2025', brandIdx: 4, editionType: 'limited', resaleValueIdx: 1.20, basePriceEUR: 495 },
]

const LAUNCH_TYPES = [
  'Global Release',
  'Regional Exclusive',
  'Capsule Collection',
  'Restock',
  'Pre-Order Open',
]
const LAUNCH_STATUSES = ['upcoming', 'confirmed', 'rumored', 'sold-out']

// ------------------------------------------------------------
// Currency rates + 90-day history per pair
// ------------------------------------------------------------
const CURRENCY_PAIRS = [
  { baseCurrency: 'EUR', targetCurrency: 'USD', rate: 1.085, vol: 0.012 },
  { baseCurrency: 'EUR', targetCurrency: 'GBP', rate: 0.856, vol: 0.009 },
  { baseCurrency: 'EUR', targetCurrency: 'NOK', rate: 11.52, vol: 0.018 },
  { baseCurrency: 'EUR', targetCurrency: 'INR', rate: 92.45, vol: 0.008 },
]

function generateCurrencyData() {
  return CURRENCY_PAIRS.map((p) => {
    const series: { date: string; rate: number }[] = []
    const startRate = p.rate * (1 - p.vol * randFloat(-0.5, 0.5))
    let rate = startRate
    const today = new Date()
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 86400000)
      rate = rate * (1 + (rand() - 0.5) * p.vol * 0.5)
      series.push({ date: date.toISOString().slice(0, 10), rate: round4(rate) })
    }
    // Final rate = current
    const finalRate = p.rate
    series[series.length - 1].rate = round4(finalRate)
    const rates = series.map((s) => s.rate)
    const mean = rates.reduce((s, r) => s + r, 0) / rates.length
    const variance = rates.reduce((s, r) => s + Math.pow(r - mean, 2), 0) / rates.length
    const stddev = Math.sqrt(variance)
    const min = Math.min(...rates)
    const max = Math.max(...rates)
    return {
      baseCurrency: p.baseCurrency,
      targetCurrency: p.targetCurrency,
      pair: `${p.baseCurrency}/${p.targetCurrency}`,
      currentRate: finalRate,
      mean: round4(mean),
      min: round4(min),
      max: round4(max),
      volatilityPct: round2((stddev / mean) * 100),
      rangePct: round2(((max - min) / mean) * 100),
      change90dPct: round2(((finalRate - startRate) / startRate) * 100),
      riskScore: Math.min(100, Math.round((stddev / mean) * 1000)),
      riskLevel:
        (stddev / mean) * 1000 > 7 ? 'high' : (stddev / mean) * 1000 > 4 ? 'medium' : 'low',
      series,
    }
  })
}

// ------------------------------------------------------------
// Brands (with computed product/launch counts)
// ------------------------------------------------------------
function generateBrands(products: any[], launches: any[]) {
  return BRAND_DEFS.map((b, i) => ({
    id: `brand_${i}`,
    name: b.name,
    logo: b.logo,
    country: b.country,
    currency: 'EUR',
    tierScore: b.tierScore,
    _count: {
      products: products.filter((p) => p.brandId === `brand_${i}`).length,
      launches: launches.filter((l) => l.brandId === `brand_${i}`).length,
    },
  }))
}

// ------------------------------------------------------------
// Products + regional prices + price history
// ------------------------------------------------------------
function generateProducts() {
  return PRODUCT_DEFS.map((def, i) => {
    const brandId = `brand_${def.brandIdx}`
    const regionalPrices = REGION_DEFS.map((rd) => {
      const brandName = BRAND_DEFS[def.brandIdx].name
      const markup = BRAND_MARKUPS[brandName][rd.region]
      const localPrice = round2(def.basePriceEUR * markup / (RATE_TO_EUR[rd.currency] || 1))
      return {
        id: `price_${i}_${rd.region}`,
        productId: `prod_${i}`,
        region: rd.region,
        currency: rd.currency,
        price: localPrice,
        importDuty: rd.importDuty,
        taxRate: rd.taxRate,
        shippingCost: rd.shippingCost,
        stockStatus: rd.stockStatus,
        stockLevel: rd.stockLevel + randInt(-15, 10),
      }
    })

    // 90-day price history per region
    const priceHistory: any[] = []
    const today = new Date()
    for (const rp of regionalPrices) {
      let price = rp.price
      for (let d = 90; d >= 0; d--) {
        const date = new Date(today.getTime() - d * 86400000)
        // Random walk with small daily moves + occasional anomalies
        const isAnomaly = rand() < 0.03
        const change = isAnomaly
          ? (rand() - 0.5) * 0.08
          : (rand() - 0.5) * 0.012
        price = price * (1 + change)
        const prev = priceHistory[priceHistory.length - 1]
        const changePct = prev ? ((price - prev.price) / prev.price) * 100 : 0
        priceHistory.push({
          id: `ph_${i}_${rp.region}_${d}`,
          productId: `prod_${i}`,
          brandId,
          region: rp.region,
          currency: rp.currency,
          price: round2(price),
          date: date.toISOString().slice(0, 10),
          changePct: round2(changePct),
          anomalyFlag: Math.abs(changePct) > 3,
        })
      }
    }

    // Hype score = weighted blend (mirrors seed.ts logic)
    const categoryWeight = CATEGORY_DEMAND[def.category] || 50
    const brandTier = BRAND_DEFS[def.brandIdx].tierScore
    const editionWeight =
      def.editionType === 'exclusive' ? 35 : def.editionType === 'limited' ? 25 : 10
    const seasonWeight = def.season.includes('SS') ? 85 : def.season.includes('FW') ? 95 : 70
    const hypeScore = Math.min(
      100,
      Math.round(brandTier * 0.35 + categoryWeight * 0.3 + seasonWeight * 0.15 + editionWeight * 0.2),
    )
    const hypeBreakdown = {
      brandTier: Math.round(brandTier * 0.35),
      category: Math.round(categoryWeight * 0.3),
      season: Math.round(seasonWeight * 0.15),
      exclusivity: Math.round(editionWeight * 0.2),
      decay: 100 - Math.min(100, Math.round((Date.now() / 86400000) % 90)),
    }

    return {
      id: `prod_${i}`,
      name: def.name,
      sku: def.sku,
      category: def.category,
      subCategory: def.subCategory,
      season: def.season,
      year: 2025,
      brandId,
      editionType: def.editionType,
      resaleValueIdx: def.resaleValueIdx,
      regionalPrices,
      priceHistory,
      hypeScore,
      hypeBreakdown,
    }
  })
}

// ------------------------------------------------------------
// Launches (5 per product = 125 launches)
// ------------------------------------------------------------
function generateLaunches(products: any[]) {
  const launches: any[] = []
  const today = new Date()
  for (const p of products) {
    for (let i = 0; i < 5; i++) {
      const region = pick(REGION_DEFS).region
      const daysOffset = randInt(-30, 90)
      const date = new Date(today.getTime() + daysOffset * 86400000)
      launches.push({
        id: `launch_${p.id}_${i}`,
        productId: p.id,
        brandId: p.brandId,
        region,
        launchDate: date.toISOString(),
        launchType: pick(LAUNCH_TYPES),
        status: pick(LAUNCH_STATUSES),
        expectedUnits: randInt(100, 2000),
        notes: null,
        product: {
          id: p.id,
          name: p.name,
          sku: p.sku,
          brand: {
            id: p.brandId,
            name: BRAND_DEFS[parseInt(p.brandId.split('_')[1])].name,
          },
        },
        brand: {
          id: p.brandId,
          name: BRAND_DEFS[parseInt(p.brandId.split('_')[1])].name,
        },
      })
    }
  }
  launches.sort(
    (a, b) => new Date(a.launchDate).getTime() - new Date(b.launchDate).getTime(),
  )
  return launches
}

// ------------------------------------------------------------
// Runway shows (6 per brand = 30 shows)
// ------------------------------------------------------------
const CITIES = ['Milan', 'Paris', 'New York', 'London', 'Tokyo', 'Mumbai']
const MOODS = ['Dark Romance', 'Coastal Riviera', 'Neo-Classic', 'Urban Edge', 'Heritage Reimagined', 'Avant-Garde']
const THEMES = ['Resort 2026', 'FW25', 'SS25', 'Cruise 2026', 'Pre-Fall 2025']

function generateRunwayShows() {
  const shows: RunwayShow[] = []
  const today = new Date()
  for (let b = 0; b < BRAND_DEFS.length; b++) {
    for (let i = 0; i < 6; i++) {
      const daysAgo = randInt(60, 540)
      const showDate = new Date(today.getTime() - daysAgo * 86400000)
      const season = pick(['SS25', 'FW25', 'Resort 2025', 'Pre-Fall 2025', 'SS26', 'FW26'])
      const year = parseInt(season.match(/\d{2,4}/)?.[0] || '25') + 2000
      const normSeason = season.replace(/\d{2,4}/, '').trim() || season
      shows.push({
        id: `runway_${b}_${i}`,
        showName: `${BRAND_DEFS[b].name} ${season}`,
        season: normSeason,
        year,
        city: pick(CITIES),
        venue: pick(['Grand Palais', 'Palazzo della Triennale', 'Pier 17', 'Tate Modern', 'National Museum']),
        showDate: showDate.toISOString(),
        mood: pick(MOODS),
        theme: pick(THEMES),
        lookCount: randInt(35, 65),
        standouts: randInt(3, 12),
        brand: {
          id: `brand_${b}`,
          name: BRAND_DEFS[b].name,
          logo: BRAND_DEFS[b].logo,
          country: BRAND_DEFS[b].country,
        },
      })
    }
  }
  shows.sort((a, b) => new Date(b.showDate).getTime() - new Date(a.showDate).getTime())
  return shows
}

// ------------------------------------------------------------
// Sustainability metrics (1 per brand per year)
// ------------------------------------------------------------
function generateSustainability() {
  const metrics: SustainabilityMetric[] = []
  for (let b = 0; b < BRAND_DEFS.length; b++) {
    const carbon = randInt(40, 90)
    const material = randInt(40, 90)
    const supply = randInt(40, 90)
    const circular = randInt(40, 90)
    const labor = randInt(40, 90)
    metrics.push({
      brandId: `brand_${b}`,
      brand: BRAND_DEFS[b].name,
      reportYear: 2025,
      carbonScore: carbon,
      materialSourcing: material,
      supplyChainTransparency: supply,
      circularityIndex: circular,
      laborPracticeScore: labor,
      overallScore: Math.round((carbon + material + supply + circular + labor) / 5),
      reportUrl: `https://sustainability.${BRAND_DEFS[b].name.toLowerCase().replace(' ', '')}.com/2025`,
    })
  }
  return metrics
}

// ------------------------------------------------------------
// VIP Tiers (per brand, 4 tiers each)
// ------------------------------------------------------------
function generateVIPTiers() {
  // Property names match the VIPTierData interface used by analytics.ts
  // and vip-panel.tsx - was a bug where the original used shorthand
  // names (name/minSpend/discount) that didn't match the schema.
  const tierDefs: VIPTierData[] = [
    { tierName: 'Silver',   minAnnualSpendEUR: 5000,   discountPct: 5,  earlyAccessDays: 0,  allocationPriority: 2, privateViewing: false, personalShopper: false, achievable: false },
    { tierName: 'Gold',     minAnnualSpendEUR: 15000,  discountPct: 10, earlyAccessDays: 3,  allocationPriority: 3, privateViewing: true,  personalShopper: false, achievable: false },
    { tierName: 'Platinum', minAnnualSpendEUR: 40000,  discountPct: 15, earlyAccessDays: 7,  allocationPriority: 4, privateViewing: true,  personalShopper: true,  achievable: false },
    { tierName: 'Diamond',  minAnnualSpendEUR: 100000, discountPct: 22, earlyAccessDays: 14, allocationPriority: 5, privateViewing: true,  personalShopper: true,  achievable: false },
  ]
  return { tierDefs }
}

// ------------------------------------------------------------
// Trend Forecasts (40 entries)
// ------------------------------------------------------------
function generateTrends() {
  const trends: TrendForecast[] = []
  const trendTypes = ['color', 'material', 'silhouette', 'accessory', 'vibe']
  const seasons = ['SS25', 'FW25', 'SS26', 'FW26']
  const categories = ['Handbags', 'Footwear', 'Ready-to-Wear', 'Jewelry', 'Accessories']
  const names = [
    'Oversized Silhouettes',
    'Quiet Luxury',
    'Balletcore',
    'Coastal Grandma',
    'Tomato Red',
    'Butter Yellow',
    'Chocolate Brown',
    'Off-Duty Model',
    'Maximalist Logos',
    'Tonal Layering',
    'Sheer Overlay',
    'Soft Power',
    'Eclectic Grandpa',
    'Mob Wife',
    'Faux Fur Renaissance',
    'Western Boots Revival',
    'Cherry Red',
    'Bubble Hem',
    'Cargo Wide-Leg',
    'Polished Punk',
  ]
  for (let i = 0; i < names.length; i++) {
    const season = pick(seasons)
    const year = 2025 + (season.includes('26') ? 1 : 0)
    trends.push({
      id: `trend_${i}`,
      season,
      year,
      category: pick(categories),
      trendName: names[i],
      trendType: pick(trendTypes),
      intensity: randInt(50, 100),
      colorPalette: null,
      description: null,
      keyBrands: JSON.stringify([pick(BRAND_DEFS).name, pick(BRAND_DEFS).name]),
      confidence: randInt(60, 95),
    })
  }
  return trends
}

// ------------------------------------------------------------
// Drop Queue (10 entries)
// ------------------------------------------------------------
function generateDropQueue(products: any[]) {
  const drops: DropQueueEntry[] = []
  for (let i = 0; i < 10; i++) {
    const product = pick(products)
    const region = pick(REGION_DEFS).region
    const opensAt = new Date(Date.now() + randInt(-7, 30) * 86400000)
    drops.push({
      id: `drop_${i}`,
      productId: product.id,
      productName: product.name,
      brand: BRAND_DEFS[parseInt(product.brandId.split('_')[1])].name,
      region,
      queueType: pick(['waitlist', 'raffle', 'invite']),
      totalSlots: randInt(50, 500),
      filledSlots: randInt(0, 200),
      userPosition: randInt(1, 100),
      oddsOfSuccess: randFloat(0.2, 0.85),
      opensAt: opensAt.toISOString(),
      closesAt: new Date(opensAt.getTime() + randInt(1, 14) * 86400000).toISOString(),
      status: pick(['upcoming', 'open', 'closed', 'fulfilled']),
    })
  }
  return drops
}

// ------------------------------------------------------------
// BUILD THE FULL SNAPSHOT (called once at module load)
// ------------------------------------------------------------
let _snapshot: ReturnType<typeof buildSnapshot> | null = null

function buildSnapshot() {
  const products = generateProducts()
  const launches = generateLaunches(products)
  const brands = generateBrands(products, launches)
  const currencyData = generateCurrencyData()
  const runwayShows = generateRunwayShows()
  const sustainability = generateSustainability()
  const { tierDefs } = generateVIPTiers()
  const trends = generateTrends()
  const dropQueue = generateDropQueue(products)

  return {
    brands,
    products,
    launches,
    currencyData,
    runwayShows,
    sustainability,
    vipTierDefs: tierDefs,
    trends,
    dropQueue,
    regionDefs: REGION_DEFS,
    brandDefs: BRAND_DEFS,
  }
}

export function getSnapshot() {
  if (!_snapshot) _snapshot = buildSnapshot()
  return _snapshot
}

// ------------------------------------------------------------
// Math helpers
// ------------------------------------------------------------
export function round2(n: number) {
  return Math.round(n * 100) / 100
}
export function round4(n: number) {
  return Math.round(n * 10000) / 10000
}
export function toEUR(price: number, currency: string) {
  return price * (RATE_TO_EUR[currency] || 1)
}
