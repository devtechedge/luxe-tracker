import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseWatchlist,
  parseWatchlistEntry,
  parseAlerts,
  parseSpend,
  parseTheme,
  sanitizeString,
  MAX_WATCHLIST,
  MAX_SPEND,
} from './validation.ts'

describe('sanitizeString', () => {
  it('strips control characters and trims', () => {
    assert.equal(sanitizeString('  hello\u0000world  ', 20), 'helloworld')
  })

  it('rejects non-strings and empty results', () => {
    assert.equal(sanitizeString(12, 10), undefined)
    assert.equal(sanitizeString('   ', 10), undefined)
  })
})

describe('parseWatchlist', () => {
  it('accepts a well-formed product entry and drops unknown keys', () => {
    const items = parseWatchlist(
      `[{"id":"wl_1","watchType":"product","productId":"prod_0","productName":"Re-Edition 2005 Shoulder Bag","brand":"Prada","createdAt":"2026-01-01T00:00:00.000Z","extra":"nope"}]`,
    )
    assert.equal(items.length, 1)
    assert.equal(items[0].productId, 'prod_0')
    assert.equal(items[0].brand, 'Prada')
    assert.equal('extra' in items[0], false)
  })

  it('rejects unknown watch types, brands, regions, and product ids', () => {
    assert.equal(
      parseWatchlistEntry({
        id: 'wl_bad',
        watchType: 'admin',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
      null,
    )
    assert.equal(
      parseWatchlist(
        JSON.stringify([
          {
            id: 'wl_2',
            watchType: 'brand',
            brand: 'Hermes',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'wl_3',
            watchType: 'product',
            productId: '../etc/passwd',
            productName: '<img src=x onerror=alert(1)>',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'wl_4',
            watchType: 'region',
            region: 'Atlantis',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      ).length,
      0,
    )
  })

  it('caps the list and skips duplicate ids', () => {
    const flood = Array.from({ length: 80 }, (_, i) => ({
      id: i < 60 ? `wl_${i}` : 'wl_0',
      watchType: 'region',
      region: 'EU',
      createdAt: '2026-01-01T00:00:00.000Z',
    }))
    const items = parseWatchlist(JSON.stringify(flood))
    assert.equal(items.length, MAX_WATCHLIST)
  })

  it('returns [] for invalid JSON, objects, and non-arrays', () => {
    assert.deepEqual(parseWatchlist('not-json'), [])
    assert.deepEqual(parseWatchlist('{"id":"x"}'), [])
    assert.deepEqual(parseWatchlist(null), [])
  })
})

describe('parseAlerts', () => {
  it('accepts an allow-listed alert and strips XSS-y names to text', () => {
    const alerts = parseAlerts(
      JSON.stringify([
        {
          id: 'alert_1',
          alertType: 'price_drop',
          message: 'Jackie 1961 dropped 4%',
          severity: 'warning',
          read: false,
          createdAt: '2026-01-01T00:00:00.000Z',
          productName: '<script>alert(1)</script>',
        },
      ]),
    )
    assert.equal(alerts.length, 1)
    assert.equal(alerts[0].alertType, 'price_drop')
    assert.equal(alerts[0].productName, '<script>alert(1)</script>')
    assert.equal(alerts[0].read, false)
  })

  it('drops unknown types / severities and requires a message', () => {
    assert.equal(
      parseAlerts(
        JSON.stringify([
          {
            id: 'alert_x',
            alertType: 'xss',
            message: 'nope',
            severity: 'info',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'alert_y',
            alertType: 'price_drop',
            message: '',
            severity: 'critical',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ]),
      ).length,
      0,
    )
  })
})

describe('parseSpend / parseTheme', () => {
  it('clamps spend and falls back on garbage', () => {
    assert.equal(parseSpend('8000'), 8000)
    assert.equal(parseSpend('-12'), 8000)
    assert.equal(parseSpend('not-a-number'), 8000)
    assert.equal(parseSpend(String(MAX_SPEND + 99)), MAX_SPEND)
  })

  it('only accepts dark or light', () => {
    assert.equal(parseTheme('dark'), 'dark')
    assert.equal(parseTheme('light'), 'light')
    assert.equal(parseTheme('system'), null)
    assert.equal(parseTheme('<b>dark</b>'), null)
  })
})
