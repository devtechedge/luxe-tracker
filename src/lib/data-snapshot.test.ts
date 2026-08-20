import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getSnapshot, round2, round4, toEUR } from './data-snapshot.ts'

describe('getSnapshot counts', () => {
  const snap = getSnapshot()

  it('seeds 5 maisons and 25 SKUs', () => {
    assert.equal(snap.brands.length, 5)
    assert.equal(snap.products.length, 25)
    assert.deepEqual(
      snap.brandDefs.map((b) => b.name),
      ['Prada', 'Gucci', 'Balenciaga', 'Louis Vuitton', 'Versace'],
    )
  })

  it('attaches 5 regional prices and 91-day history per SKU', () => {
    for (const p of snap.products) {
      assert.equal(p.regionalPrices.length, 5)
      assert.equal(p.priceHistory.length, 5 * 91)
      assert.match(p.id, /^prod_\d+$/)
    }
  })

  it('keeps the rest of the catalogue at the documented size', () => {
    assert.equal(snap.launches.length, 125)
    assert.equal(snap.runwayShows.length, 30)
    assert.equal(snap.sustainability.length, 5)
    assert.equal(snap.trends.length, 20)
    assert.equal(snap.dropQueue.length, 10)
    assert.equal(snap.vipTierDefs.length, 4)
    assert.equal(snap.currencyData.length, 4)
  })

  it('is a singleton — the same object is reused', () => {
    assert.equal(getSnapshot(), snap)
  })
})

describe('fx helpers', () => {
  it('round2 / round4 bank to the documented precision', () => {
    assert.equal(round2(1.234), 1.23)
    assert.equal(round2(1.235), 1.24)
    assert.equal(round4(1.08504), 1.085)
  })

  it('converts USD / GBP / INR / EUR into euros', () => {
    assert.equal(toEUR(100, 'EUR'), 100)
    assert.ok(Math.abs(toEUR(108.5, 'USD') - 100) < 0.05)
    assert.ok(Math.abs(toEUR(85.6, 'GBP') - 100) < 0.05)
    assert.equal(toEUR(1, 'NOPE'), 1)
  })
})
