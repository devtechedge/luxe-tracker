'use client'

import { PanelShell } from '@/components/ui/panel-shell'
import { EmptyState } from '@/components/ui/panel-shell'
import { Button } from '@/components/ui/button'
import { useWatchlist, useAlerts } from '@/hooks/use-watchlist'
import { getSnapshot } from '@/lib/data-snapshot'
import { fmtEUR, fmtPct } from '@/lib/utils'
import { Heart, Trash2, Bell, AlertCircle } from 'lucide-react'

export function WatchlistPanel() {
  const snap = getSnapshot()
  const { items, remove, hydrated: wHydrated } = useWatchlist()

  return (
    <PanelShell
      category="Personal"
      title="My Watchlist"
      subtitle="Products and brands you're tracking"
      caption="Stored in your browser's localStorage. No server required."
    >
      {items.length === 0 ? (
        <EmptyState
          title="Your watchlist is empty"
          hint="Add from any panel - your selection persists across reloads"
        />
      ) : (
        <section>
          <div className="rule" />
          <div className="py-5">
            <div className="label">{items.length} item{items.length === 1 ? '' : 's'}</div>
          </div>
          <div className="space-y-px">
            {items.map((item) => {
              let currentPriceEUR: number | null = null
              let disparity: number | null = null
              if (item.productId) {
                const p = snap.products.find((x) => x.id === item.productId)
                if (p) {
                  const eu = p.regionalPrices.find((r: any) => r.region === 'EU')
                  const us = p.regionalPrices.find((r: any) => r.region === 'US')
                  if (eu && us) {
                    currentPriceEUR = eu.price
                    const usEUR = us.price / 1.085
                    disparity = ((usEUR - eu.price) / eu.price) * 100
                  }
                }
              }
              return (
                <article
                  key={item.id}
                  className="grid grid-cols-1 gap-3 border-b border-[var(--color-border)] py-4 transition-colors hover:bg-[var(--color-surface)] md:grid-cols-[1fr,200px,80px]"
                >
                  <div>
                    <div className="text-[13px] text-[var(--color-ink)]">
                      {item.productName || item.brand || item.region}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                      <span>{item.watchType}</span>
                      {item.brand && (
                        <>
                          <span>·</span>
                          <span>{item.brand}</span>
                        </>
                      )}
                      {item.region && (
                        <>
                          <span>·</span>
                          <span>{item.region}</span>
                        </>
                      )}
                    </div>
                    {currentPriceEUR !== null && (
                      <div className="mt-2 flex items-center gap-4 text-[11px]">
                        <span className="text-[var(--color-ink-subtle)]">EU</span>
                        <span className="font-mono tabular-nums text-[var(--color-ink)]">
                          {fmtEUR(currentPriceEUR, 0)}
                        </span>
                        {disparity !== null && (
                          <span
                            className={`font-mono tabular-nums ${
                              disparity > 0 ? 'text-[var(--color-negative)]' : 'text-[var(--color-positive)]'
                            }`}
                          >
                            US {fmtPct(disparity)}
                          </span>
                        )}
                        {item.targetPrice && (
                          <span className="text-[var(--color-warning)]">
                            target {fmtEUR(item.targetPrice, 0)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(item.id)}
                      className="text-[var(--color-ink-subtle)] hover:text-[var(--color-negative)]"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </PanelShell>
  )
}

export function AlertsPanel() {
  const { alerts, markRead, clear, unread, hydrated } = useAlerts()

  return (
    <PanelShell
      category="Personal"
      title="Alerts"
      subtitle={`${alerts.length} alerts · ${unread} unread`}
      caption="Click any alert to mark as read. Alerts persist in your browser's localStorage."
    >
      {alerts.length === 0 ? (
        <EmptyState
          title="No alerts yet"
          hint="Set watchlist targets and alerts will appear here"
        />
      ) : (
        <section>
          <div className="rule" />
          <div className="flex items-center justify-between py-4">
            <div className="label">{alerts.length} total · {unread} unread</div>
            <Button size="sm" variant="ghost" onClick={clear} className="text-[var(--color-ink-subtle)]">
              Clear all
            </Button>
          </div>
          <div className="space-y-px">
            {alerts.slice().reverse().map((a) => (
              <button
                key={a.id}
                onClick={() => markRead(a.id)}
                className={`w-full text-left transition-colors hover:bg-[var(--color-surface)] ${
                  !a.read ? 'bg-[var(--color-accent-soft)]' : ''
                }`}
              >
                <div className="flex items-start gap-3 border-b border-[var(--color-border)] py-3">
                  <AlertCircle
                    className={`mt-0.5 size-4 shrink-0 ${
                      a.severity === 'critical'
                        ? 'text-[var(--color-negative)]'
                        : a.severity === 'warning'
                          ? 'text-[var(--color-warning)]'
                          : 'text-[var(--color-info)]'
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-[13px] text-[var(--color-ink)]">{a.message}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                      <span>{new Date(a.createdAt).toLocaleString()}</span>
                      {!a.read && (
                        <span className="text-[var(--color-accent)]">· unread</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </PanelShell>
  )
}
