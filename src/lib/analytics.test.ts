import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getTelemetry,
  getBrands,
  getProducts,
  getProductById,
  getPriceHistory,
  getVIPSimulation,
  getArbitrage,
  getRunway,
  getSustainability,
} from './analytics.ts'

const REGIONS = new Set(['EU', 'US', 'UK', 'Norway', 'India'])

describe('getTelemetry', () => {
  const t = getTelemetry()

  it('reports the seeded catalogue size', () => {
    assert.equal(t.overview.totalProducts, 25)
    assert.equal(t.overview.totalBrands, 5)
    assert.equal(t.overview.totalLaunches, 125)
  })

  it('locks max disparity at the India × Balenciaga 1.38 markup (38%)', () => {
    assert.equal(t.overview.maxDisparityOverall, 38)
  })

  it('exposes four FX pairs and five region/brand summaries', () => {
    assert.equal(t.currencyRates.length, 4)
    assert.equal(t.regionSummary.length, 5)
    assert.equal(t.brandSummary.length, 5)
  })
})

describe('getPriceHistory key split', () => {
  it('does not chop prod_N ids on the first underscore', () => {
    const hist = getPriceHistory()
    assert.equal(hist.totalSeries, 125)
    assert.ok(hist.topMovers.length > 0)
    assert.ok(hist.topMovers.length <= 30)
    for (const mover of hist.topMovers) {
      assert.match(mover.productId, /^prod_\d+$/)
      assert.ok(REGIONS.has(mover.region), `unexpected region ${mover.region}`)
      assert.ok(mover.productName.length > 0)
      assert.notEqual(mover.productId, 'prod')
    }
  })
})

describe('getVIPSimulation', () => {
  it('places €8k spend in Silver with Gold as the next gap', () => {
    const sim = getVIPSimulation(0, 8000)
    assert.equal(sim.brand, 'Prada')
    assert.equal(sim.qualifiedTier?.tierName, 'Silver')
    assert.equal(sim.nextTier?.tierName, 'Gold')
    assert.equal(sim.nextTier?.gapEUR, 7000)
  })

  it('returns no qualified tier below Silver', () => {
    const sim = getVIPSimulation(1, 0)
    assert.equal(sim.brand, 'Gucci')
    assert.equal(sim.qualifiedTier, null)
    assert.equal(sim.nextTier?.tierName, 'Silver')
    assert.equal(sim.nextTier?.gapEUR, 5000)
  })

  it('caps at Diamond with no next tier', () => {
    const sim = getVIPSimulation(3, 100000)
    assert.equal(sim.brand, 'Louis Vuitton')
    assert.equal(sim.qualifiedTier?.tierName, 'Diamond')
    assert.equal(sim.qualifiedTier?.discountPct, 22)
    assert.equal(sim.nextTier, null)
  })
})

describe('catalogue accessors', () => {
  it('lists five brands and 25 products sorted by disparity', () => {
    assert.equal(getBrands().length, 5)
    const products = getProducts()
    assert.equal(products.length, 25)
    const first = Math.abs(products[0].disparity?.maxDisparity?.disparityPct || 0)
    const last = Math.abs(products[products.length - 1].disparity?.maxDisparity?.disparityPct || 0)
    assert.ok(first >= last)
  })

  it('hydrates a known SKU and returns null for misses', () => {
    const bag = getProductById('prod_0')
    assert.equal(bag?.name, 'Re-Edition 2005 Shoulder Bag')
    assert.equal(bag?.brand.name, 'Prada')
    assert.equal(getProductById('prod_999'), null)
  })

  it('finds positive-savings arbitrage routes', () => {
    const arb = getArbitrage()
    assert.ok(arb.totalOpportunities > 0)
    assert.ok(arb.topOpportunities[0].savingsEUR > 20)
    assert.ok(arb.topOpportunities[0].savingsPct > 0)
  })

  it('returns 30 runway shows and 5 sustainability rows', () => {
    assert.equal(getRunway().totalShows, 30)
    assert.equal(getSustainability().length, 5)
  })
})
