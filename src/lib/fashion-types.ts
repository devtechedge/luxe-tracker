// ============================================================
// SHARED TYPES - luxury fashion price/disparity tracker
// (1:1 with the original repo, minus the watchlist mutation types)
// ============================================================

export interface Telemetry {
  overview: {
    totalProducts: number
    totalBrands: number
    totalLaunches: number
    avgDisparityOverall: number
    maxDisparityOverall: number
    highDutyProducts: number
    limitedStockCount: number
    avgHypeScore: number
  }
  currencyRates: { pair: string; rate: number }[]
  regionSummary: { region: string; avgDisparityPct: number }[]
  brandSummary: { brand: string; avgDisparityPct: number }[]
}

export interface RegionalBreakdown {
  region: string
  currency: string
  price: number
  priceInEUR: number
  disparityPct: number
  importDuty: number
  importDutyImpact: number
  taxRate: number
  taxImpact: number
  totalLandedCost: number
  shippingCost: number
  stockStatus: string
  stockLevel: number
}

export interface DisparityRow {
  productId: string
  productName: string
  sku: string
  category: string
  brand: string
  season: string
  editionType: string
  resaleValueIdx: number
  maxDisparityPct: number
  maxDisparityRegion: string
  avgDisparityPct: number
  regionalBreakdown: RegionalBreakdown[]
  hypeScore: number
}

export interface LaunchEvent {
  id: string
  productId: string
  brandId: string
  region: string
  launchDate: string
  launchType: string
  status: string
  notes: string | null
  expectedUnits: number
  product: { id: string; name: string; sku: string; brand: { id: string; name: string } }
  brand: { id: string; name: string }
}

export interface Brand {
  id: string
  name: string
  logo: string | null
  country: string
  currency: string
  tierScore: number
  _count: { products: number; launches: number }
}

// Feature 1: Arbitrage
export interface ArbitrageOpportunity {
  productId: string
  productName: string
  sku: string
  brand: string
  category: string
  buyFromRegion: string
  buyAtPrice: number
  buyCurrency: string
  buyPriceEUR: number
  shipToRegion: string
  localPriceAtTarget: number
  localCurrency: string
  localPriceEUR: number
  shippingCostEUR: number
  importDutyApplied: number
  dutyImpactEUR: number
  totalLandedCostEUR: number
  savingsEUR: number
  savingsPct: number
  stockLevelAtSource: number
}
export interface ArbitrageResponse {
  totalOpportunities: number
  avgSavingsPct: number
  topOpportunities: ArbitrageOpportunity[]
}

// Feature 2: Hype Predictor
export interface HypeBreakdown {
  brandTier: number
  category: number
  season: number
  exclusivity: number
  decay: number
}
export interface HypeProduct {
  productId: string
  productName: string
  sku: string
  brand: string
  category: string
  season: string
  editionType: string
  resaleValueIdx: number
  hypeScore: number
  hypeBreakdown: HypeBreakdown | null
  daysToLaunch: number | null
  launchRegion: string | null
  launchType: string | null
  expectedUnits: number
}
export interface HypeResponse {
  totalProducts: number
  avgHypeScore: number
  topHyped: HypeProduct[]
  allProducts: HypeProduct[]
}

// Feature 3: FX Volatility
export interface CurrencyVolatility {
  pair: string
  currentRate: number
  mean: number
  min: number
  max: number
  volatilityPct: number
  rangePct: number
  change90dPct: number
  riskScore: number
  riskLevel: string
  series: { date: string; rate: number }[]
}
export interface VolatilityResponse {
  pairs: CurrencyVolatility[]
  overallRisk: number
}

// Feature 4: Competitive Matrix
export interface CompetitiveCategory {
  category: string
  totalProducts: number
  brands: { brand: string; avgPriceEUR: number; productCount: number }[]
  valueLeader: string
  premiumLeader: string
  priceSpreadEUR: number
  priceSpreadPct: number
}
export interface CompetitiveResponse {
  categories: CompetitiveCategory[]
}

// Feature 5: Launch Conflicts
export interface ConflictDay {
  date: string
  eventCount: number
  brands: string[]
  cannibalizationRisk: string
  events: {
    productName: string
    brand: string
    region: string
    launchType: string
    status: string
  }[]
}
export interface WeeklyDensity {
  weekStart: string
  totalLaunches: number
  brandCount: number
  brands: string[]
  densityScore: number
}
export interface ConflictResponse {
  conflictDays: ConflictDay[]
  weeklyDensity: WeeklyDensity[]
  totalConflicts: number
}

// Feature 6: Stock Risk
export interface StockRisk {
  productId: string
  productName: string
  sku: string
  brand: string
  category: string
  region: string
  currency: string
  price: number
  stockLevel: number
  stockStatus: string
  hypeScore: number
  riskScore: number
  riskLevel: string
  estimatedDaysToStockout: number
  restockUrgency: string
}
export interface StockRiskResponse {
  totalEntries: number
  criticalCount: number
  highCount: number
  topRisks: StockRisk[]
  allRisks: StockRisk[]
}

// Feature 7: Landed Cost Optimizer
export interface OptimizerRoute {
  sourceRegion: string
  sourceCurrency: string
  sourcePrice: number
  sourcePriceEUR: number
  shippingCostEUR: number
  importDutyRate: number
  importDutyAmountEUR: number
  totalLandedCostEUR: number
  stockLevelAtSource: number
  stockStatusAtSource: string
  savingsVsLocalEUR: number
  savingsVsLocalPct: number
  isLocalPurchase: boolean
}
export interface OptimizerResponse {
  product: { id: string; name: string; sku: string; brand: string; category: string }
  targetRegion: string
  localPriceEUR: number
  bestRoute: OptimizerRoute
  allRoutes: OptimizerRoute[]
  potentialSavingsEUR: number
}

// Feature 8: Price History
export interface PriceMover {
  productId: string
  productName: string
  brand: string
  region: string
  currency: string
  startPrice: number
  endPrice: number
  change90dPct: number
  anomalyCount: number
}
export interface HistoryResponse {
  topMovers: PriceMover[]
  totalAnomalies: number
  totalSeries: number
}

// Feature 9: Brand Pulse
export interface BrandPulse {
  brandId: string
  brand: string
  logo: string | null
  country: string
  dimensions: {
    prestige: number
    pricingPower: number
    hypeIndex: number
    launchVelocity: number
    stockHealth: number
  }
  overallScore: number
  productCount: number
  upcomingLaunches: number
  avgHypeScore: number
}
export interface PulseResponse {
  brands: BrandPulse[]
}

// Feature 11: Runway Collection Tracker
export interface RunwayShow {
  id: string
  showName: string
  season: string
  year: number
  city: string
  venue: string | null
  showDate: string
  mood: string | null
  theme: string | null
  lookCount: number
  standouts: number
  brand: { id: string; name: string; logo: string | null; country: string }
}
export interface RunwayResponse {
  totalShows: number
  shows: RunwayShow[]
  byCity: Record<string, number>
  bySeason: Record<string, number>
  cities: string[]
}

// Feature 12: VIP Client Tier Simulator
export interface VIPTierData {
  tierName: string
  minAnnualSpendEUR: number
  discountPct: number
  earlyAccessDays: number
  allocationPriority: number
  privateViewing: boolean
  personalShopper: boolean
  achievable: boolean
}
export interface VIPSimulation {
  brand: string
  brandId: string
  qualifiedTier: {
    tierName: string
    discountPct: number
    earlyAccessDays: number
    allocationPriority: number
    privateViewing: boolean
    personalShopper: boolean
  } | null
  nextTier: { tierName: string; minAnnualSpendEUR: number; gapEUR: number } | null
  allTiers: VIPTierData[]
}

// Feature 13: Sustainability
export interface SustainabilityMetric {
  brandId: string
  brand: string
  reportYear: number
  carbonScore: number
  materialSourcing: number
  supplyChainTransparency: number
  circularityIndex: number
  laborPracticeScore: number
  overallScore: number
  reportUrl: string | null
}

// Feature 14: Trend Forecast
export interface TrendForecast {
  id: string
  season: string
  year: number
  category: string
  trendName: string
  trendType: string
  intensity: number
  colorPalette: string | null
  description: string | null
  keyBrands: string | null
  confidence: number
}

// Feature 15: Drop Queue
export interface DropQueueEntry {
  id: string
  productId: string
  productName: string
  brand: string
  region: string
  queueType: string
  totalSlots: number
  filledSlots: number
  userPosition: number | null
  oddsOfSuccess: number
  opensAt: string
  closesAt: string | null
  status: string
}

// Watchlist (localStorage backed)
export interface WatchlistEntry {
  id: string
  watchType: 'product' | 'brand' | 'region'
  productId?: string
  productName?: string
  brand?: string
  region?: string
  targetPrice?: number
  createdAt: string
}
export interface AlertEntry {
  id: string
  alertType: 'price_drop' | 'launch_reminder' | 'stock_change' | 'arbitrage'
  productId?: string
  productName?: string
  brand?: string
  region?: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  read: boolean
  createdAt: string
}
