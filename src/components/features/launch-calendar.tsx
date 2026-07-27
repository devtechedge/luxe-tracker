'use client'

import { useMemo, useState } from 'react'
import { PanelShell, DataRow } from '@/components/ui/panel-shell'
import { getLaunchesCalendar, getLaunches } from '@/lib/analytics'
import { fmtNum } from '@/lib/utils'

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Upcoming',
  confirmed: 'Confirmed',
  rumored: 'Rumored',
  'sold-out': 'Sold out',
}

const STATUS_DOT: Record<string, string> = {
  upcoming: 'var(--color-warning)',
  confirmed: 'var(--color-positive)',
  rumored: 'var(--color-ink-subtle)',
  'sold-out': 'var(--color-negative)',
}

export function LaunchCalendar() {
  const [view, setView] = useState<'list' | 'grid'>('list')
  const calendar = useMemo(() => getLaunchesCalendar(), [])
  const sortedMonths = Object.keys(calendar).sort()
  const upcoming = useMemo(
    () =>
      getLaunches()
        .filter((l) => new Date(l.launchDate).getTime() > Date.now())
        .slice(0, 30),
    [],
  )

  return (
    <PanelShell
      category="Intelligence"
      title="Launch Calendar"
      subtitle={`${fmtNum(upcoming.length)} upcoming launches across 5 brands and 5 regions`}
      caption="Editorial log of every scheduled drop. Each entry is sorted chronologically and color-coded by confirmed status."
    >
      {/* View toggle */}
      <div className="mb-4 flex items-center gap-1 border-b border-[var(--color-border)]">
        <button
          onClick={() => setView('list')}
          className={`-mb-px border-b px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
            view === 'list'
              ? 'border-[var(--color-accent)] text-[var(--color-ink)]'
              : 'border-transparent text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]'
          }`}
        >
          List
        </button>
        <button
          onClick={() => setView('grid')}
          className={`-mb-px border-b px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
            view === 'grid'
              ? 'border-[var(--color-accent)] text-[var(--color-ink)]'
              : 'border-transparent text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]'
          }`}
        >
          Grid
        </button>
      </div>

      {view === 'list' ? (
        <div className="rule pt-3">
          <div className="grid grid-cols-[80px,1fr,120px,80px] gap-4 py-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            <div>Date</div>
            <div>Product</div>
            <div className="text-right">Units</div>
            <div className="text-right">T-</div>
          </div>
          {upcoming.map((l) => {
            const date = new Date(l.launchDate)
            const daysOut = Math.ceil((date.getTime() - Date.now()) / 86400000)
            return (
              <div
                key={l.id}
                className="grid grid-cols-[80px,1fr,120px,80px] gap-4 border-b border-[var(--color-border)] py-2.5 data-row"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="font-display text-[18px] tabular-nums leading-none text-[var(--color-ink)]">
                    {date.getDate()}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] text-[var(--color-ink)]">{l.product.name}</div>
                  <div className="mt-0.5 flex items-center gap-3 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="status-dot"
                        style={{ background: STATUS_DOT[l.status] }}
                      />
                      {STATUS_LABEL[l.status]}
                    </span>
                    <span>{l.brand.name}</span>
                    <span>{l.region}</span>
                    <span>{l.launchType}</span>
                  </div>
                </div>
                <div className="text-right font-mono text-[12px] tabular-nums text-[var(--color-ink-muted)]">
                  {fmtNum(l.expectedUnits)}
                </div>
                <div className="text-right font-mono text-[12px] tabular-nums text-[var(--color-ink)]">
                  {daysOut > 0 ? `T-${daysOut}d` : '—'}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rule pt-3 space-y-6">
          {sortedMonths.slice(0, 3).map((month) => {
            const launches = calendar[month]
            return (
              <div key={month}>
                <div className="mb-3 flex items-baseline justify-between">
                  <h4 className="font-display text-[16px] font-medium tracking-tight text-[var(--color-ink)]">
                    {new Date(month + '-01').toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h4>
                  <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-subtle)]">
                    {launches.length} launches
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-px border-l border-t border-[var(--color-border)]">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <div
                      key={d}
                      className="border-b border-r border-[var(--color-border)] bg-[var(--color-surface)] py-1 text-center text-[9px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]"
                    >
                      {d}
                    </div>
                  ))}
                  {Array.from({
                    length: (new Date(month + '-01').getDay() + 6) % 7,
                  }).map((_, i) => (
                    <div
                      key={`pad-${i}`}
                      className="min-h-[60px] border-b border-r border-[var(--color-border)]"
                    />
                  ))}
                  {launches.map((l) => {
                    const day = new Date(l.launchDate).getDate()
                    return (
                      <div
                        key={l.id}
                        className="min-h-[60px] border-b border-r border-[var(--color-border)] p-1.5"
                        title={`${l.product.name} · ${l.brand.name}`}
                      >
                        <div className="font-mono text-[10px] tabular-nums text-[var(--color-ink-subtle)]">
                          {day}
                        </div>
                        <div className="mt-1 truncate text-[10px] text-[var(--color-ink)]">
                          {l.product.name}
                        </div>
                        <div
                          className="mt-1 h-px"
                          style={{ background: STATUS_DOT[l.status] }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PanelShell>
  )
}
