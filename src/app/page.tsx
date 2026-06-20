'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart3, Calendar, Globe2, TrendingUp, Package, DollarSign,
  ArrowUpDown, Activity, RefreshCw, Shield, AlertTriangle, CheckCircle2,
  Clock, MapPin, Tag, Layers, Sparkles, ChevronRight,
  Ship, Flame, Swords, Calculator, History, Radar, Bookmark, Bell,
  LayoutDashboard, Zap, Gem, TreePine, Palette, Users,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Telemetry, DisparityRow, LaunchEvent, Brand, RegionalBreakdown,
  fetchAPI, formatPrice, formatDate, daysUntil,
  BRAND_COLORS, REGION_COLORS, STATUS_COLORS, STOCK_COLORS,
} from '@/lib/fashion-types'
import { ArbitragePanel } from '@/components/features/arbitrage-panel'
import { HypePanel } from '@/components/features/hype-panel'
import { VolatilityPanel } from '@/components/features/volatility-panel'
import { CompetitivePanel } from '@/components/features/competitive-panel'
import { ConflictPanel } from '@/components/features/conflict-panel'
import { StockRiskPanel } from '@/components/features/stock-risk-panel'
import { OptimizerPanel } from '@/components/features/optimizer-panel'
import { HistoryPanel } from '@/components/features/history-panel'
import { BrandPulsePanel } from '@/components/features/brand-pulse-panel'
import { WatchlistPanel } from '@/components/features/watchlist-panel'
import { RunwayPanel } from '@/components/features/runway-panel'
import { VIPPanel } from '@/components/features/vip-panel'
import { SustainabilityPanel } from '@/components/features/sustainability-panel'
import { TrendForecastPanel } from '@/components/features/trend-forecast-panel'
import { DropQueuePanel } from '@/components/features/drop-queue-panel'

type SectionKey =
  | 'overview' | 'calendar' | 'disparity' | 'arbitrage' | 'hype'
  | 'volatility' | 'competitive' | 'conflicts' | 'stock-risk'
  | 'optimizer' | 'history' | 'brand-pulse' | 'watchlist'
  | 'runway' | 'vip' | 'sustainability' | 'trends' | 'drop-queue'

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode; group: string }[] = [
  { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" />, group: 'Intelligence' },
  { key: 'calendar', label: 'Launch Calendar', icon: <Calendar className="h-4 w-4" />, group: 'Intelligence' },
  { key: 'disparity', label: 'Price Matrix', icon: <BarChart3 className="h-4 w-4" />, group: 'Intelligence' },
  { key: 'arbitrage', label: 'Arbitrage Finder', icon: <Ship className="h-4 w-4" />, group: 'Pricing' },
  { key: 'optimizer', label: 'Landed Cost Optimizer', icon: <Calculator className="h-4 w-4" />, group: 'Pricing' },
  { key: 'history', label: 'Price History', icon: <History className="h-4 w-4" />, group: 'Pricing' },
  { key: 'volatility', label: 'FX Volatility', icon: <Activity className="h-4 w-4" />, group: 'Pricing' },
  { key: 'hype', label: 'Hype Predictor', icon: <Flame className="h-4 w-4" />, group: 'Market' },
  { key: 'conflicts', label: 'Drop Conflicts', icon: <Swords className="h-4 w-4" />, group: 'Market' },
  { key: 'stock-risk', label: 'Stock-Out Risk', icon: <AlertTriangle className="h-4 w-4" />, group: 'Market' },
  { key: 'competitive', label: 'Competitive Matrix', icon: <Swords className="h-4 w-4" />, group: 'Market' },
  { key: 'brand-pulse', label: 'Brand Pulse Radar', icon: <Radar className="h-4 w-4" />, group: 'Market' },
  { key: 'runway', label: 'Runway Tracker', icon: <Gem className="h-4 w-4" />, group: 'Luxury' },
  { key: 'vip', label: 'VIP Tier Simulator', icon: <Users className="h-4 w-4" />, group: 'Luxury' },
  { key: 'sustainability', label: 'Sustainability', icon: <TreePine className="h-4 w-4" />, group: 'Luxury' },
  { key: 'trends', label: 'Trend Forecast', icon: <Palette className="h-4 w-4" />, group: 'Luxury' },
  { key: 'drop-queue', label: 'Drop Queue', icon: <Sparkles className="h-4 w-4" />, group: 'Luxury' },
  { key: 'watchlist', label: 'My Watchlist', icon: <Bookmark className="h-4 w-4" />, group: 'Personal' },
]

// ────── Animation variants ──────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
}

const pageVariants = {
  initial: { opacity: 0, x: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, x: -20, filter: 'blur(4px)', transition: { duration: 0.25 } },
}

// ────── Animated Number Counter ──────
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      start = Math.round(eased * value)
      setDisplay(start)
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration])
  return <>{display}</>
}

export default function FashionTrackerDashboard() {
  const [activeSection, setActiveSection] = useState<SectionKey>('overview')
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null)
  const [disparityMatrix, setDisparityMatrix] = useState<DisparityRow[]>([])
  const [calendar, setCalendar] = useState<Record<string, LaunchEvent[]>>({})
  const [launches, setLaunches] = useState<LaunchEvent[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [selectedProduct, setSelectedProduct] = useState<DisparityRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [landingComplete, setLandingComplete] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLandingComplete(true), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const [tel, disp, cal, lau, brn] = await Promise.all([
          fetchAPI('/api/disparity/telemetry'),
          fetchAPI('/api/disparity/matrix'),
          fetchAPI('/api/launches/calendar'),
          fetchAPI('/api/launches'),
          fetchAPI('/api/brands'),
        ])
        if (cancelled) return
        setTelemetry(tel); setDisparityMatrix(disp); setCalendar(cal); setLaunches(lau); setBrands(brn)
        setLastRefresh(new Date().toLocaleTimeString())
      } catch (err) { console.error('Failed to load data:', err) }
      if (!cancelled) setLoading(false)
    }
    run()
    return () => { cancelled = true }
  }, [])

  const filteredDisparity = disparityMatrix.filter(d =>
    (selectedBrand === 'all' || d.brand === selectedBrand)
  )

  const refreshData = async () => {
    setLoading(true)
    try {
      const [tel, disp, cal, lau, brn] = await Promise.all([
        fetchAPI('/api/disparity/telemetry'),
        fetchAPI('/api/disparity/matrix'),
        fetchAPI('/api/launches/calendar'),
        fetchAPI('/api/launches'),
        fetchAPI('/api/brands'),
      ])
      setTelemetry(tel); setDisparityMatrix(disp); setCalendar(cal); setLaunches(lau); setBrands(brn)
      setLastRefresh(new Date().toLocaleTimeString())
    } catch (err) { console.error('Failed to load data:', err) }
    setLoading(false)
  }

  const groupedSections = SECTIONS.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = []
    acc[s.group].push(s)
    return acc
  }, {} as Record<string, typeof SECTIONS>)

  const activeLabel = SECTIONS.find(s => s.key === activeSection)?.label

  const handleSectionChange = useCallback((key: SectionKey) => {
    setActiveSection(key)
    setMobileNavOpen(false)
  }, [])

  return (
    <TooltipProvider>
      {/* ─── Cinematic Landing Overlay ─── */}
      <AnimatePresence>
        {!landingComplete && (
          <motion.div
            className="fixed inset-0 z-[100] bg-[#0a0a0a] flex items-center justify-center"
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex items-center justify-center gap-3 mb-4"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Sparkles className="h-6 w-6 text-black" />
                </div>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, letterSpacing: '0.5em' }}
                animate={{ opacity: 1, letterSpacing: '0.35em' }}
                transition={{ duration: 1.2, delay: 0.4 }}
                className="text-2xl font-extralight text-white tracking-[0.35em] uppercase"
              >
                LUXE TRACKER
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="text-[10px] uppercase tracking-[0.5em] text-white/50 mt-2"
              >
                Global Intelligence · v3.0
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.4, delay: 1.1, ease: 'easeInOut' }}
                className="mt-6 h-px w-48 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto origin-left"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#0a0a0a] flex">
        {/* ─── Sidebar ─── */}
        <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 border-r border-white/[0.06] bg-[#0d0d0d] backdrop-blur transition-transform ${
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="flex h-16 items-center gap-2 border-b border-white/[0.06] px-4">
            <motion.div
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="h-4 w-4 text-black" />
            </motion.div>
            <div>
              <h1 className="text-sm font-semibold tracking-[0.2em] text-white/90 uppercase">LUXE TRACKER</h1>
              <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/30">v3.0 · Intelligence</p>
            </div>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem-3.5rem)]">
            <nav className="px-2 py-3 space-y-4">
              {Object.entries(groupedSections).map(([group, sections]) => (
                <div key={group}>
                  <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">{group}</p>
                  <div className="space-y-0.5">
                    {sections.map(s => (
                      <motion.button
                        key={s.key}
                        onClick={() => handleSectionChange(s.key)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.97 }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                          activeSection === s.key
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-400 shadow-sm shadow-amber-500/10 border border-amber-500/20'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                        }`}
                      >
                        {s.icon}
                        <span className="truncate">{s.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.06] p-3 bg-[#0d0d0d]">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={loading}
              className="w-full border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80"
            >
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        {/* ─── Main content ─── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden text-white/60"
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                >
                  <LayoutDashboard className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-white/90">{activeLabel}</h2>
                  <p className="text-[10px] text-white/30">Last sync: {lastRefresh || '\u2014'}</p>
                </div>
              </div>
              {(activeSection === 'calendar' || activeSection === 'disparity' || activeSection === 'overview') && (
                <div className="flex gap-2">
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="h-8 w-[130px] text-xs bg-white/[0.04] border-white/10 text-white/70 hidden sm:flex"><SelectValue placeholder="All Brands" /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(b => <SelectItem key={b.id} value={b.name}>{b.logo} {b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="h-8 w-[110px] text-xs bg-white/[0.04] border-white/10 text-white/70 hidden sm:flex"><SelectValue placeholder="All Regions" /></SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="all">All Regions</SelectItem>
                      {['EU', 'US', 'UK', 'Norway', 'India'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
            {/* ═══════ SECTION: OVERVIEW ═══════ */}
            <AnimatePresence mode="wait">
              {activeSection === 'overview' && telemetry && (
                <motion.div
                  key="overview"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="space-y-6"
                >
                  {/* KPI grid */}
                  <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
                  >
                    <motion.div variants={staggerItem}>
                      <KPICard icon={<Package className="h-4 w-4" />} label="Products" value={<AnimatedNumber value={telemetry.overview.totalProducts} />} accent="stone" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <KPICard icon={<Globe2 className="h-4 w-4" />} label="Brands" value={<AnimatedNumber value={telemetry.overview.totalBrands} />} accent="stone" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <KPICard icon={<Calendar className="h-4 w-4" />} label="Launches" value={<AnimatedNumber value={telemetry.overview.totalLaunches} />} accent="stone" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <KPICard icon={<TrendingUp className="h-4 w-4" />} label="Avg Disp." value={`${telemetry.overview.avgDisparityOverall}%`} accent="amber" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <KPICard icon={<ArrowUpDown className="h-4 w-4" />} label="Max Disp." value={`${telemetry.overview.maxDisparityOverall}%`} accent="red" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <KPICard icon={<Flame className="h-4 w-4" />} label="Avg Hype" value={<AnimatedNumber value={telemetry.overview.avgHypeScore} />} accent="violet" />
                    </motion.div>
                    <motion.div variants={staggerItem}>
                      <KPICard icon={<AlertTriangle className="h-4 w-4" />} label="Low Stock" value={<AnimatedNumber value={telemetry.overview.limitedStockCount} />} accent="amber" />
                    </motion.div>
                  </motion.div>

                  {/* Region & Brand charts side by side */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={3}>
                      <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold text-white/90">Avg Disparity by Region</CardTitle>
                          <CardDescription className="text-white/30">Markup vs. EU boutique retail baseline</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={telemetry.regionSummary} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="region" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `${v}%`} />
                                <RTooltip formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}%`, 'Avg Disparity']} contentStyle={{ fontSize: 12, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Bar dataKey="avgDisparityPct" radius={[6, 6, 0, 0]}>
                                  {telemetry.regionSummary.map((r, i) => <Cell key={i} fill={REGION_COLORS[r.region] || '#94a3b8'} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                    <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={4}>
                      <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base font-semibold text-white/90">Avg Disparity by Brand</CardTitle>
                          <CardDescription className="text-white/30">Which brands carry highest pricing premium</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={telemetry.brandSummary} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="brand" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                                <YAxis tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `${v}%`} />
                                <RTooltip formatter={(v: number) => [`${v > 0 ? '+' : ''}${v}%`, 'Avg Disparity']} contentStyle={{ fontSize: 12, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <Bar dataKey="avgDisparityPct" radius={[6, 6, 0, 0]}>
                                  {telemetry.brandSummary.map((b, i) => <Cell key={i} fill={BRAND_COLORS[b.brand] || '#94a3b8'} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Feature navigation cards */}
                  <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    custom={5}
                  >
                    <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                          <Zap className="h-4 w-4 text-amber-400" /> Advanced Intelligence Modules
                        </CardTitle>
                        <CardDescription className="text-white/30">15 specialized analytics features — click to explore</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                          {SECTIONS.filter(s => s.key !== 'overview').map((s, i) => (
                            <motion.button
                              key={s.key}
                              onClick={() => handleSectionChange(s.key)}
                              variants={staggerItem}
                              initial="hidden"
                              animate="visible"
                              custom={i}
                              whileHover={{ scale: 1.03, y: -2 }}
                              whileTap={{ scale: 0.97 }}
                              className="text-left rounded-lg border border-white/[0.06] p-3 bg-white/[0.02] hover:bg-white/[0.05] hover:border-amber-500/30 transition-all group"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-white/50 group-hover:text-amber-400 transition-colors">{s.icon}</span>
                                <ChevronRight className="h-3 w-3 text-white/10 group-hover:text-amber-400/60 transition-colors" />
                              </div>
                              <p className="text-xs font-semibold text-white/80 group-hover:text-white/95">{s.label}</p>
                              <p className="text-[9px] text-white/25 mt-0.5">{s.group}</p>
                            </motion.button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══════ SECTION: CALENDAR ═══════ */}
            <AnimatePresence mode="wait">
              {activeSection === 'calendar' && (
                <motion.div
                  key="calendar"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold text-white/90">Upcoming High-Fashion Drops</CardTitle>
                      <CardDescription className="text-white/30">Launch calendar sorted by date with brand, region, and status markers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {Object.keys(calendar).length === 0 ? (
                        <div className="py-12 text-center text-sm text-white/30">No launch data available</div>
                      ) : (
                        <div className="space-y-6">
                          {Object.entries(calendar)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([month, events]) => {
                              const filtered = events.filter((e: LaunchEvent) =>
                                (selectedBrand === 'all' || e.brand.name === selectedBrand) &&
                                (selectedRegion === 'all' || e.region === selectedRegion)
                              )
                              if (filtered.length === 0) return null
                              const [yr, mo] = month.split('-')
                              const monthName = new Date(+yr, +mo - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                              return (
                                <div key={month}>
                                  <div className="mb-3 flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-white/80">{monthName}</h3>
                                    <Badge variant="secondary" className="text-[10px] bg-white/[0.06] text-white/50 border-white/[0.06]">{filtered.length} drops</Badge>
                                  </div>
                                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {filtered.map((launch: LaunchEvent, idx: number) => {
                                      const days = daysUntil(launch.launchDate)
                                      const isPast = days < 0
                                      const isSoon = days >= 0 && days <= 7
                                      return (
                                        <Tooltip key={launch.id}>
                                          <TooltipTrigger asChild>
                                            <motion.div
                                              initial={{ opacity: 0, y: 12 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ delay: idx * 0.03, duration: 0.4 }}
                                              whileHover={{ scale: 1.02, y: -2 }}
                                              className={`group relative rounded-lg border p-3 transition-all cursor-pointer ${
                                                isPast ? 'border-white/[0.04] bg-white/[0.01]' :
                                                isSoon ? 'border-amber-500/30 bg-amber-500/[0.05]' :
                                                'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                                              }`}
                                            >
                                              <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                  <p className="truncate text-xs font-semibold text-white/90">{launch.product.name}</p>
                                                  <p className="text-[10px] text-white/40">{launch.brand.name}</p>
                                                </div>
                                                <Badge className={`text-[9px] shrink-0 ${STATUS_COLORS[launch.status] || ''}`}>
                                                  {launch.status}
                                                </Badge>
                                              </div>
                                              <Separator className="my-2 bg-white/[0.06]" />
                                              <div className="flex items-center justify-between text-[10px]">
                                                <div className="flex items-center gap-1 text-white/40"><MapPin className="h-3 w-3" /> {launch.region}</div>
                                                <div className="flex items-center gap-1 text-white/40">
                                                  <Clock className="h-3 w-3" />
                                                  {isPast ? `${Math.abs(days)}d ago` : isSoon ? `${days}d left` : formatDate(launch.launchDate)}
                                                </div>
                                              </div>
                                              <div className="mt-1.5">
                                                <Badge variant="outline" className="text-[9px] border-white/[0.1] text-white/50" style={{ borderColor: BRAND_COLORS[launch.brand.name], color: BRAND_COLORS[launch.brand.name] }}>
                                                  {launch.launchType}
                                                </Badge>
                                              </div>
                                              {isSoon && !isPast && (
                                                <div className="absolute -top-1 -right-1">
                                                  <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                                                  </span>
                                                </div>
                                              )}
                                            </motion.div>
                                          </TooltipTrigger>
                                          <TooltipContent side="bottom" className="max-w-xs bg-[#1a1a1a] border-white/10">
                                            <p className="font-semibold text-white/90">{launch.product.name}</p>
                                            <p className="text-xs text-white/60">{launch.brand.name} · {launch.region}</p>
                                            <p className="text-xs mt-1 text-white/50">{formatDate(launch.launchDate)} · {launch.launchType}</p>
                                            {launch.notes && <p className="text-xs mt-1 text-amber-400">{launch.notes}</p>}
                                          </TooltipContent>
                                        </Tooltip>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══════ SECTION: DISPARITY MATRIX ═══════ */}
            <AnimatePresence mode="wait">
              {activeSection === 'disparity' && (
                <motion.div
                  key="disparity"
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="grid gap-4 lg:grid-cols-3"
                >
                  <div className="lg:col-span-2">
                    <Card className="border-white/[0.06] bg-white/[0.02] shadow-none">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                          <DollarSign className="h-4 w-4" /> Global Price Disparity Matrix
                        </CardTitle>
                        <CardDescription className="text-white/30">Products ranked by highest-to-lowest regional price disparity vs. EU baseline</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[560px]">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-white/[0.06] hover:bg-transparent">
                                <TableHead className="text-[11px] text-white/40">Product</TableHead>
                                <TableHead className="text-[11px] text-white/40">Brand</TableHead>
                                <TableHead className="text-[11px] text-white/40">Category</TableHead>
                                <TableHead className="text-[11px] text-white/40 text-right">Max Disp.</TableHead>
                                <TableHead className="text-[11px] text-white/40 text-right">Hype</TableHead>
                                <TableHead className="text-[11px] text-white/40">Worst Region</TableHead>
                                <TableHead className="text-[11px] text-white/40 text-right">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredDisparity.map((row, idx) => (
                                <motion.tr
                                  key={row.productId}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.02, duration: 0.3 }}
                                  className={`cursor-pointer transition-colors hover:bg-white/[0.03] border-white/[0.04] ${
                                    selectedProduct?.productId === row.productId ? 'bg-amber-500/[0.08]' : ''
                                  }`}
                                  onClick={() => setSelectedProduct(row)}
                                >
                                  <TableCell>
                                    <div>
                                      <p className="text-xs font-medium text-white/90 truncate max-w-[180px]">{row.productName}</p>
                                      <p className="text-[10px] text-white/25">{row.sku}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-[10px] border-white/[0.1] text-white/60" style={{ borderColor: BRAND_COLORS[row.brand], color: BRAND_COLORS[row.brand] }}>
                                      {row.brand}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-[11px] text-white/50">{row.category}</TableCell>
                                  <TableCell className="text-right">
                                    <span className={`text-xs font-bold ${
                                      row.maxDisparityPct > 30 ? 'text-red-400' :
                                      row.maxDisparityPct > 15 ? 'text-amber-400' : 'text-emerald-400'
                                    }`}>
                                      {row.maxDisparityPct > 0 ? '+' : ''}{row.maxDisparityPct}%
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className={`text-xs font-semibold ${row.hypeScore > 70 ? 'text-orange-400' : 'text-white/50'}`}>
                                      {row.hypeScore}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-[10px]"
                                      style={{ backgroundColor: REGION_COLORS[row.maxDisparityRegion] + '20', color: REGION_COLORS[row.maxDisparityRegion], borderColor: REGION_COLORS[row.maxDisparityRegion] + '40' }}
                                    >
                                      {row.maxDisparityRegion}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right"><ChevronRight className="h-3.5 w-3.5 text-white/20 inline" /></TableCell>
                                </motion.tr>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                  <div>
                    <Card className="border-white/[0.06] bg-white/[0.02] shadow-none sticky top-20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-white/90">
                          <Layers className="h-4 w-4" /> Regional Breakdown
                        </CardTitle>
                        <CardDescription className="text-white/30">
                          {selectedProduct ? `${selectedProduct.productName} — ${selectedProduct.brand}` : 'Select a product to view details'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {selectedProduct ? (
                          <div className="space-y-3">
                            <div className="h-48">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={selectedProduct.regionalBreakdown} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                  <XAxis dataKey="region" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                                  <YAxis tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} tickFormatter={(v) => `${v}%`} />
                                  <RTooltip
                                    formatter={(value: number) => [`${value > 0 ? '+' : ''}${value}%`, 'Disparity']}
                                    contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)' }}
                                  />
                                  <Bar dataKey="disparityPct" radius={[4, 4, 0, 0]}>
                                    {selectedProduct.regionalBreakdown.map((rb, idx) => (
                                      <Cell key={idx} fill={REGION_COLORS[rb.region] || '#94a3b8'} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <Separator className="bg-white/[0.06]" />
                            <ScrollArea className="h-[280px]">
                              <div className="space-y-2">
                                {selectedProduct.regionalBreakdown.map((rb: RegionalBreakdown) => (
                                  <div key={rb.region} className="rounded-lg border border-white/[0.06] p-2.5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: REGION_COLORS[rb.region] }} />
                                        <span className="text-xs font-semibold text-white/80">{rb.region}</span>
                                      </div>
                                      <Badge className={`text-[9px] ${STOCK_COLORS[rb.stockStatus] || ''}`}>{rb.stockStatus}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                                      <div className="flex justify-between"><span className="text-white/30">Retail:</span><span className="font-medium text-white/70">{formatPrice(rb.price, rb.currency)}</span></div>
                                      <div className="flex justify-between"><span className="text-white/30">In EUR:</span><span className="font-medium text-white/70">&euro;{rb.priceInEUR.toLocaleString()}</span></div>
                                      <div className="flex justify-between"><span className="text-white/30">Disparity:</span><span className={`font-bold ${rb.disparityPct > 20 ? 'text-red-400' : rb.disparityPct > 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{rb.disparityPct > 0 ? '+' : ''}{rb.disparityPct}%</span></div>
                                      <div className="flex justify-between"><span className="text-white/30">Duty:</span><span className="font-medium text-white/60">{(rb.importDuty * 100).toFixed(1)}%</span></div>
                                      <div className="flex justify-between"><span className="text-white/30">Tax:</span><span className="font-medium text-white/60">{(rb.taxRate * 100).toFixed(0)}%</span></div>
                                      <div className="flex justify-between"><span className="text-white/30">Landed:</span><span className="font-bold text-white/90">&euro;{rb.totalLandedCost.toLocaleString()}</span></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 text-white/20">
                            <Tag className="h-8 w-8 mb-2" />
                            <p className="text-xs">Click a row to inspect</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══════ FEATURE SECTIONS ═══════ */}
            <AnimatePresence mode="wait">
              {activeSection === 'arbitrage' && <motion.div key="arbitrage" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ArbitragePanel /></motion.div>}
              {activeSection === 'hype' && <motion.div key="hype" variants={pageVariants} initial="initial" animate="animate" exit="exit"><HypePanel /></motion.div>}
              {activeSection === 'volatility' && <motion.div key="volatility" variants={pageVariants} initial="initial" animate="animate" exit="exit"><VolatilityPanel /></motion.div>}
              {activeSection === 'competitive' && <motion.div key="competitive" variants={pageVariants} initial="initial" animate="animate" exit="exit"><CompetitivePanel /></motion.div>}
              {activeSection === 'conflicts' && <motion.div key="conflicts" variants={pageVariants} initial="initial" animate="animate" exit="exit"><ConflictPanel /></motion.div>}
              {activeSection === 'stock-risk' && <motion.div key="stock-risk" variants={pageVariants} initial="initial" animate="animate" exit="exit"><StockRiskPanel /></motion.div>}
              {activeSection === 'optimizer' && <motion.div key="optimizer" variants={pageVariants} initial="initial" animate="animate" exit="exit"><OptimizerPanel /></motion.div>}
              {activeSection === 'history' && <motion.div key="history" variants={pageVariants} initial="initial" animate="animate" exit="exit"><HistoryPanel /></motion.div>}
              {activeSection === 'brand-pulse' && <motion.div key="brand-pulse" variants={pageVariants} initial="initial" animate="animate" exit="exit"><BrandPulsePanel /></motion.div>}
              {activeSection === 'watchlist' && <motion.div key="watchlist" variants={pageVariants} initial="initial" animate="animate" exit="exit"><WatchlistPanel /></motion.div>}
              {activeSection === 'runway' && <motion.div key="runway" variants={pageVariants} initial="initial" animate="animate" exit="exit"><RunwayPanel /></motion.div>}
              {activeSection === 'vip' && <motion.div key="vip" variants={pageVariants} initial="initial" animate="animate" exit="exit"><VIPPanel /></motion.div>}
              {activeSection === 'sustainability' && <motion.div key="sustainability" variants={pageVariants} initial="initial" animate="animate" exit="exit"><SustainabilityPanel /></motion.div>}
              {activeSection === 'trends' && <motion.div key="trends" variants={pageVariants} initial="initial" animate="animate" exit="exit"><TrendForecastPanel /></motion.div>}
              {activeSection === 'drop-queue' && <motion.div key="drop-queue" variants={pageVariants} initial="initial" animate="animate" exit="exit"><DropQueuePanel /></motion.div>}
            </AnimatePresence>

            {/* Brand legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-4 border-t border-white/[0.06]">
              {brands.map(b => (
                <div key={b.id} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[b.name] }} />
                  <span className="text-[10px] font-medium text-white/40">{b.name}</span>
                  <span className="text-[10px] text-white/20">({b._count.products})</span>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

function KPICard({ icon, label, value, accent }: {
  icon: React.ReactNode; label: string; value: React.ReactNode; accent: string
}) {
  const accentMap: Record<string, string> = {
    stone: 'bg-white/[0.02] border-white/[0.06]',
    amber: 'bg-amber-500/[0.06] border-amber-500/20',
    red: 'bg-red-500/[0.06] border-red-500/20',
    violet: 'bg-violet-500/[0.06] border-violet-500/20',
  }
  const iconMap: Record<string, string> = {
    stone: 'text-white/40', amber: 'text-amber-400', red: 'text-red-400', violet: 'text-violet-400',
  }
  return (
    <motion.div
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={`rounded-lg border p-3 ${accentMap[accent] || accentMap.stone} transition-colors`}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={iconMap[accent] || iconMap.stone}>{icon}</span>
        <span className="text-[10px] font-medium text-white/30 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-bold text-white/90">{value}</p>
    </motion.div>
  )
}
