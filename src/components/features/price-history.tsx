'use client'

import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { getPriceHistory } from '@/lib/analytics'
import { getSnapshot } from '@/lib/data-snapshot'
import { fmtPct } from '@/lib/utils'
import { PanelShell } from '@/components/ui/panel-shell'

export function PriceHistory() {
  const data = useMemo(() => getPriceHistory(), [])
  const snap = getSnapshot()
  const [featuredIdx, setFeaturedIdx] = useState(0)

  const featuredSeries = useMemo(() => {
    if (data.topMovers.length === 0) return null
    const top = data.topMovers[featuredIdx] ?? data.topMovers[0]
    const product = snap.products.find((p) => p.id === top.productId)
    if (!product) return null
    const series = product.priceHistory
      .filter((ph) => ph.region === top.region)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((ph) => ({
        date: ph.date.slice(5),
        price: ph.price,
      }))
    return { ...top, series, product }
  }, [data, snap, featuredIdx])

  return (
    <PanelShell
      category="Pricing"
      title="Price History & Trend Charts"
      subtitle={`90-day daily series · ${data.totalSeries} tracked combinations · ${data.totalAnomalies} anomalies (≥3% daily moves)`}
    >
      {/* FEATURED CHART */}
      {featuredSeries && (
        <section className="mb-8">
          <div className="rule" />
          <div className="grid grid-cols-1 gap-8 py-5 lg:grid-cols-[1fr,300px]">
            {/* Chart */}
            <div>
              <div className="mb-1 flex items-baseline gap-2">
                <span className="label">Featured</span>
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                  Most volatile in dataset
                </span>
              </div>
              <h3 className="font-display text-[20px] font-medium tracking-tight text-[var(--color-ink)]">
                {featuredSeries.productName}
              </h3>
              <p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">
                {featuredSeries.brand} · {featuredSeries.region} ·{' '}
                {featuredSeries.series.length} data points over 90 days
              </p>

              <div className="mt-4 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={featuredSeries.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="var(--color-ink-subtle)"
                      fontSize={10}
                      interval="preserveStartEnd"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--color-ink-subtle)"
                      fontSize={10}
                      domain={['dataMin - 50', 'dataMax + 50']}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => v.toFixed(0)}
                    />
                    <Tooltip content={<PriceTooltip />} cursor={{ stroke: 'var(--color-ink-faint)' }} />
                    <ReferenceLine
                      y={featuredSeries.startPrice}
                      stroke="var(--color-ink-faint)"
                      strokeDasharray="2 4"
                      label={{
                        value: 'Start',
                        position: 'right',
                        fill: 'var(--color-ink-subtle)',
                        fontSize: 9,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="var(--color-accent)"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Headline metric - border-l only on lg+ */}
            <div className="flex flex-col justify-center lg:border-l lg:border-[var(--color-border)] lg:pl-8">
              <div className="label">90-day change</div>
              <div
                className={`hero-num mt-2 text-[48px] md:text-[56px] lg:text-[64px] ${
                  featuredSeries.change90dPct >= 0
                    ? 'text-[var(--color-negative)]'
                    : 'text-[var(--color-positive)]'
                }`}
              >
                {featuredSeries.change90dPct >= 0 ? '+' : ''}
                {featuredSeries.change90dPct.toFixed(1)}
                <span className="text-[28px] md:text-[32px] lg:text-[36px]">%</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[12px] text-[var(--color-ink-muted)]">
                {featuredSeries.change90dPct >= 0 ? (
                  <ArrowUpRight className="size-3.5 text-[var(--color-negative)]" />
                ) : (
                  <ArrowDownRight className="size-3.5 text-[var(--color-positive)]" />
                )}
                <span>
                  {featuredSeries.startPrice.toFixed(0)} → {featuredSeries.endPrice.toFixed(0)}{' '}
                  {featuredSeries.currency}
                </span>
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                {featuredSeries.anomalyCount} anomaly
                {featuredSeries.anomalyCount === 1 ? '' : 'ies'} flagged
              </div>

              {/* Selector for other top movers */}
              {data.topMovers.length > 1 && (
                <div className="mt-6">
                  <div className="label mb-2">Switch featured</div>
                  <div className="space-y-px">
                    {data.topMovers.slice(0, 5).map((m, i) => (
                      <button
                        key={`${m.productId}-${m.region}-${i}`}
                        onClick={() => setFeaturedIdx(i)}
                        className={`flex w-full items-baseline justify-between gap-2 rounded px-2 py-1 text-left text-[11px] transition-colors ${
                          i === featuredIdx
                            ? 'bg-[var(--color-surface-2)] text-[var(--color-ink)]'
                            : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                        }`}
                      >
                        <span className="truncate">{m.productName}</span>
                        <span
                          className={`font-mono tabular-nums ${
                            m.change90dPct >= 0
                              ? 'text-[var(--color-negative)]'
                              : 'text-[var(--color-positive)]'
                          }`}
                        >
                          {fmtPct(m.change90dPct)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TOP MOVERS TABLE */}
      <section>
        <div className="rule" />
        <div className="py-5">
          <div className="label mb-2">Top Movers</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-[12px] tabular-nums">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-2 text-left"><span className="label">Product</span></th>
                <th className="px-3 text-left"><span className="label">Region</span></th>
                <th className="px-3 text-right"><span className="label">Start</span></th>
                <th className="px-3 text-right"><span className="label">Now</span></th>
                <th className="px-3 text-right"><span className="label">90d</span></th>
                <th className="px-3 text-right"><span className="label">Anomalies</span></th>
              </tr>
            </thead>
            <tbody>
              {data.topMovers.slice(0, 15).map((m, i) => (
                <tr
                  key={`${m.productId}-${m.region}`}
                  className={`border-b border-[var(--color-border)] data-row ${
                    i % 2 === 1 ? 'bg-[var(--color-surface)]' : ''
                  }`}
                >
                  <td className="py-2.5">
                    <div className="text-[var(--color-ink)]">{m.productName}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                      {m.brand}
                    </div>
                  </td>
                  <td className="px-3 text-[var(--color-ink-muted)]">{m.region}</td>
                  <td className="px-3 text-right font-mono text-[var(--color-ink-muted)]">
                    {m.startPrice.toFixed(0)}
                  </td>
                  <td className="px-3 text-right font-mono text-[var(--color-ink)]">
                    {m.endPrice.toFixed(0)}
                  </td>
                  <td
                    className={`px-3 text-right font-mono ${
                      m.change90dPct > 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
                    }`}
                  >
                    {fmtPct(m.change90dPct)}
                  </td>
                  <td className="px-3 text-right font-mono text-[var(--color-accent)]">
                    {m.anomalyCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rule mt-1" />
      </section>
    </PanelShell>
  )
}

function PriceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 shadow-xl">
      <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-[13px] tabular-nums text-[var(--color-ink)]">
        {payload[0].value.toFixed(2)}
      </div>
    </div>
  )
}
