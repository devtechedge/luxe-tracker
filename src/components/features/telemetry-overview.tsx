'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { getTelemetry } from '@/lib/analytics'
import { fmtNum } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { PanelShell, ChartPanel, EditorialTooltip } from '@/components/ui/panel-shell'

export function TelemetryOverview() {
  const data = useMemo(() => getTelemetry(), [])
  const o = data.overview

  // 8 headline KPIs, presented as editorial metric strips
  const metrics = [
    { label: 'Products', value: fmtNum(o.totalProducts), trend: null, accent: false },
    { label: 'Brands', value: fmtNum(o.totalBrands), trend: null, accent: false },
    { label: 'Launches', value: fmtNum(o.totalLaunches), trend: null, accent: false },
    { label: 'Avg Disparity', value: `${o.avgDisparityOverall >= 0 ? '+' : ''}${o.avgDisparityOverall.toFixed(2)}%`, trend: o.avgDisparityOverall > 0 ? 'up' : 'down', accent: false },
    { label: 'Max Disparity', value: `${o.maxDisparityOverall.toFixed(1)}%`, trend: 'up', accent: true },
    { label: 'Avg Hype', value: String(o.avgHypeScore), trend: null, accent: false },
    { label: 'High-Duty', value: fmtNum(o.highDutyProducts), trend: null, accent: false },
    { label: 'Low Stock', value: fmtNum(o.limitedStockCount), trend: null, accent: false },
  ]

  // Currency rates strip
  const rates = data.currencyRates.slice(0, 4)

  return (
    <PanelShell
      category="Intelligence"
      title="Live Telemetry"
      subtitle="Updated every second"
    >
      {/* ============================================================ */}
      {/* HERO - editorial metric strip                                  */}
      {/* ============================================================ */}
      <section className="pb-5">
        {/* Massive headline number - the hero metric */}
        <div className="mb-8 flex items-baseline gap-4">
          <span className="hero-num text-[48px] text-[var(--color-ink)] md:text-[64px] lg:text-[80px]">
            {o.maxDisparityOverall.toFixed(1)}
            <span className="text-[28px] text-[var(--color-ink-subtle)] md:text-[36px] lg:text-[44px]">%</span>
          </span>
          <div className="pb-3">
            <div className="label">Maximum Markup vs EU</div>
            <div className="mt-1 flex items-center gap-1 text-[12px] text-[var(--color-ink-muted)]">
              <ArrowUpRight className="size-3.5 text-[var(--color-negative)]" />
              <span>Across 5 maisons, 5 regions, 25 SKUs</span>
            </div>
          </div>
        </div>

        {/* Metric grid - 8 columns of typographic numbers */}
        <div className="rule" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 py-6 md:grid-cols-4 lg:grid-cols-8">
          {metrics.map((m) => (
            <div key={m.label} className="min-w-0">
              <div className="label mb-1.5">{m.label}</div>
              <div
                className={`hero-num text-[26px] ${
                  m.accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
                }`}
              >
                {m.value}
              </div>
              {m.trend && (
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--color-ink-subtle)]">
                  {m.trend === 'up' ? (
                    <ArrowUpRight className="size-2.5 text-[var(--color-negative)]" />
                  ) : (
                    <ArrowDownRight className="size-2.5 text-[var(--color-positive)]" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Currency rates - inline data strip */}
        <div className="rule" />
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2 py-5">
          <span className="label">FX Rates</span>
          {rates.map((r) => (
            <div key={r.pair} className="flex items-baseline gap-2">
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                {r.pair}
              </span>
              <span className="font-mono text-[13px] tabular-nums text-[var(--color-ink)]">
                {r.rate.toFixed(4)}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================ */}
      {/* DATA SECTION - typography-first, minimal chrome                */}
      {/* ============================================================ */}
      <div className="rule" />
      <section className="grid grid-cols-1 gap-8 py-5 lg:grid-cols-2">
        <ChartPanel
          label="By Region"
          title="Markup vs EU baseline, by region"
          caption="Higher = more expensive than EU. India carries the highest premium."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.regionSummary} layout="vertical" margin={{ left: 0, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" horizontal={false} />
              <XAxis
                type="number"
                stroke="var(--color-ink-subtle)"
                fontSize={10}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="region"
                type="category"
                stroke="var(--color-ink-muted)"
                fontSize={11}
                width={64}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<EditorialTooltip />} cursor={{ fill: 'var(--color-surface-2)' }} />
              <Bar dataKey="avgDisparityPct" fill="var(--color-accent)" radius={[0, 1, 1, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel
          label="By Brand"
          title="Markup vs EU baseline, by maison"
          caption="Louis Vuitton maintains tightest global pricing discipline."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.brandSummary} layout="vertical" margin={{ left: 0, right: 24, top: 8, bottom: 0 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" horizontal={false} />
              <XAxis
                type="number"
                stroke="var(--color-ink-subtle)"
                fontSize={10}
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="brand"
                type="category"
                stroke="var(--color-ink-muted)"
                fontSize={11}
                width={92}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<EditorialTooltip />} cursor={{ fill: 'var(--color-surface-2)' }} />
              <Bar dataKey="avgDisparityPct" fill="var(--color-accent)" radius={[0, 1, 1, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
    </PanelShell>
  )
}
