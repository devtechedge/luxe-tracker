'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts'
import { PanelShell, ChartTooltip } from '@/components/ui/panel-shell'
import { getHype } from '@/lib/analytics'

export function HypePredictor() {
  const data = useMemo(() => getHype(), [])
  const [category, setCategory] = useState<string>('all')

  const filtered = useMemo(() => {
    return category === 'all'
      ? data.topHyped
      : data.allProducts.filter((p) => p.category === category)
  }, [data, category])

  const featured = filtered[0]
  const categories = Array.from(new Set(data.allProducts.map((p) => p.category)))

  return (
    <PanelShell
      category="Market"
      title="Launch Hype Predictor"
      subtitle={`Predicted demand for ${data.totalProducts} products · average hype ${data.avgHypeScore}`}
      caption="Composite score blending brand tier, category demand, season timing, exclusivity, and time-decay."
    >
      {/* === HEADLINE - two-column grid with explicit min-height === */}
      {featured && (
        <section className="mb-12">
          <div className="rule" />
          <div className="grid grid-cols-1 gap-8 py-5 lg:grid-cols-[1fr,300px]">
            {/* Left: text content */}
            <div>
              <div className="label mb-3">Top Hyped · {featured.brand}</div>
              <h3 className="font-display text-[26px] font-medium leading-[1.15] tracking-tight text-[var(--color-ink)]">
                {featured.productName}
              </h3>
              <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                {featured.sku} · {featured.category} · {featured.season}
              </p>

              {/* Hero number + launch info, EXPLICIT 2-column grid */}
              <div className="mt-8 grid grid-cols-[auto,1fr] items-end gap-x-8 gap-y-1">
                <div>
                  <div className="label mb-2">Hype Index</div>
                  <div className="font-display text-[72px] font-medium leading-none tracking-tight text-[var(--color-accent)]">
                    {featured.hypeScore}
                  </div>
                </div>
                <div className="pb-2">
                  <div className="label mb-2">Launch</div>
                  <div className="font-display text-[20px] tabular-nums text-[var(--color-ink)]">
                    {featured.daysToLaunch !== null
                      ? `T-${featured.daysToLaunch}d`
                      : 'Past'}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                    {featured.launchRegion ?? '—'} · {featured.launchType ?? '—'}
                  </div>
                </div>
              </div>

              {/* Breakdown bars - explicit 5-col grid with fixed height */}
              <div className="mt-8 grid grid-cols-5 gap-px border border-[var(--color-border)] bg-[var(--color-border)]">
                {featured.hypeBreakdown &&
                  Object.entries(featured.hypeBreakdown).map(([key, val]) => (
                    <div
                      key={key}
                      className="flex h-20 flex-col items-center justify-center bg-[var(--color-bg)] px-2"
                    >
                      <div className="font-mono text-[14px] tabular-nums text-[var(--color-ink)]">
                        {val}
                      </div>
                      <div className="mt-1 text-[9px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                        {key
                          .replace('brandTier', 'Brand')
                          .replace('category', 'Cat')
                          .replace('season', 'Season')
                          .replace('exclusivity', 'Excl.')
                          .replace('decay', 'Decay')}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right: radar chart in its own column */}
            <div className="lg:border-l lg:border-[var(--color-border)] lg:pl-8">
              <div className="label mb-3">5-Dimension Profile</div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={[
                      { axis: 'Brand', value: featured.hypeBreakdown?.brandTier ?? 0 },
                      { axis: 'Cat.', value: featured.hypeBreakdown?.category ?? 0 },
                      { axis: 'Season', value: featured.hypeBreakdown?.season ?? 0 },
                      { axis: 'Excl.', value: featured.hypeBreakdown?.exclusivity ?? 0 },
                      { axis: 'Decay', value: featured.hypeBreakdown?.decay ?? 0 },
                    ]}
                    margin={{ top: 16, right: 24, bottom: 16, left: 24 }}
                  >
                    <PolarGrid stroke="var(--color-border)" />
                    <PolarAngleAxis
                      dataKey="axis"
                      stroke="var(--color-ink-muted)"
                      fontSize={10}
                      tick={{ fill: 'var(--color-ink-muted)' }}
                    />
                    <PolarRadiusAxis
                      stroke="var(--color-ink-faint)"
                      fontSize={9}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name="Hype"
                      dataKey="value"
                      stroke="var(--color-accent)"
                      fill="var(--color-accent)"
                      fillOpacity={0.2}
                      strokeWidth={1.5}
                    />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === CATEGORY FILTER === */}
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)]">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
            Filter
          </span>
          <button
            onClick={() => setCategory('all')}
            className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              category === 'all'
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                category === c
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-subtle)]">
          {filtered.length} products
        </span>
      </div>

      {/* === HYPED GRID - explicit fixed-height cards, no overlap possible === */}
      <section>
        <div className="grid grid-cols-1 gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-2 xl:grid-cols-3">
          {filtered.slice(0, 12).map((p) => (
            <article
              key={p.productId}
              className="flex h-32 flex-col justify-between bg-[var(--color-bg)] p-4 transition-colors hover:bg-[var(--color-surface)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div
                    className="line-clamp-2 text-[12px] text-[var(--color-ink)]"
                    title={p.productName}
                  >
                    {p.productName}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    {p.brand}
                  </div>
                </div>
                <div className="shrink-0 font-mono text-[22px] tabular-nums text-[var(--color-accent)]">
                  {p.hypeScore}
                </div>
              </div>
              <div className="h-0.5 w-full overflow-hidden bg-[var(--color-surface-2)]">
                <div
                  className="h-full bg-[var(--color-accent)]"
                  style={{ width: `${p.hypeScore}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </PanelShell>
  )
}
