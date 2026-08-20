'use client'

import { useEffect, useState, useCallback } from 'react'
import type { WatchlistEntry, AlertEntry } from '@/lib/fashion-types'
import { parseAlerts, parseSpend, parseWatchlist } from '@/lib/validation'

const WATCHLIST_KEY = 'luxe-tracker:watchlist'
const ALERTS_KEY = 'luxe-tracker:alerts'
const SPEND_KEY = 'luxe-tracker:annual-spend'

// ============================================================
// useWatchlist — localStorage-backed watchlist
// ============================================================
// Mirrors the server-side WatchlistItem model. Single-user
// (matches Prisma schema: userId String @default("default"))
// Payloads are allow-listed in src/lib/validation.ts so a
// poisoned localStorage blob cannot enter React state.
// ============================================================

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCHLIST_KEY)
      if (raw) setItems(parseWatchlist(raw))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const add = useCallback((entry: Omit<WatchlistEntry, 'id' | 'createdAt'>) => {
    setItems((prev) => [
      ...prev,
      {
        ...entry,
        id: `wl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
      },
    ].slice(-50))
  }, [])

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const has = useCallback(
    (predicate: (e: WatchlistEntry) => boolean) => items.some(predicate),
    [items],
  )

  return { items, add, remove, has, hydrated }
}

// ============================================================
// useAlerts — localStorage-backed alerts feed
// ============================================================

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertEntry[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ALERTS_KEY)
      if (raw) setAlerts(parseAlerts(raw))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts.slice(-50)))
  }, [alerts, hydrated])

  const push = useCallback((alert: Omit<AlertEntry, 'id' | 'createdAt' | 'read'>) => {
    setAlerts((prev) =>
      [
        ...prev,
        {
          ...alert,
          id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          read: false,
        },
      ].slice(-50),
    )
  }, [])

  const markRead = useCallback((id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
  }, [])

  const clear = useCallback(() => setAlerts([]), [])

  const unread = alerts.filter((a) => !a.read).length

  return { alerts, push, markRead, clear, unread, hydrated }
}

// ============================================================
// useAnnualSpend — localStorage-backed annual spend input
// (used by VIP Tier Simulator)
// ============================================================

export function useAnnualSpend(defaultValue = 8000) {
  const [value, setValue] = useState(defaultValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SPEND_KEY)
      if (raw) setValue(parseSpend(raw, defaultValue))
    } catch {}
    setHydrated(true)
  }, [defaultValue])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(SPEND_KEY, String(value))
  }, [value, hydrated])

  return [value, setValue, hydrated] as const
}
