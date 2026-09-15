'use client'

import { useState } from 'react'
import { PanelShell } from '@/components/ui/panel-shell'
import { getVIPSimulation } from '@/lib/analytics'
import { getSnapshot } from '@/lib/data-snapshot'
import { useAnnualSpend } from '@/hooks/use-watchlist'
import { fmtEUR } from '@/lib/utils'
import { Crown, Sparkles, Eye, User } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function VipPanel() {
  const snap = getSnapshot()
  const [brandIdx, setBrandIdx] = useState(0)
  const [annualSpend, setAnnualSpend, hydrated] = useAnnualSpend(8000)

  const sim = getVIPSimulation(brandIdx, annualSpend)
  const brand = snap.brandDefs[brandIdx]
  const qualifiedColor = sim.qualifiedTier ? 'var(--color-positive)' : 'var(--color-ink-subtle)'

  return (
    <PanelShell
      category="Luxury"
      title="VIP Client Tier Simulator"
      subtitle="What tier would your spending qualify for at each maison?"
      caption="Drag the spend slider. Each maison calibrates tiers differently - discover which brand rewards your loyalty."
    >
      <section className="mb-8">
        <div className="rule" />
        <div className="grid grid-cols-1 gap-6 py-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block label">Brand</label>
            <select
              value={brandIdx}
              onChange={(e) => setBrandIdx(parseInt(e.target.value))}
              className="h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              {snap.brandDefs.map((b, i) => (
                <option key={b.name} value={i}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block label">Annual spend · EUR</label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={annualSpend}
                onChange={(e) => setAnnualSpend(parseInt(e.target.value) || 0)}
                step={1000}
                className="text-base"
              />
              <input
                type="range"
                min={0}
                max={150000}
                step={1000}
                value={annualSpend}
                onChange={(e) => setAnnualSpend(parseInt(e.target.value))}
                className="flex-1 accent-[var(--color-accent)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Qualified tier banner */}
      <section className="mb-8 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6">
        {sim.qualifiedTier ? (
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4" style={{ color: qualifiedColor }} />
              <span className="label" style={{ color: qualifiedColor }}>
                Qualified tier
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-display text-[44px] font-medium leading-none tracking-tight text-[var(--color-ink)]">
                {sim.qualifiedTier.tierName}
              </span>
              <span className="text-[12px] text-[var(--color-ink-muted)]">at {brand.name}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-px border border-[var(--color-border)] bg-[var(--color-border)] md:grid-cols-4">
              <Benefit
                icon={<Sparkles className="size-3" />}
                label="Discount"
                value={`${sim.qualifiedTier.discountPct}%`}
              />
              <Benefit
                icon={<Eye className="size-3" />}
                label="Early Access"
                value={`${sim.qualifiedTier.earlyAccessDays}d`}
              />
              <Benefit
                icon={<User className="size-3" />}
                label="Personal Shopper"
                value={sim.qualifiedTier.personalShopper ? 'Yes' : 'No'}
              />
              <Benefit
                icon={<Crown className="size-3" />}
                label="Allocation Prio"
                value={`${sim.qualifiedTier.allocationPriority}/5`}
              />
            </div>
          </div>
        ) : (
          <div>
            <span className="label">No tier qualified</span>
            <p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
              Your annual spend is below the entry threshold for {brand.name}.
            </p>
          </div>
        )}
        {sim.nextTier && (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4 text-[12px] text-[var(--color-ink-muted)]">
            Spend{' '}
            <span className="font-mono tabular-nums text-[var(--color-warning)]">
              {fmtEUR(sim.nextTier.gapEUR, 0)}
            </span>{' '}
            more to unlock{' '}
            <span className="font-medium text-[var(--color-ink)]">{sim.nextTier.tierName}</span>.
          </div>
        )}
      </section>

      {/* Tier ladder */}
      <section>
        <div className="rule" />
        <div className="py-5">
          <div className="label">Tier ladder</div>
        </div>
        <div className="space-y-px">
          {sim.allTiers.map((tier, i) => {
            const isQualified = tier.achievable
            const isNext = !tier.achievable && sim.allTiers[i - 1]?.achievable
            return (
              <article
                key={tier.tierName}
                className={`grid grid-cols-[40px,1fr,140px,80px] items-center gap-3 border-b border-[var(--color-border)] py-4 transition-colors ${
                  isQualified
                    ? 'bg-[var(--color-positive-soft)]'
                    : isNext
                      ? 'bg-[var(--color-warning-soft)]'
                      : 'hover:bg-[var(--color-surface)]'
                }`}
              >
                <span className="text-2xl">
                  {tier.tierName === 'Silver' && '🥈'}
                  {tier.tierName === 'Gold' && '🥇'}
                  {tier.tierName === 'Platinum' && '💎'}
                  {tier.tierName === 'Diamond' && '👑'}
                </span>
                <div>
                  <div className="text-[13px] text-[var(--color-ink)]">{tier.tierName}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                    Min spend {fmtEUR(tier.minAnnualSpendEUR, 0)} · {tier.discountPct}% off ·{' '}
                    {tier.earlyAccessDays}d early
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em]">
                  {isQualified && (
                    <span className="text-[var(--color-positive)]">Achieved</span>
                  )}
                  {isNext && <span className="text-[var(--color-warning)]">Next</span>}
                  {!isQualified && !isNext && (
                    <span className="text-[var(--color-ink-subtle)]">—</span>
                  )}
                </div>
                <div className="text-right font-mono text-[12px] tabular-nums text-[var(--color-ink)]">
                  {tier.allocationPriority}/5
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </PanelShell>
  )
}

function Benefit({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--color-surface)] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 font-mono text-[14px] font-medium tabular-nums text-[var(--color-ink)]">
        {value}
      </div>
    </div>
  )
}
