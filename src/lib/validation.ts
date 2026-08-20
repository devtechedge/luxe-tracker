// ============================================================
// VALIDATION — allow-lists for untrusted localStorage payloads
// ============================================================
// Watchlist, alerts, spend, and theme are browser-local only.
// A compromised extension or pasted DevTools payload should
// not be able to inject unexpected shapes, huge arrays, or
// prototype-polluted objects into React state.

import type { AlertEntry, WatchlistEntry } from './fashion-types'

export const WATCH_TYPES = ['product', 'brand', 'region'] as const
export const ALERT_TYPES = ['price_drop', 'launch_reminder', 'stock_change', 'arbitrage'] as const
export const SEVERITIES = ['info', 'warning', 'critical'] as const
export const REGIONS = ['EU', 'US', 'UK', 'Norway', 'India'] as const
export const BRANDS = ['Prada', 'Gucci', 'Balenciaga', 'Louis Vuitton', 'Versace'] as const
export const THEMES = ['dark', 'light'] as const

export const MAX_WATCHLIST = 50
export const MAX_ALERTS = 50
export const MAX_ID_LEN = 64
export const MAX_NAME_LEN = 160
export const MAX_MESSAGE_LEN = 280
export const MAX_SPEND = 10_000_000

const PRODUCT_ID_RE = /^prod_\d{1,4}$/
const ENTRY_ID_RE = /^[A-Za-z0-9:_-]{1,64}$/

export type ThemeName = (typeof THEMES)[number]
export type WatchType = (typeof WATCH_TYPES)[number]
export type AlertType = (typeof ALERT_TYPES)[number]
export type Severity = (typeof SEVERITIES)[number]
export type RegionName = (typeof REGIONS)[number]
export type BrandName = (typeof BRANDS)[number]

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function stripControls(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim()
}

export function sanitizeString(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = stripControls(value)
  if (!cleaned) return undefined
  return cleaned.slice(0, max)
}

export function sanitizeId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const cleaned = stripControls(value)
  if (!ENTRY_ID_RE.test(cleaned)) return undefined
  return cleaned.slice(0, MAX_ID_LEN)
}

export function isWatchType(value: unknown): value is WatchType {
  return typeof value === 'string' && (WATCH_TYPES as readonly string[]).includes(value)
}

export function isAlertType(value: unknown): value is AlertType {
  return typeof value === 'string' && (ALERT_TYPES as readonly string[]).includes(value)
}

export function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && (SEVERITIES as readonly string[]).includes(value)
}

export function isRegion(value: unknown): value is RegionName {
  return typeof value === 'string' && (REGIONS as readonly string[]).includes(value)
}

export function isBrand(value: unknown): value is BrandName {
  return typeof value === 'string' && (BRANDS as readonly string[]).includes(value)
}

export function isTheme(value: unknown): value is ThemeName {
  return value === 'dark' || value === 'light'
}

export function isProductId(value: unknown): value is string {
  return typeof value === 'string' && PRODUCT_ID_RE.test(value)
}

export function parseJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function parseWatchlistEntry(raw: unknown): WatchlistEntry | null {
  if (!isRecord(raw)) return null
  const id = sanitizeId(raw.id)
  const watchType = raw.watchType
  const createdAt = sanitizeString(raw.createdAt, 40)
  if (!id || !isWatchType(watchType) || !createdAt) return null

  const entry: WatchlistEntry = { id, watchType, createdAt }

  if (isProductId(raw.productId)) entry.productId = raw.productId
  const productName = sanitizeString(raw.productName, MAX_NAME_LEN)
  if (productName) entry.productName = productName
  if (isBrand(raw.brand)) entry.brand = raw.brand
  if (isRegion(raw.region)) entry.region = raw.region

  if (typeof raw.targetPrice === 'number' && Number.isFinite(raw.targetPrice) && raw.targetPrice > 0) {
    entry.targetPrice = Math.min(raw.targetPrice, 1_000_000)
  }

  if (watchType === 'product' && !entry.productId) return null
  if (watchType === 'brand' && !entry.brand) return null
  if (watchType === 'region' && !entry.region) return null

  return entry
}

export function parseWatchlist(raw: unknown): WatchlistEntry[] {
  const parsed = parseJson(raw)
  if (!Array.isArray(parsed)) return []
  const items: WatchlistEntry[] = []
  const seen = new Set<string>()
  for (const row of parsed.slice(0, MAX_WATCHLIST * 2)) {
    const entry = parseWatchlistEntry(row)
    if (!entry || seen.has(entry.id)) continue
    seen.add(entry.id)
    items.push(entry)
    if (items.length >= MAX_WATCHLIST) break
  }
  return items
}

export function parseAlertEntry(raw: unknown): AlertEntry | null {
  if (!isRecord(raw)) return null
  const id = sanitizeId(raw.id)
  const alertType = raw.alertType
  const message = sanitizeString(raw.message, MAX_MESSAGE_LEN)
  const severity = raw.severity
  const createdAt = sanitizeString(raw.createdAt, 40)
  if (!id || !isAlertType(alertType) || !message || !isSeverity(severity) || !createdAt) {
    return null
  }

  const entry: AlertEntry = {
    id,
    alertType,
    message,
    severity,
    read: raw.read === true,
    createdAt,
  }

  if (isProductId(raw.productId)) entry.productId = raw.productId
  const productName = sanitizeString(raw.productName, MAX_NAME_LEN)
  if (productName) entry.productName = productName
  if (isBrand(raw.brand)) entry.brand = raw.brand
  if (isRegion(raw.region)) entry.region = raw.region

  return entry
}

export function parseAlerts(raw: unknown): AlertEntry[] {
  const parsed = parseJson(raw)
  if (!Array.isArray(parsed)) return []
  const items: AlertEntry[] = []
  const seen = new Set<string>()
  for (const row of parsed.slice(0, MAX_ALERTS * 2)) {
    const entry = parseAlertEntry(row)
    if (!entry || seen.has(entry.id)) continue
    seen.add(entry.id)
    items.push(entry)
    if (items.length >= MAX_ALERTS) break
  }
  return items
}

export function parseSpend(raw: unknown, fallback = 8000): number {
  const source = typeof raw === 'string' ? raw : String(raw ?? '')
  const n = Number.parseInt(source, 10)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.min(Math.floor(n), MAX_SPEND)
}

export function parseTheme(raw: unknown): ThemeName | null {
  if (typeof raw !== 'string') return null
  return isTheme(raw) ? raw : null
}
