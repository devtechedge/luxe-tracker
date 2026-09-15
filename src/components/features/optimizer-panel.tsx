'use client'

import { useMemo, useState } from 'react'
import { PanelShell } from '@/components/ui/panel-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getOptimizer } from '@/lib/analytics'
import { getProducts } from '@/lib/analytics'
import { fmtEUR } from '@/lib/utils'

const TARGET_REGIONS = ['EU', 'US', 'UK', 'Norway', 'India']

export function OptimizerPanel() {
  const products = useMemo(() => getProducts(), [])
  const [productId, setProductId] = useState(products[0]?.id || '')
  const [targetRegion, setTargetRegion] = useState('US')

  const result = useMemo(
    () => getOptimizer(productId, targetRegion),
    [productId, targetRegion],
  )

  if (!result) return null

  return (
    <PanelShell
      category="Pricing"
      title="Landed Cost Optimizer"
      subtitle="Cheapest route to acquire a product in your target region"
      caption="Compares buy-local vs buy-elsewhere-shipping, factoring shipping cost and import duty. Saves = local price minus landed cost."
    >
      <section className="mb-8">
        <div className="rule" />
        <div className="grid grid-cols-1 gap-8 py-5 lg:grid-cols-[1fr,300px]">
          <div>
            <label className="mb-2 block label">Product</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brand.name} - {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block label">Target region</label>
            <div className="flex gap-1">
              {TARGET_REGIONS.map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={targetRegion === r ? 'default' : 'outline'}
                  onClick={() => setTargetRegion(r)}
                  className="flex-1"
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Best route highlight */}
      <section className="mb-8">
        <div className="rule" />
        <div className="grid grid-cols-1 gap-8 py-5 md:grid-cols-[1fr,1fr]">
          <div>
            <div className="label mb-1">Best route</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-display text-[44px] font-medium leading-none tracking-tight text-[var(--color-ink)]">
                {result.bestRoute.sourceRegion}
              </span>
              <span className="text-[12px] text-[var(--color-ink-muted)]">→ {targetRegion}</span>
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
              Stock {result.bestRoute.stockLevelAtSource}% · {result.bestRoute.stockStatusAtSource}
            </div>
          </div>
          <div>
            <div className="label">Landed cost</div>
            <div className="hero-num mt-1 text-[64px] tabular-nums text-[var(--color-ink)]">
              {fmtEUR(result.bestRoute.totalLandedCostEUR, 0)}
            </div>
            <div className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
              vs{' '}
              <span className="font-mono tabular-nums">{fmtEUR(result.localPriceEUR, 0)}</span> local · saves{' '}
              <span
                className={`font-mono tabular-nums ${
                  result.potentialSavingsEUR > 0 ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                }`}
              >
                {fmtEUR(result.potentialSavingsEUR, 0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* All routes table */}
      <section>
        <div className="rule" />
        <div className="py-5">
          <div className="label">All routes compared</div>
        </div>
        <table className="w-full text-[12px] tabular-nums">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="py-2 text-left"><span className="label">Source</span></th>
              <th className="px-3 text-right"><span className="label">Local Price</span></th>
              <th className="px-3 text-right"><span className="label">+ Ship</span></th>
              <th className="px-3 text-right"><span className="label">+ Duty</span></th>
              <th className="px-3 text-right"><span className="label">Total</span></th>
              <th className="px-3 text-right"><span className="label">vs Local</span></th>
            </tr>
          </thead>
          <tbody>
            {result.allRoutes.map((r) => (
              <tr
                key={r.sourceRegion}
                className={`border-b border-[var(--color-border)] data-row ${
                  r.isLocalPurchase ? 'bg-[var(--color-surface-2)]' : ''
                }`}
              >
                <td className="py-2.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[var(--color-ink)]">{r.sourceRegion}</span>
                    {r.isLocalPurchase && (
                      <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-warning)]">
                        local
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                    Stock {r.stockLevelAtSource}%
                  </div>
                </td>
                <td className="px-3 text-right font-mono text-[var(--color-ink-muted)]">
                  {fmtEUR(r.sourcePriceEUR, 0)}
                </td>
                <td className="px-3 text-right font-mono text-[var(--color-ink-subtle)]">
                  +{fmtEUR(r.shippingCostEUR, 0)}
                </td>
                <td className="px-3 text-right font-mono text-[var(--color-ink-subtle)]">
                  +{fmtEUR(r.importDutyAmountEUR, 0)}
                </td>
                <td className="px-3 text-right font-mono font-medium text-[var(--color-ink)]">
                  {fmtEUR(r.totalLandedCostEUR, 0)}
                </td>
                <td
                  className={`px-3 text-right font-mono ${
                    r.isLocalPurchase
                      ? 'text-[var(--color-ink-faint)]'
                      : r.savingsVsLocalPct > 0
                        ? 'text-[var(--color-positive)]'
                        : 'text-[var(--color-negative)]'
                  }`}
                >
                  {r.isLocalPurchase
                    ? '—'
                    : r.savingsVsLocalPct > 0
                      ? `+${r.savingsVsLocalPct.toFixed(1)}%`
                      : `${r.savingsVsLocalPct.toFixed(1)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rule mt-1" />
      </section>
    </PanelShell>
  )
}
