import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const BRANDS = [
  { name: 'Prada', country: 'Italy', currency: 'EUR', logo: '🖤', tierScore: 88 },
  { name: 'Gucci', country: 'Italy', currency: 'EUR', logo: '🐍', tierScore: 90 },
  { name: 'Balenciaga', country: 'France', currency: 'EUR', logo: '🔥', tierScore: 84 },
  { name: 'Louis Vuitton', country: 'France', currency: 'EUR', logo: '👑', tierScore: 95 },
  { name: 'Versace', country: 'Italy', currency: 'EUR', logo: '⚜️', tierScore: 78 },
]

const REGIONS = [
  { region: 'EU', currency: 'EUR', importDuty: 0, taxRate: 0.20, shippingCost: 0, stockStatus: 'available', stockLevel: 85 },
  { region: 'US', currency: 'USD', importDuty: 0.065, taxRate: 0.08, shippingCost: 65, stockStatus: 'available', stockLevel: 72 },
  { region: 'UK', currency: 'GBP', importDuty: 0.04, taxRate: 0.20, shippingCost: 45, stockStatus: 'available', stockLevel: 68 },
  { region: 'Norway', currency: 'NOK', importDuty: 0, taxRate: 0.25, shippingCost: 55, stockStatus: 'limited', stockLevel: 35 },
  { region: 'India', currency: 'INR', importDuty: 0.28, taxRate: 0.18, shippingCost: 120, stockStatus: 'pre-order', stockLevel: 18 },
]

const PRODUCTS = [
  { name: 'Re-Edition 2005 Shoulder Bag', sku: 'PRD-RE2005-SB', category: 'Handbags', subCategory: 'Shoulder Bags', season: 'SS25', year: 2025, brandIdx: 0, editionType: 'standard', resaleValueIdx: 1.45 },
  { name: 'Monochrome Brushed Leather Loafers', sku: 'PRD-MBL-LOAF', category: 'Footwear', subCategory: 'Loafers', season: 'FW25', year: 2025, brandIdx: 0, editionType: 'standard', resaleValueIdx: 0.85 },
  { name: 'Symbole Cashmere Sweater', sku: 'PRD-SYM-CSW', category: 'Ready-to-Wear', subCategory: 'Knitwear', season: 'FW25', year: 2025, brandIdx: 0, editionType: 'standard', resaleValueIdx: 0.65 },
  { name: 'Saffiano Triangle Pouch', sku: 'PRD-SAFT-POUCH', category: 'Accessories', subCategory: 'Small Leather Goods', season: 'SS25', year: 2025, brandIdx: 0, editionType: 'standard', resaleValueIdx: 0.95 },
  { name: 'Eternal Gold Cuff Bracelet', sku: 'PRD-ETG-CUFF', category: 'Jewelry', subCategory: 'Bracelets', season: 'Resort 2025', year: 2025, brandIdx: 0, editionType: 'limited', resaleValueIdx: 1.35 },
  { name: 'Jackie 1961 Small Hobo Bag', sku: 'GUC-J61-HOBO', category: 'Handbags', subCategory: 'Hobo Bags', season: 'SS25', year: 2025, brandIdx: 1, editionType: 'standard', resaleValueIdx: 1.55 },
  { name: 'Horsebit 1955 Web Sneaker', sku: 'GUC-HB55-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'SS25', year: 2025, brandIdx: 1, editionType: 'standard', resaleValueIdx: 1.10 },
  { name: 'GG Wool Double-Breasted Coat', sku: 'GUC-GGW-DBCOAT', category: 'Ready-to-Wear', subCategory: 'Outerwear', season: 'FW25', year: 2025, brandIdx: 1, editionType: 'standard', resaleValueIdx: 0.75 },
  { name: 'GG Marmont Card Case', sku: 'GUC-GGM-CARD', category: 'Accessories', subCategory: 'Small Leather Goods', season: 'SS25', year: 2025, brandIdx: 1, editionType: 'standard', resaleValueIdx: 0.90 },
  { name: 'Interlocking G Ring', sku: 'GUC-IG-RING', category: 'Jewelry', subCategory: 'Rings', season: 'Resort 2025', year: 2025, brandIdx: 1, editionType: 'limited', resaleValueIdx: 1.25 },
  { name: 'Le Cagole XS Shoulder Bag', sku: 'BAL-CAG-XSSB', category: 'Handbags', subCategory: 'Shoulder Bags', season: 'SS25', year: 2025, brandIdx: 2, editionType: 'limited', resaleValueIdx: 1.65 },
  { name: 'Track Sneaker 3.0', sku: 'BAL-TRK3-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'FW25', year: 2025, brandIdx: 2, editionType: 'standard', resaleValueIdx: 1.20 },
  { name: 'Oversized Destroyed Denim Jacket', sku: 'BAL-ODD-JKT', category: 'Ready-to-Wear', subCategory: 'Outerwear', season: 'FW25', year: 2025, brandIdx: 2, editionType: 'standard', resaleValueIdx: 0.80 },
  { name: 'Classic City Keychain', sku: 'BAL-CC-KEY', category: 'Accessories', subCategory: 'Keychains', season: 'SS25', year: 2025, brandIdx: 2, editionType: 'standard', resaleValueIdx: 0.70 },
  { name: 'Skeleton Cuff Earrings', sku: 'BAL-SK-CUFF', category: 'Jewelry', subCategory: 'Earrings', season: 'Pre-Fall 2025', year: 2025, brandIdx: 2, editionType: 'exclusive', resaleValueIdx: 1.50 },
  { name: 'Neverfull MM Tote', sku: 'LV-NF-MM-TOTE', category: 'Handbags', subCategory: 'Tote Bags', season: 'SS25', year: 2025, brandIdx: 3, editionType: 'standard', resaleValueIdx: 1.40 },
  { name: 'LV Trainer Upcycling Sneaker', sku: 'LV-TRU-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'FW25', year: 2025, brandIdx: 3, editionType: 'limited', resaleValueIdx: 1.80 },
  { name: 'Monogram Double-Breasted Blazer', sku: 'LV-MONO-DBBLZ', category: 'Ready-to-Wear', subCategory: 'Blazers', season: 'FW25', year: 2025, brandIdx: 3, editionType: 'standard', resaleValueIdx: 0.85 },
  { name: 'Keepall Bandouliere 55', sku: 'LV-KB55-BAG', category: 'Accessories', subCategory: 'Travel', season: 'SS25', year: 2025, brandIdx: 3, editionType: 'standard', resaleValueIdx: 1.30 },
  { name: 'Volt Vivienne Pendant', sku: 'LV-VV-PEND', category: 'Jewelry', subCategory: 'Necklaces', season: 'Resort 2025', year: 2025, brandIdx: 3, editionType: 'exclusive', resaleValueIdx: 1.60 },
  { name: 'Medusa Biggie Small Bag', sku: 'VER-MB-SMBAG', category: 'Handbags', subCategory: 'Crossbody', season: 'SS25', year: 2025, brandIdx: 4, editionType: 'standard', resaleValueIdx: 1.25 },
  { name: 'Chain Reaction Sneaker', sku: 'VER-CR-SNK', category: 'Footwear', subCategory: 'Sneakers', season: 'SS25', year: 2025, brandIdx: 4, editionType: 'standard', resaleValueIdx: 1.05 },
  { name: 'Baroque Print Silk Shirt', sku: 'VER-BP-SSH', category: 'Ready-to-Wear', subCategory: 'Shirts', season: 'FW25', year: 2025, brandIdx: 4, editionType: 'standard', resaleValueIdx: 0.70 },
  { name: 'Medusa Head Belt', sku: 'VER-MH-BELT', category: 'Accessories', subCategory: 'Belts', season: 'SS25', year: 2025, brandIdx: 4, editionType: 'standard', resaleValueIdx: 0.95 },
  { name: 'Greca Gods Ring', sku: 'VER-GG-RING', category: 'Jewelry', subCategory: 'Rings', season: 'Pre-Fall 2025', year: 2025, brandIdx: 4, editionType: 'limited', resaleValueIdx: 1.20 },
]

const BASE_PRICES_EUR: Record<string, number> = {
  'PRD-RE2005-SB': 1250, 'PRD-MBL-LOAF': 950, 'PRD-SYM-CSW': 1680, 'PRD-SAFT-POUCH': 620, 'PRD-ETG-CUFF': 890,
  'GUC-J61-HOBO': 2350, 'GUC-HB55-SNK': 890, 'GUC-GGW-DBCOAT': 3200, 'GUC-GGM-CARD': 470, 'GUC-IG-RING': 650,
  'BAL-CAG-XSSB': 2150, 'BAL-TRK3-SNK': 1050, 'BAL-ODD-JKT': 1890, 'BAL-CC-KEY': 395, 'BAL-SK-CUFF': 590,
  'LV-NF-MM-TOTE': 1570, 'LV-TRU-SNK': 1180, 'LV-MONO-DBBLZ': 3650, 'LV-KB55-BAG': 2050, 'LV-VV-PEND': 780,
  'VER-MB-SMBAG': 1675, 'VER-CR-SNK': 1120, 'VER-BP-SSH': 1390, 'VER-MH-BELT': 560, 'VER-GG-RING': 495,
}

const CURRENCY_RATES = [
  { baseCurrency: 'EUR', targetCurrency: 'USD', rate: 1.085 },
  { baseCurrency: 'EUR', targetCurrency: 'GBP', rate: 0.856 },
  { baseCurrency: 'EUR', targetCurrency: 'NOK', rate: 11.52 },
  { baseCurrency: 'EUR', targetCurrency: 'INR', rate: 92.45 },
  { baseCurrency: 'EUR', targetCurrency: 'EUR', rate: 1.0 },
]

const BRAND_MARKUPS: Record<string, Record<string, number>> = {
  'Prada':         { EU: 1.0, US: 1.12, UK: 1.08, Norway: 1.15, India: 1.35 },
  'Gucci':         { EU: 1.0, US: 1.10, UK: 1.07, Norway: 1.13, India: 1.32 },
  'Balenciaga':    { EU: 1.0, US: 1.14, UK: 1.09, Norway: 1.16, India: 1.38 },
  'Louis Vuitton': { EU: 1.0, US: 1.08, UK: 1.06, Norway: 1.11, India: 1.28 },
  'Versace':       { EU: 1.0, US: 1.11, UK: 1.07, Norway: 1.14, India: 1.33 },
}

const LAUNCH_TYPES = ['Global Release', 'Regional Exclusive', 'Capsule Collection', 'Restock', 'Pre-Order Open']
const LAUNCH_STATUSES = ['upcoming', 'confirmed', 'rumored', 'sold-out']

// Category demand multipliers (Handbags and Sneakers hype higher than RTW)
const CATEGORY_DEMAND: Record<string, number> = {
  'Handbags': 95, 'Footwear': 82, 'Jewelry': 70, 'Accessories': 55, 'Ready-to-Wear': 48,
}

// Season timing multipliers (SS = high, FW = peak, Resort/Pre-Fall = mid)
const SEASON_TIMING: Record<string, number> = {
  'SS25': 88, 'FW25': 92, 'Resort 2025': 65, 'Pre-Fall 2025': 60,
}

// Edition type exclusivity weights
const EDITION_WEIGHTS: Record<string, number> = {
  'standard': 50, 'limited': 85, 'exclusive': 98,
}

// ────── Helpers ──────
function rand(min: number, max: number) { return Math.random() * (max - min) + min }
function randInt(min: number, max: number) { return Math.floor(rand(min, max + 1)) }
function round2(n: number) { return Math.round(n * 100) / 100 }

// Seeded random for deterministic price history
function seededRand(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

async function main() {
  console.log('🌱 Seeding database (expanded v3)...')

  // ────── Currency Rates ──────
  const rateRecords = []
for (const rate of CURRENCY_RATES) {
    let r = await prisma.currencyRate.findFirst({
      where: { baseCurrency: rate.baseCurrency, targetCurrency: rate.targetCurrency }
    });

    if (!r) {
      r = await prisma.currencyRate.create({
        data: { baseCurrency: rate.baseCurrency, targetCurrency: rate.targetCurrency, rate: rate.rate }
      });
    }

    rateRecords.push({ ...r, baseRate: rate.rate });
  }
  console.log('✅ Currency rates seeded')

  // ────── Currency History (90 days) ──────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let fxCount = 0
  for (const rate of rateRecords) {
    if (rate.targetCurrency === 'EUR') continue
    let currentRate = rate.baseRate
    for (let d = 90; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(date.getDate() - d)
      // Random walk with mean reversion
      const drift = (rate.baseRate - currentRate) * 0.05
      const noise = (seededRand(d * 7 + rate.targetCurrency.charCodeAt(0)) - 0.5) * rate.baseRate * 0.015
      currentRate = currentRate + drift + noise
      await prisma.currencyHistory.create({
        data: { currencyRateId: rate.id, date, rate: round2(currentRate) }
      })
      fxCount++
    }
  }
  console.log(`✅ ${fxCount} currency history points seeded (90 days × 4 pairs)`)

  // ────── Brands ──────
const brandRecords = []
for (const brand of BRANDS) {
  let record = await prisma.brand.findFirst({
    where: { name: brand.name }
  })

  if (!record) {
    record = await prisma.brand.create({ data: brand })
  }
  brandRecords.push(record)
}
  console.log('✅ Brands seeded')

  // ────── Products + Regional Prices ──────
const productRecords = []
for (const prod of PRODUCTS) {
  const brand = brandRecords[prod.brandIdx]
  const basePriceEUR = BASE_PRICES_EUR[prod.sku]
  const brandMarkups = BRAND_MARKUPS[brand.name]

  let product = await prisma.product.findFirst({
    where: { sku: prod.sku }
  })

  if (!product) {
    product = await prisma.product.create({
      data: {
        name: prod.name, sku: prod.sku, category: prod.category, subCategory: prod.subCategory || null,
        season: prod.season, year: prod.year, brandID: brand.id,
        editionType: prod.editionType, resaleValueIdx: prod.resaleValueIdx,
      },
    })
  }
  productRecords.push({ ...product, basePriceEUR, brandName: brand.name })

  for (const reg of REGIONS) {
    const markup = brandMarkups[reg.region] || 1.0
    const currencyRate = CURRENCY_RATES.find(r => r.targetCurrency === reg.currency)
    const convertedPrice = basePriceEUR * markup * (currencyRate?.rate || 1)
    const finalPrice = Math.round(convertedPrice * 100) / 100

    const stockLevel = Math.max(0, Math.min(100, reg.stockLevel + randInt(-15, 15)))

    const existingPrice = await prisma.regionalPrice.findFirst({
      where: { productId: product.id, region: reg.region }
    })

    if (!existingPrice) {
      await prisma.regionalPrice.create({
        data: {
          productId: product.id, region: reg.region, currency: reg.currency,
          price: finalPrice, importDuty: reg.importDuty, taxRate: reg.taxRate,
          shippingCost: reg.shippingCost, 
          stockLevel: stockLevel, 
          stockStatus: stockLevel < 25 ? 'pre-order' : 'in-stock'
        }
      })
    }
  }
}
console.log('✅ Products & regional prices seeded')

// ────── Price History (90 days × all products × 5 regions) ──────
  console.log('⏳ Generating price history batch...')
  const historyBatch = []
  for (const product of productRecords) {
    for (const reg of REGIONS) {
      const markup = BRAND_MARKUPS[product.brandName][reg.region] || 1.0
      const currencyRate = CURRENCY_RATES.find(r => r.targetCurrency === reg.currency)
      const finalBasePrice = product.basePriceEUR * markup * (currencyRate?.rate || 1)

      let prevPrice = finalBasePrice * 0.92
      for (let d = 90; d >= 0; d--) {
        const date = new Date(today)
        date.setDate(date.getDate() - d)
        const targetPrice = finalBasePrice * (1 + (90 - d) * 0.0005)
        const drift = (targetPrice - prevPrice) * 0.1
        const noise = (seededRand(d * 13 + product.sku.charCodeAt(0) + reg.region.charCodeAt(0)) - 0.5) * finalBasePrice * 0.012
        const newPrice = Math.max(prevPrice * 0.85, prevPrice + drift + noise)
        const changePct = round2(((newPrice - prevPrice) / prevPrice) * 100)
        
        historyBatch.push({
          productId: product.id, brandId: product.brandId,
          region: reg.region, currency: reg.currency,
          price: round2(newPrice), date, changePct, 
          anomalyFlag: Math.abs(changePct) > 3
        })
        prevPrice = newPrice
      }
    }
  }

  await prisma.priceHistory.createMany({ data: historyBatch, skipDuplicates: true })
  console.log(`✅ ${historyBatch.length} price history points seeded`)

  // ────── Launches ──────
  const now = new Date()
  let launchCounter = 0
  for (const product of productRecords) {
    const numRegions = randInt(1, 3)
    const selectedRegions = REGIONS.slice(0, numRegions)
    for (const reg of selectedRegions) {
      const daysOffset = randInt(-30, 90)
      const launchDate = new Date(now)
      launchDate.setDate(launchDate.getDate() + daysOffset)
      const launchType = LAUNCH_TYPES[randInt(0, LAUNCH_TYPES.length - 1)]
      let status: string
      if (daysOffset < 0) status = 'confirmed'
      else if (daysOffset < 7) status = Math.random() > 0.3 ? 'confirmed' : 'rumored'
      else status = Math.random() > 0.5 ? 'upcoming' : 'rumored'
      if (daysOffset < -7 && Math.random() > 0.7) status = 'sold-out'
      await prisma.launch.create({
        data: {
          productId: product.id, brandId: product.brandId, region: reg.region,
          launchDate, launchType, status,
          expectedUnits: randInt(100, 2000),
          notes: launchCounter % 5 === 0 ? 'Limited edition - expected high demand' : null,
        },
      })
      launchCounter++
    }
  }
  console.log(`✅ ${launchCounter} launch events seeded`)

  // ────── Hype Factors (ML-style scoring) ──────
  let hypeCount = 0
  for (const product of productRecords) {
    const brand = brandRecords.find(b => b.id === product.brandId)!
    const categoryDemand = CATEGORY_DEMAND[product.category] || 50
    const seasonTiming = SEASON_TIMING[product.season] || 70
    const editionWeight = EDITION_WEIGHTS[product.editionType] || 50
    const brandTier = brand.tierScore

    // Find earliest upcoming launch for decay calculation
    const upcomingLaunch = await prisma.launch.findFirst({
      where: { productId: product.id, launchDate: { gte: now } },
      orderBy: { launchDate: 'asc' },
    })

    let decayWeight: number
    if (upcomingLaunch) {
      const daysToLaunch = Math.ceil((upcomingLaunch.launchDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      // Hype peaks ~7 days before launch, decays after
      if (daysToLaunch <= 0) decayWeight = 40
      else if (daysToLaunch <= 7) decayWeight = 95 - (7 - daysToLaunch) * 2
      else if (daysToLaunch <= 30) decayWeight = 75 - (daysToLaunch - 7) * 1.2
      else decayWeight = Math.max(20, 50 - (daysToLaunch - 30) * 0.4)
    } else {
      decayWeight = 35 // no upcoming launch
    }

    // Weighted hype score (0-100)
    const hypeScore = Math.round(
      brandTier * 0.20 +
      categoryDemand * 0.30 +
      seasonTiming * 0.15 +
      editionWeight * 0.20 +
      decayWeight * 0.15
    )

    await prisma.hypeFactor.create({
      data: {
        productId: product.id, brandId: product.brandId,
        hypeScore,
        brandTierWeight: round2(brandTier * 0.20),
        categoryWeight: round2(categoryDemand * 0.30),
        seasonWeight: round2(seasonTiming * 0.15),
        exclusivityWeight: round2(editionWeight * 0.20),
        decayWeight: round2(decayWeight * 0.15),
      },
    })
    hypeCount++
  }
  console.log(`✅ ${hypeCount} hype factor scores seeded`)

  // ────── Lookbook Entries ──────
  const lookbookThemes = ['Minimalist Luxe', 'Urban Safari', 'Dark Romance', 'Coastal Riviera', 'Art Deco Revival', 'Neo-Baroque', 'Scandinavian Noir', 'Tokyo Neon']
  let lbCount = 0
  for (const brand of brandRecords) {
    for (const season of ['SS25', 'FW25']) {
      const theme = lookbookThemes[lbCount % lookbookThemes.length]
      await prisma.lookbookEntry.create({
        data: {
          brandId: brand.id, season, year: 2025,
          title: `${brand.name} ${season} Collection — "${theme}"`,
          description: `An evocative exploration of ${theme.toLowerCase()} through the lens of ${brand.name}. This collection redefines contemporary luxury with bold silhouettes and exquisite craftsmanship, drawing inspiration from global cultural movements and artisanal traditions.`,
          theme,
        },
      })
      lbCount++
    }
  }
  console.log('✅ Lookbook entries seeded')

  // ────── Sample Alerts ──────
  const sampleAlerts = [
    { alertType: 'price_drop', message: 'Balenciaga Le Cagole XS dropped 4.2% in India region', severity: 'info' },
    { alertType: 'launch_reminder', message: 'Gucci Jackie 1961 Hobo launches in US in 3 days', severity: 'warning' },
    { alertType: 'stock_change', message: 'LV Trainer Sneaker stock critical in Norway (12% remaining)', severity: 'critical' },
    { alertType: 'arbitrage', message: 'Arbitrage opportunity: Prada Re-Edition 2005 — buy EU, ship to India saves €340', severity: 'info' },
  ]
  for (const alert of sampleAlerts) {
    await prisma.alert.create({
      data: {
        ...alert,
        productId: productRecords[randInt(0, productRecords.length - 1)].id,
        brandId: brandRecords[randInt(0, brandRecords.length - 1)].id,
        region: REGIONS[randInt(0, REGIONS.length - 1)].region,
      },
    })
  }
  console.log('✅ Sample alerts seeded')

  // ══════════════════════════════════════════════════
  // v3.0 New feature seed data
  // ══════════════════════════════════════════════════

  // ────── FEATURE 11: Runway Shows ──────
  const RUNWAY_DATA = [
    { brandIdx: 0, showName: 'Prada SS25 Womenswear', season: 'SS25', year: 2025, city: 'Milan', venue: 'Fondazione Prada', mood: 'Fluid Metamorphosis', theme: 'Ethereal Utility', lookCount: 52, standouts: 6 },
    { brandIdx: 0, showName: 'Prada FW25 Menswear', season: 'FW25', year: 2025, city: 'Milan', venue: 'Deposito dell\'Arte', mood: 'Dark Introspection', theme: 'Shadow Tailoring', lookCount: 45, standouts: 5 },
    { brandIdx: 1, showName: 'Gucci SS25 Womenswear', season: 'SS25', year: 2025, city: 'Milan', venue: 'Palazzo Mezzanotte', mood: 'Coastal Riviera', theme: 'Mediterranean Glamour', lookCount: 68, standouts: 8 },
    { brandIdx: 1, showName: 'Gucci FW25 Menswear', season: 'FW25', year: 2025, city: 'Milan', venue: 'Gucci Hub', mood: 'Urban Safari', theme: 'Nomadic Luxury', lookCount: 55, standouts: 7 },
    { brandIdx: 2, showName: 'Balenciaga SS25', season: 'SS25', year: 2025, city: 'Paris', venue: 'Le Bourget', mood: 'Post-Apocalyptic Chic', theme: 'Deconstructed Future', lookCount: 42, standouts: 5 },
    { brandIdx: 2, showName: 'Balenciaga FW25', season: 'FW25', year: 2025, city: 'Paris', venue: 'Hôtel de Crillon', mood: 'Neo-Bourgeois', theme: 'Subversive Elegance', lookCount: 48, standouts: 6 },
    { brandIdx: 3, showName: 'Louis Vuitton SS25 Womenswear', season: 'SS25', year: 2025, city: 'Paris', venue: 'Cour Carrée du Louvre', mood: 'Botanical Reverie', theme: 'Garden of Delights', lookCount: 62, standouts: 7 },
    { brandIdx: 3, showName: 'Louis Vuitton FW25 Menswear', season: 'FW25', year: 2025, city: 'Paris', venue: 'Pont Neuf', mood: 'Art Deco Revival', theme: 'Golden Age Modernism', lookCount: 58, standouts: 6 },
    { brandIdx: 4, showName: 'Versace SS25', season: 'SS25', year: 2025, city: 'Milan', venue: 'Palazzo Versace', mood: 'Baroque Excess', theme: 'Medusa Reimagined', lookCount: 50, standouts: 5 },
    { brandIdx: 4, showName: 'Versace FW25', season: 'FW25', year: 2025, city: 'Milan', venue: 'Teatro Versace', mood: 'Dark Romance', theme: 'Night Velvet', lookCount: 46, standouts: 4 },
  ]
  for (const show of RUNWAY_DATA) {
    const showDate = new Date(now)
    // SS25 shows were ~6 months ago, FW25 ~2 months ago
    const seasonOffset = show.season === 'SS25' ? randInt(-180, -150) : randInt(-70, -40)
    showDate.setDate(showDate.getDate() + seasonOffset)
    await prisma.runwayShow.create({
      data: {
        brandId: brandRecords[show.brandIdx].id,
        showName: show.showName, season: show.season, year: show.year,
        city: show.city, venue: show.venue,
        showDate, mood: show.mood, theme: show.theme,
        lookCount: show.lookCount, standouts: show.standouts,
      },
    })
  }
  console.log(`✅ ${RUNWAY_DATA.length} runway shows seeded`)

  // ────── FEATURE 12: VIP Tiers ──────
  const VIP_TIER_TEMPLATES = [
    { tierName: 'Silver', minAnnualSpendEUR: 5000, discountPct: 3, earlyAccessDays: 2, allocationPriority: 2, privateViewing: false, personalShopper: false },
    { tierName: 'Gold', minAnnualSpendEUR: 25000, discountPct: 7, earlyAccessDays: 5, allocationPriority: 3, privateViewing: false, personalShopper: false },
    { tierName: 'Platinum', minAnnualSpendEUR: 75000, discountPct: 12, earlyAccessDays: 10, allocationPriority: 4, privateViewing: true, personalShopper: false },
    { tierName: 'Diamond', minAnnualSpendEUR: 200000, discountPct: 18, earlyAccessDays: 14, allocationPriority: 5, privateViewing: true, personalShopper: true },
  ]
  for (const brand of brandRecords) {
    // LV and Prada have higher thresholds
    const multiplier = brand.name === 'Louis Vuitton' ? 1.3 : brand.name === 'Prada' ? 1.15 : 1.0
    for (const tier of VIP_TIER_TEMPLATES) {
      await prisma.vIPTier.create({
        data: {
          brandId: brand.id,
          tierName: tier.tierName,
          minAnnualSpendEUR: round2(tier.minAnnualSpendEUR * multiplier),
          discountPct: round2(tier.discountPct * (2 - multiplier * 0.3)),
          earlyAccessDays: tier.earlyAccessDays,
          allocationPriority: tier.allocationPriority,
          privateViewing: tier.privateViewing,
          personalShopper: tier.personalShopper,
        },
      })
    }
  }
  console.log(`✅ ${brandRecords.length * 4} VIP tiers seeded`)

  // ────── FEATURE 13: Sustainability Metrics ──────
  const SUSTAINABILITY_DATA: Record<string, any> = {
    'Prada':         { carbonScore: 72, materialSourcing: 78, supplyChainTransparency: 65, circularityIndex: 58, laborPracticeScore: 74 },
    'Gucci':         { carbonScore: 68, materialSourcing: 82, supplyChainTransparency: 71, circularityIndex: 64, laborPracticeScore: 76 },
    'Balenciaga':    { carbonScore: 55, materialSourcing: 48, supplyChainTransparency: 42, circularityIndex: 35, laborPracticeScore: 62 },
    'Louis Vuitton': { carbonScore: 74, materialSourcing: 70, supplyChainTransparency: 68, circularityIndex: 52, laborPracticeScore: 78 },
    'Versace':       { carbonScore: 45, materialSourcing: 52, supplyChainTransparency: 38, circularityIndex: 30, laborPracticeScore: 58 },
  }
  for (const brand of brandRecords) {
    const sd = SUSTAINABILITY_DATA[brand.name] || { carbonScore: 50, materialSourcing: 50, supplyChainTransparency: 50, circularityIndex: 50, laborPracticeScore: 50 }
    const overallScore = round2((sd.carbonScore + sd.materialSourcing + sd.supplyChainTransparency + sd.circularityIndex + sd.laborPracticeScore) / 5)
    await prisma.sustainabilityMetric.create({
      data: {
        brandId: brand.id,
        carbonScore: sd.carbonScore, materialSourcing: sd.materialSourcing,
        supplyChainTransparency: sd.supplyChainTransparency, circularityIndex: sd.circularityIndex,
        laborPracticeScore: sd.laborPracticeScore, overallScore, reportYear: 2025,
      },
    })
  }
  console.log('✅ Sustainability metrics seeded')

  // ────── FEATURE 14: Trend Forecasts ──────
  const TREND_DATA = [
    { season: 'FW25', year: 2025, category: 'Color', trendName: 'Midnight Burgundy', trendType: 'color', intensity: 92, colorPalette: '["#4A0E0E","#722F37","#8B0000","#5C0029"]', description: 'Deep wine tones dominating FW25 runways from Milan to Paris', keyBrands: '["Prada","Versace","Balenciaga"]', confidence: 88 },
    { season: 'FW25', year: 2025, category: 'Color', trendName: 'Arctic Silver', trendType: 'color', intensity: 78, colorPalette: '["#C0C0C0","#D4D4D4","#A8A8A8","#E8E8E8"]', description: 'Metallic silver as neutral — cold, futuristic elegance', keyBrands: '["Balenciaga","Louis Vuitton"]', confidence: 82 },
    { season: 'FW25', year: 2025, category: 'Material', trendName: 'Double-Faced Cashmere', trendType: 'material', intensity: 85, colorPalette: null, description: 'Ultra-soft double-faced cashmere coats with minimal construction', keyBrands: '["Prada","Gucci","Louis Vuitton"]', confidence: 90 },
    { season: 'FW25', year: 2025, category: 'Material', trendName: 'Liquid Satin', trendType: 'material', intensity: 72, colorPalette: null, description: 'Fluid satin fabrics creating movement and drape in eveningwear', keyBrands: '["Versace","Gucci"]', confidence: 75 },
    { season: 'FW25', year: 2025, category: 'Silhouette', trendName: 'Oversized Cocoon', trendType: 'silhouette', intensity: 88, colorPalette: null, description: 'Voluminous cocoon silhouettes enveloping the body in warmth', keyBrands: '["Balenciaga","Prada","Louis Vuitton"]', confidence: 86 },
    { season: 'FW25', year: 2025, category: 'Silhouette', trendName: 'Nipped Waist', trendType: 'silhouette', intensity: 68, colorPalette: null, description: 'Return to defined waists with structured belts and tailoring', keyBrands: '["Versace","Prada"]', confidence: 70 },
    { season: 'SS26', year: 2026, category: 'Color', trendName: 'Saffron Glow', trendType: 'color', intensity: 65, colorPalette: '["#F4C430","#E8A317","#FFBF00","#D4A017"]', description: 'Warm saffron and turmeric tones predicted for SS26 resort', keyBrands: '["Gucci","Versace"]', confidence: 58 },
    { season: 'SS26', year: 2026, category: 'Vibe', trendName: 'Quiet Luxury 2.0', trendType: 'vibe', intensity: 80, colorPalette: null, description: 'Evolved stealth wealth — understated but with intentional detail', keyBrands: '["Prada","Louis Vuitton"]', confidence: 72 },
    { season: 'SS26', year: 2026, category: 'Accessory', trendName: 'Micro Bags Return', trendType: 'accessory', intensity: 58, colorPalette: null, description: 'Counter-trend to oversized bags — ultra-compact evening pieces', keyBrands: '["Prada","Versace"]', confidence: 55 },
    { season: 'FW25', year: 2025, category: 'Accessory', trendName: 'Architectural Heels', trendType: 'accessory', intensity: 76, colorPalette: null, description: 'Sculptural heel shapes as wearable art objects', keyBrands: '["Balenciaga","Louis Vuitton"]', confidence: 80 },
  ]
  for (const trend of TREND_DATA) {
    await prisma.trendForecast.create({
      data: {
        season: trend.season, year: trend.year, category: trend.category,
        trendName: trend.trendName, trendType: trend.trendType,
        intensity: trend.intensity, colorPalette: trend.colorPalette,
        description: trend.description, keyBrands: trend.keyBrands,
        confidence: trend.confidence,
      },
    })
  }
  console.log(`✅ ${TREND_DATA.length} trend forecasts seeded`)

  // ────── FEATURE 15: Drop Queues ──────
  // Create queues for limited/exclusive edition products
  const limitedProducts = productRecords.filter(p => p.editionType === 'limited' || p.editionType === 'exclusive')
  for (const product of limitedProducts) {
    for (const reg of REGIONS) {
      const totalSlots = product.editionType === 'exclusive' ? randInt(20, 60) : randInt(50, 200)
      const filledSlots = Math.round(totalSlots * rand(0.3, 0.95))
      const queueType = product.editionType === 'exclusive' ? 'raffle' : (Math.random() > 0.5 ? 'waitlist' : 'invite')
      const oddsOfSuccess = round2(Math.max(0.05, (totalSlots - filledSlots) / Math.max(1, filledSlots)))
      const opensAt = new Date(now)
      opensAt.setDate(opensAt.getDate() + randInt(-5, 14))
      const closesAt = new Date(opensAt)
      closesAt.setDate(closesAt.getDate() + randInt(3, 14))

      await prisma.dropQueue.create({
        data: {
          productId: product.id, brandId: product.brandId, region: reg.region,
          queueType, totalSlots, filledSlots,
          userPosition: randInt(1, Math.max(2, filledSlots)),
          oddsOfSuccess,
          opensAt, closesAt,
          status: opensAt <= now ? 'open' : 'upcoming',
        },
      })
    }
  }
  console.log(`✅ Drop queues seeded for ${limitedProducts.length} limited products × 5 regions`)

  const counts = {
    brands: await prisma.brand.count(),
    products: await prisma.product.count(),
    prices: await prisma.regionalPrice.count(),
    launches: await prisma.launch.count(),
    lookbooks: await prisma.lookbookEntry.count(),
    rates: await prisma.currencyRate.count(),
    currencyHistory: await prisma.currencyHistory.count(),
    priceHistory: await prisma.priceHistory.count(),
    hypeFactors: await prisma.hypeFactor.count(),
    alerts: await prisma.alert.count(),
    runwayShows: await prisma.runwayShow.count(),
    vipTiers: await prisma.vIPTier.count(),
    sustainability: await prisma.sustainabilityMetric.count(),
    trendForecasts: await prisma.trendForecast.count(),
    dropQueues: await prisma.dropQueue.count(),
  }
  console.log('📊 Database summary:', counts)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
