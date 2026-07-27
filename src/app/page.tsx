'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { Sun, Moon, Menu, X } from 'lucide-react'

import { TelemetryOverview } from '@/components/features/telemetry-overview'
import { PriceMatrix } from '@/components/features/price-matrix'
import { LaunchCalendar } from '@/components/features/launch-calendar'
import { ArbitragePanel } from '@/components/features/arbitrage-panel'
import { OptimizerPanel } from '@/components/features/optimizer-panel'
import { PriceHistory } from '@/components/features/price-history'
import { FxVolatility } from '@/components/features/fx-volatility'
import { HypePredictor } from '@/components/features/hype-predictor'
import { LaunchConflicts } from '@/components/features/launch-conflicts'
import { StockRisk } from '@/components/features/stock-risk'
import { CompetitiveMatrix } from '@/components/features/competitive-matrix'
import { BrandPulse } from '@/components/features/brand-pulse'
import { RunwayPanel } from '@/components/features/runway-panel'
import { VipPanel } from '@/components/features/vip-panel'
import { SustainabilityPanel } from '@/components/features/sustainability-panel'
import { TrendForecastPanel } from '@/components/features/trend-forecast-panel'
import { DropQueuePanel } from '@/components/features/drop-queue-panel'
import { WatchlistPanel, AlertsPanel } from '@/components/features/watchlist-panel'
import { useTheme } from '@/lib/theme'

type PanelId =
  | 'overview'
  | 'price-matrix'
  | 'launch-calendar'
  | 'arbitrage'
  | 'optimizer'
  | 'price-history'
  | 'fx-volatility'
  | 'hype-predictor'
  | 'launch-conflicts'
  | 'stock-risk'
  | 'competitive-matrix'
  | 'brand-pulse'
  | 'runway'
  | 'vip-tier'
  | 'sustainability'
  | 'trend-forecast'
  | 'drop-queue'
  | 'watchlist'
  | 'alerts'

interface NavItem {
  id: PanelId
  label: string
  category: 'Intelligence' | 'Pricing' | 'Market' | 'Luxury' | 'Personal'
}

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', category: 'Intelligence' },
  { id: 'launch-calendar', label: 'Launch Calendar', category: 'Intelligence' },
  { id: 'price-matrix', label: 'Price Matrix', category: 'Intelligence' },
  { id: 'arbitrage', label: 'Arbitrage Finder', category: 'Pricing' },
  { id: 'optimizer', label: 'Landed Cost Optimizer', category: 'Pricing' },
  { id: 'price-history', label: 'Price History', category: 'Pricing' },
  { id: 'fx-volatility', label: 'FX Volatility', category: 'Pricing' },
  { id: 'hype-predictor', label: 'Hype Predictor', category: 'Market' },
  { id: 'launch-conflicts', label: 'Launch Conflicts', category: 'Market' },
  { id: 'stock-risk', label: 'Stock-Out Risk', category: 'Market' },
  { id: 'competitive-matrix', label: 'Competitive Matrix', category: 'Market' },
  { id: 'brand-pulse', label: 'Brand Pulse', category: 'Market' },
  { id: 'runway', label: 'Runway Tracker', category: 'Luxury' },
  { id: 'vip-tier', label: 'VIP Tier Simulator', category: 'Luxury' },
  { id: 'sustainability', label: 'Sustainability', category: 'Luxury' },
  { id: 'trend-forecast', label: 'Trend Forecast', category: 'Luxury' },
  { id: 'drop-queue', label: 'Drop Queue', category: 'Luxury' },
  { id: 'watchlist', label: 'Watchlist', category: 'Personal' },
  { id: 'alerts', label: 'Alerts', category: 'Personal' },
]

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState<PanelId>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const { theme, toggle, hydrated } = useTheme()

  const grouped = NAV.reduce<Record<string, NavItem[]>>((acc, item) => {
    ;(acc[item.category] = acc[item.category] || []).push(item)
    return acc
  }, {})

  const activeItem = NAV.find((n) => n.id === activePanel)

  function handleNav(id: PanelId) {
    setActivePanel(id)
    setMobileNavOpen(false)
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1500px] gap-0">
        {/* ============================================================ */}
        {/* SIDEBAR — desktop (sticky) + mobile (slide-over drawer)       */}
        {/* ============================================================ */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] lg:block">
          <SidebarContent grouped={grouped} activePanel={activePanel} onNav={handleNav} />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside className="relative flex h-full w-[280px] flex-col bg-[var(--color-bg)] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-medium tracking-tight text-[var(--color-ink)]">
                    Luxe
                  </span>
                  <span className="font-display text-xl font-medium tracking-tight text-[var(--color-accent)]">
                    Tracker
                  </span>
                </div>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent grouped={grouped} activePanel={activePanel} onNav={handleNav} />
              </div>
            </aside>
          </div>
        )}

        {/* ============================================================ */}
        {/* MAIN CONTENT                                                  */}
        {/* ============================================================ */}
        <main className="min-w-0 flex-1">
          {/* TOP BAR */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-4 py-4 backdrop-blur-md md:px-8">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <div className="flex items-baseline gap-3">
                <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                  {activeItem?.category ?? 'Luxe'}
                </span>
                <span className="text-[var(--color-ink-faint)]">/</span>
                <h1 className="font-display text-base font-medium tracking-tight text-[var(--color-ink)]">
                  {activeItem?.label ?? 'Overview'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} toggle={toggle} hydrated={hydrated} />
            </div>
          </header>

          {/* PANEL CONTENT — responsive horizontal padding */}
          <div key={activePanel} className="fade-in px-4 py-6 md:px-8 md:py-8">
            {activePanel === 'overview' && <TelemetryOverview />}
            {activePanel === 'price-matrix' && <PriceMatrix />}
            {activePanel === 'launch-calendar' && <LaunchCalendar />}
            {activePanel === 'arbitrage' && <ArbitragePanel />}
            {activePanel === 'optimizer' && <OptimizerPanel />}
            {activePanel === 'price-history' && <PriceHistory />}
            {activePanel === 'fx-volatility' && <FxVolatility />}
            {activePanel === 'hype-predictor' && <HypePredictor />}
            {activePanel === 'launch-conflicts' && <LaunchConflicts />}
            {activePanel === 'stock-risk' && <StockRisk />}
            {activePanel === 'competitive-matrix' && <CompetitiveMatrix />}
            {activePanel === 'brand-pulse' && <BrandPulse />}
            {activePanel === 'runway' && <RunwayPanel />}
            {activePanel === 'vip-tier' && <VipPanel />}
            {activePanel === 'sustainability' && <SustainabilityPanel />}
            {activePanel === 'trend-forecast' && <TrendForecastPanel />}
            {activePanel === 'drop-queue' && <DropQueuePanel />}
            {activePanel === 'watchlist' && (
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <WatchlistPanel />
                <AlertsPanel />
              </div>
            )}
            {activePanel === 'alerts' && <AlertsPanel />}
          </div>
        </main>
      </div>
    </div>
  )
}

// ============================================================
// SIDEBAR CONTENT — shared between desktop and mobile drawer
// ============================================================
function SidebarContent({
  grouped,
  activePanel,
  onNav,
}: {
  grouped: Record<string, NavItem[]>
  activePanel: PanelId
  onNav: (id: PanelId) => void
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Brand mark — desktop only (mobile has its own) */}
      <div className="px-6 pt-7 pb-6 hidden lg:block">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-xl font-medium tracking-tight text-[var(--color-ink)]">
            Luxe
          </span>
          <span className="font-display text-xl font-medium tracking-tight text-[var(--color-accent)]">
            Tracker
          </span>
        </div>
      </div>

      <div className="rule mx-6 hidden lg:block" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 lg:py-5 pt-2 lg:pt-5">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-5">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
              {category}
            </div>
            <ul className="space-y-px">
              {items.map((item) => {
                const isActive = activePanel === item.id
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onNav(item.id)}
                      className={`group flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-left text-[13px] transition-colors ${
                        isActive
                          ? 'bg-[var(--color-surface-2)] text-[var(--color-ink)]'
                          : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="size-1 rounded-full bg-[var(--color-accent)]" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

// ============================================================
// THEME TOGGLE — clean editorial pill
// ============================================================
function ThemeToggle({
  theme,
  toggle,
  hydrated,
}: {
  theme: 'dark' | 'light'
  toggle: () => void
  hydrated: boolean
}) {
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="group flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-muted)] transition-all hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
    >
      {hydrated && theme === 'dark' ? (
        <>
          <Moon className="size-3" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun className="size-3" />
          <span>Light</span>
        </>
      )}
    </button>
  )
}
