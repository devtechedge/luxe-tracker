// ────────── Shared Types ──────────
export interface Telemetry {
  overview: {
    totalProducts: number; totalBrands: number; totalLaunches: number;
    avgDisparityOverall: number; maxDisparityOverall: number;
    highDutyProducts: number; limitedStockCount: number; avgHypeScore: number;
  };
  currencyRates: { pair: string; rate: number }[];
  regionSummary: { region: string; avgDisparityPct: number }[];
  brandSummary: { brand: string; avgDisparityPct: number }[];
}

export interface RegionalBreakdown {
  region: string; currency: string; price: number; priceInEUR: number;
  disparityPct: number; importDuty: number; importDutyImpact: number;
  taxRate: number; taxImpact: number; totalLandedCost: number;
  shippingCost: number; stockStatus: string; stockLevel: number;
}

export interface DisparityRow {
  productId: string; productName: string; sku: string; category: string;
  brand: string; season: string; editionType: string; resaleValueIdx: number;
  maxDisparityPct: number; maxDisparityRegion: string; avgDisparityPct: number;
  regionalBreakdown: RegionalBreakdown[]; hypeScore: number;
}

export interface LaunchEvent {
  id: string; productId: string; brandId: string; region: string;
  launchDate: string; launchType: string; status: string; notes: string | null;
  expectedUnits: number;
  product: { id: string; name: string; sku: string; brand: { id: string; name: string } };
  brand: { id: string; name: string };
}

export interface Brand {
  id: string; name: string; logo: string | null; country: string;
  currency: string; tierScore: number;
  _count: { products: number; launches: number };
}

// ────── Feature 1: Arbitrage ──────
export interface ArbitrageOpportunity {
  productId: string; productName: string; sku: string; brand: string; category: string;
  buyFromRegion: string; buyAtPrice: number; buyCurrency: string; buyPriceEUR: number;
  shipToRegion: string; localPriceAtTarget: number; localCurrency: string; localPriceEUR: number;
  shippingCostEUR: number; importDutyApplied: number; dutyImpactEUR: number;
  totalLandedCostEUR: number; savingsEUR: number; savingsPct: number; stockLevelAtSource: number;
}
export interface ArbitrageResponse {
  totalOpportunities: number; avgSavingsPct: number; topOpportunities: ArbitrageOpportunity[];
}

// ────── Feature 2: Hype Predictor ──────
export interface HypeProduct {
  productId: string; productName: string; sku: string; brand: string; category: string;
  season: string; editionType: string; resaleValueIdx: number; hypeScore: number;
  hypeBreakdown: { brandTier: number; category: number; season: number; exclusivity: number; decay: number } | null;
  daysToLaunch: number | null; launchRegion: string | null; launchType: string | null; expectedUnits: number;
}
export interface HypeResponse {
  totalProducts: number; avgHypeScore: number; topHyped: HypeProduct[]; allProducts: HypeProduct[];
}

// ────── Feature 3: Currency Volatility ──────
export interface CurrencyVolatility {
  pair: string; currentRate: number; mean: number; min: number; max: number;
  volatilityPct: number; rangePct: number; change90dPct: number;
  riskScore: number; riskLevel: string; series: { date: string; rate: number }[];
}
export interface VolatilityResponse { pairs: CurrencyVolatility[]; overallRisk: number }

// ────── Feature 4: Competitive Matrix ──────
export interface CompetitiveCategory {
  category: string; totalProducts: number;
  brands: { brand: string; avgPriceEUR: number; productCount: number }[];
  valueLeader: string; premiumLeader: string; priceSpreadEUR: number; priceSpreadPct: number;
}
export interface CompetitiveResponse { categories: CompetitiveCategory[] }

// ────── Feature 5: Launch Conflicts ──────
export interface ConflictDay {
  date: string; eventCount: number; brands: string[]; cannibalizationRisk: string;
  events: { productName: string; brand: string; region: string; launchType: string; status: string }[];
}
export interface WeeklyDensity { weekStart: string; totalLaunches: number; brandCount: number; brands: string[]; densityScore: number }
export interface ConflictResponse { conflictDays: ConflictDay[]; weeklyDensity: WeeklyDensity[]; totalConflicts: number }

// ────── Feature 6: Stock Risk ──────
export interface StockRisk {
  productId: string; productName: string; sku: string; brand: string; category: string;
  region: string; currency: string; price: number; stockLevel: number; stockStatus: string;
  hypeScore: number; riskScore: number; riskLevel: string; estimatedDaysToStockout: number;
  restockUrgency: string;
}
export interface StockRiskResponse {
  totalEntries: number; criticalCount: number; highCount: number;
  topRisks: StockRisk[]; allRisks: StockRisk[];
}

// ────── Feature 7: Landed Cost Optimizer ──────
export interface OptimizerRoute {
  sourceRegion: string; sourceCurrency: string; sourcePrice: number; sourcePriceEUR: number;
  shippingCostEUR: number; importDutyRate: number; importDutyAmountEUR: number;
  totalLandedCostEUR: number; stockLevelAtSource: number; stockStatusAtSource: string;
  savingsVsLocalEUR: number; savingsVsLocalPct: number; isLocalPurchase: boolean;
}
export interface OptimizerResponse {
  product: { id: string; name: string; sku: string; brand: string; category: string };
  targetRegion: string; localPriceEUR: number; bestRoute: OptimizerRoute;
  allRoutes: OptimizerRoute[]; potentialSavingsEUR: number;
}

// ────── Feature 8: Price History ──────
export interface PriceMover {
  productId: string; productName: string; brand: string; region: string;
  currency: string; startPrice: number; endPrice: number; change90dPct: number; anomalyCount: number;
}
export interface HistoryResponse { topMovers: PriceMover[]; totalAnomalies: number; totalSeries: number }

// ────── Feature 9: Brand Pulse ──────
export interface BrandPulse {
  brandId: string; brand: string; logo: string | null; country: string;
  dimensions: { prestige: number; pricingPower: number; hypeIndex: number; launchVelocity: number; stockHealth: number };
  overallScore: number; productCount: number; upcomingLaunches: number; avgHypeScore: number;
}
export interface PulseResponse { brands: BrandPulse[] }

// ────── Feature 10: Watchlist & Alerts ──────
export interface WatchlistItem {
  id: string; watchType: string; productId: string; productName: string | null;
  brand: string | null; region: string | null; targetPrice: number | null;
  createdAt: string; currentMinPriceEUR: number | null; currentMaxPriceEUR: number | null;
  regionalBreakdown: RegionalBreakdown[];
}
export interface AlertItem {
  id: string; alertType: string; productId: string | null; brandId: string | null;
  region: string | null; message: string; severity: string; read: boolean;
  createdAt: string; product?: { name: string; brand: { name: string } } | null;
  brand?: { name: string } | null;
}

// ────── Feature 11: Runway Collection Tracker ──────
export interface RunwayShow {
  id: string; showName: string; season: string; year: number;
  city: string; venue: string | null; showDate: string;
  mood: string | null; theme: string | null; lookCount: number; standouts: number;
  brand: { id: string; name: string; logo: string | null; country: string };
}
export interface RunwayResponse {
  totalShows: number; shows: RunwayShow[];
  byCity: Record<string, RunwayShow[]>; bySeason: Record<string, RunwayShow[]>;
  cities: string[];
}

// ────── Feature 12: VIP Client Tier Simulator ──────
export interface VIPTierData {
  tierName: string; minAnnualSpendEUR: number; discountPct: number;
  earlyAccessDays: number; allocationPriority: number;
  privateViewing: boolean; personalShopper: boolean; achievable: boolean;
}
export interface VIPSimulation {
  brand: string; brandId: string;
  qualifiedTier: { tierName: string; discountPct: number; earlyAccessDays: number; allocationPriority: number; privateViewing: boolean; personalShopper: boolean } | null;
  nextTier: { tierName: string; minAnnualSpendEUR: number; gapEUR: number } | null;
  allTiers: VIPTierData[];
}
export interface VIPSavingsExample {
  product: string; brand: string; retailPrice: number;
  discountPct: number; savingsEUR: number; vipPrice: number;
}
export interface VIPResponse {
  spendEUR: number; simulations: VIPSimulation[];
  savingsExamples: VIPSavingsExample[]; totalTiers: number;
}

// ────── Feature 13: Sustainability Score ──────
export interface SustainabilityScore {
  brandId: string; brand: string; logo: string | null;
  dimensions: { carbonScore: number; materialSourcing: number; supplyChainTransparency: number; circularityIndex: number; laborPracticeScore: number };
  overallScore: number; reportYear: number;
}
export interface SustainabilityResponse {
  scores: SustainabilityScore[];
  industryAvg: { carbonScore: number; materialSourcing: number; supplyChainTransparency: number; circularityIndex: number; laborPracticeScore: number; overall: number };
}

// ────── Feature 14: Seasonal Trend Forecast ──────
export interface TrendForecast {
  id: string; season: string; year: number; category: string;
  trendName: string; trendType: string; intensity: number;
  colorPalette: string[] | null; description: string | null;
  keyBrands: string[] | null; confidence: number;
}
export interface TrendResponse {
  totalTrends: number; trends: TrendForecast[];
  byType: Record<string, TrendForecast[]>; seasons: string[];
}

// ────── Feature 15: Exclusive Drop Queue ──────
export interface DropQueueEntry {
  id: string; productId: string; productName: string; brand: string;
  editionType: string; region: string; queueType: string;
  totalSlots: number; filledSlots: number; fillPct: number;
  userPosition: number | null; oddsOfSuccess: number;
  opensAt: string; closesAt: string | null;
  status: string; daysUntilOpen: number;
}
export interface DropQueueResponse {
  totalQueues: number; openCount: number; upcomingCount: number;
  avgOdds: number; queues: DropQueueEntry[];
}

// ────────── Constants ──────────
export const BRAND_COLORS: Record<string, string> = {
  'Prada': '#1a1a2e', 'Gucci': '#16213e', 'Balenciaga': '#0f3460',
  'Louis Vuitton': '#533483', 'Versace': '#e94560',
}
export const REGION_COLORS: Record<string, string> = {
  'EU': '#10b981', 'US': '#f59e0b', 'UK': '#3b82f6', 'Norway': '#8b5cf6', 'India': '#ef4444',
}
export const STATUS_COLORS: Record<string, string> = {
  'upcoming': 'bg-amber-100 text-amber-800 border-amber-200',
  'confirmed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'rumored': 'bg-violet-100 text-violet-800 border-violet-200',
  'sold-out': 'bg-red-100 text-red-800 border-red-200',
}
export const STOCK_COLORS: Record<string, string> = {
  'available': 'bg-emerald-100 text-emerald-800',
  'limited': 'bg-amber-100 text-amber-800',
  'pre-order': 'bg-sky-100 text-sky-800',
  'out-of-stock': 'bg-red-100 text-red-800',
}
export const RISK_COLORS: Record<string, string> = {
  'critical': 'bg-red-100 text-red-800 border-red-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'moderate': 'bg-amber-100 text-amber-800 border-amber-200',
  'low': 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

// ────────── Helpers ──────────
export async function fetchAPI(path: string) {
  const res = await fetch(`/api/analytics?path=${encodeURIComponent(path)}`)
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}
export async function postAPI(path: string, body: any) {
  const res = await fetch(`/api/analytics?path=${encodeURIComponent(path)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export function formatPrice(price: number, currency: string) {
  const symbols: Record<string, string> = { EUR: '\u20ac', USD: '$', GBP: '\u00a3', NOK: 'kr', INR: '\u20b9' }
  return `${symbols[currency] || currency}${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}
export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
export function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}
