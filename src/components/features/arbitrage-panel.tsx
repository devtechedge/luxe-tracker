'use client'

import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { PanelShell } from '@/components/ui/panel-shell'
import { getArbitrage } from '@/lib/analytics'
import { fmtEUR } from '@/lib/utils'

export function ArbitragePanel() {
  const data = useMemo(() => getArbitrage(), [])
  const [filter, setFilter] = useState<'all' | 'high'>('all')

  const filtered = useMemo(() => {
    return filter === 'high'
      ? data.topOpportunities.filter((o) => o.savingsPct >= 15)
      : data.topOpportunities.slice(0, 25)
  }, [data, filter])

  const headline = data.topOpportunities[0]

  return (
    <PanelShell
      category="Pricing"
      title="Arbitrage Opportunity Finder"
      subtitle={`${data.totalOpportunities} profitable routes · ${data.avgSavingsPct.toFixed(1)}% average savings`}
      caption="Buy from a low-priced region and ship to a high-priced region. Savings calculated net of shipping and import duty."
    >
      {/* === HEADLINE - explicit 2-column grid with explicit constraints === */}
      {headline && (
        <section className="mb-12">
          <div className="rule" />
          <div className="grid grid-cols-1 gap-10 py-8 md:grid-cols-2 md:gap-12">
            {/* Left: opportunity details - explicit fixed column */}
            <div className="min-w-0">
              <div className="label mb-3">Top Opportunity</div>
              <h3 className="font-display text-[24px] font-medium leading-[1.15] tracking-tight text-[var(--color-ink)]">
                {headline.productName}
              </h3>
              <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                {headline.brand} · {headline.category} · {headline.sku}
              </p>

              <div className="mt-6 grid grid-cols-[auto,1fr] items-baseline gap-x-3 gap-y-1">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                  Route
                </span>
                <span className="font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                  {headline.buyFromRegion} → {headline.shipToRegion}
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                  Stock
                </span>
                <span className="font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                  {headline.stockLevelAtSource}% available
                </span>
              </div>
            </div>

            {/* Right: savings - explicit fixed column */}
            <div className="min-w-0 border-t border-[var(--color-border)] pt-6 lg:border-l lg:border-t-0 lg:border-[var(--color-border)] lg:pl-8 lg:pt-0">
              <div className="label mb-3">Net Savings</div>
              <div className="font-display text-[64px] font-medium leading-none tracking-tight text-[var(--color-accent)]">
                {fmtEUR(headline.savingsEUR, 0)}
              </div>
              <div className="mt-2 font-mono text-[14px] tabular-nums text-[var(--color-ink)]">
                {headline.savingsPct.toFixed(1)}%
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                vs local purchase
              </div>
            </div>
          </div>
        </section>
      )}

      {/* === FILTER + LIST === */}
      <section>
        <div className="rule" />
        <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)]">
          <div className="flex items-center gap-1">
            <span className="mr-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
              Filter
            </span>
            <button
              onClick={() => setFilter('all')}
              className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                filter === 'all'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                filter === 'high'
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              High (15%+)
            </button>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-subtle)]">
            {filtered.length} routes
          </span>
        </div>

        <div>
          {filtered.map((opp, i) => (
            <article
              key={`${opp.productId}-${opp.buyFromRegion}-${opp.shipToRegion}-${i}`}
              className="grid grid-cols-1 gap-3 border-b border-[var(--color-border)] py-4 transition-colors hover:bg-[var(--color-surface)] md:grid-cols-[1fr,auto,120px]"
            >
              <div className="min-w-0">
                <div className="text-[13px] text-[var(--color-ink)]">{opp.productName}</div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                  <span>{opp.brand}</span>
                  <span>·</span>
                  <span>{opp.buyFromRegion} → {opp.shipToRegion}</span>
                  <span>·</span>
                  <span>ship {fmtEUR(opp.shippingCostEUR, 0)}</span>
                  <span>·</span>
                  <span>duty {(opp.importDutyApplied * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="hidden text-right font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)] md:block">
                {fmtEUR(opp.buyAtPrice, 0).replace('€', '')} {opp.buyCurrency}
              </div>
              <div className="flex items-baseline justify-between md:justify-end md:gap-3">
                <span className="font-mono text-[14px] tabular-nums text-[var(--color-accent)] md:text-[18px]">
                  {opp.savingsPct.toFixed(1)}%
                </span>
                <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-subtle)]">
                  {fmtEUR(opp.savingsEUR, 0)}
                </span>
              </div>
            </article>
          ))}
        </div>
        <div className="rule mt-1" />
      </section>
    </PanelShell>
  )
}
