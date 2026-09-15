'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { getProducts } from '@/lib/analytics'
import { fmtEUR } from '@/lib/utils'
import { PanelShell } from '@/components/ui/panel-shell'

const REGIONS = ['EU', 'US', 'UK', 'Norway', 'India'] as const
type Region = (typeof REGIONS)[number]

export function PriceMatrix() {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'disparity' | 'name' | 'price'>('disparity')

  const products = useMemo(() => {
    const all = getProducts()
    return all
      .filter(
        (p) =>
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        if (sortBy === 'price')
          return (b.disparity?.maxDisparity?.priceInEUR || 0) - (a.disparity?.maxDisparity?.priceInEUR || 0)
        return Math.abs(b.disparity?.avgDisparity || 0) - Math.abs(a.disparity?.avgDisparity || 0)
      })
  }, [search, sortBy])

  return (
    <PanelShell
      category="Intelligence"
      title="Price Disparity Matrix"
      subtitle={`${products.length} products × 5 regions · baseline EU retail`}
    >
      {/* Filter row - responsive: stack on mobile, horizontal on desktop */}
      <div className="rule" />
      <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--color-ink-faint)]" />
          <input
            type="text"
            placeholder="Search SKU or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full border-b border-[var(--color-border)] bg-transparent pl-8 pr-3 text-[13px] text-[var(--color-ink)] placeholder-[var(--color-ink-faint)] outline-none focus:border-[var(--color-accent)] sm:w-56"
          />
        </div>
        <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink-subtle)]">
          <span>Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border-b border-[var(--color-border)] bg-transparent py-1 pr-1 text-[11px] uppercase tracking-[0.1em] text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
          >
            <option value="disparity">Disparity</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
          </select>
        </div>
      </div>

      {/* TABLE - dense, editorial with horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <div className="max-h-[640px] overflow-auto">
          <table className="w-full min-w-[700px] text-[12px] tabular-nums">
            <thead className="sticky top-0 z-10 bg-[var(--color-bg)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="py-3 pl-0 pr-4 text-left">
                  <span className="label">Product</span>
                </th>
                <th className="px-3 text-left">
                  <span className="label">Brand</span>
                </th>
                {REGIONS.map((r) => (
                  <th key={r} className="px-3 text-right">
                    <span className="label">{r}</span>
                  </th>
                ))}
                <th className="px-3 text-right">
                  <span className="label">Avg Δ</span>
                </th>
                <th className="px-3 pr-0 text-right">
                  <span className="label">Max Δ</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 50).map((p, idx) => {
                const euPrice = p.regionalPrices.find((r: any) => r.region === 'EU')?.price || 0
                return (
                  <tr
                    key={p.id}
                    className={`border-b border-[var(--color-border)] data-row ${
                      idx % 2 === 1 ? 'bg-[var(--color-surface)]' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-0 pr-4">
                      <div className="text-[var(--color-ink)]">{p.name}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-[var(--color-ink-faint)]">
                        {p.sku}
                      </div>
                    </td>
                    <td className="px-3 text-[var(--color-ink-muted)]">{p.brand.name}</td>
                    {REGIONS.map((r) => {
                      const rp = p.regionalPrices.find((x: any) => x.region === r)
                      const disparity =
                        rp && euPrice ? ((rp.price * (1 / (rp.currency === 'EUR' ? 1 : rp.currency === 'USD' ? 1.085 : rp.currency === 'GBP' ? 0.856 : rp.currency === 'NOK' ? 11.52 : 92.45))) - euPrice) / euPrice * 100 : 0
                      const positive = disparity > 0
                      return (
                        <td key={r} className="px-3 text-right">
                          {rp ? (
                            <>
                              <div className="font-mono text-[var(--color-ink)]">
                                {rp.currency === 'EUR'
                                  ? fmtEUR(rp.price, 0)
                                  : `${rp.currency} ${Math.round(rp.price).toLocaleString()}`}
                              </div>
                              {r !== 'EU' && (
                                <div
                                  className={`mt-0.5 text-[10px] ${
                                    positive
                                      ? 'text-[var(--color-negative)]'
                                      : 'text-[var(--color-positive)]'
                                  }`}
                                >
                                  {disparity >= 0 ? '+' : ''}
                                  {disparity.toFixed(1)}%
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-[var(--color-ink-faint)]">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 text-right">
                      <span
                        className={`font-mono ${
                          Math.abs(p.disparity?.avgDisparity || 0) > 15
                            ? 'text-[var(--color-negative)]'
                            : Math.abs(p.disparity?.avgDisparity || 0) > 5
                              ? 'text-[var(--color-warning)]'
                              : 'text-[var(--color-positive)]'
                        }`}
                      >
                        {(p.disparity?.avgDisparity || 0) >= 0 ? '+' : ''}
                        {(p.disparity?.avgDisparity || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-3 pr-0 text-right">
                      <span className="font-mono text-[var(--color-accent)]">
                        {(p.disparity?.maxDisparity?.disparityPct || 0) >= 0 ? '+' : ''}
                        {(p.disparity?.maxDisparity?.disparityPct || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rule mt-1" />
      <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
        Showing top {Math.min(50, products.length)} of {products.length} products
      </p>
    </PanelShell>
  )
}
