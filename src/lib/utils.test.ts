import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cn, fmtEUR, fmtPct, fmtNum } from './utils.ts'

describe('fmtPct', () => {
  it('prefixes positives with + and keeps the minus sign', () => {
    assert.equal(fmtPct(1.5), '+1.5%')
    assert.equal(fmtPct(-2), '-2.0%')
    assert.equal(fmtPct(0, 2), '+0.00%')
  })
})

describe('fmtNum', () => {
  it('groups thousands with en-US separators', () => {
    assert.equal(fmtNum(25), '25')
    assert.equal(fmtNum(1250), '1,250')
    assert.equal(fmtNum(11375), '11,375')
  })
})

describe('fmtEUR', () => {
  it('renders a euro amount', () => {
    const s = fmtEUR(1250)
    assert.match(s, /1[,.]?250/)
    assert.match(s, /€|EUR/)
  })
})

describe('cn', () => {
  it('merges class names and drops falsy values', () => {
    assert.equal(cn('px-2', false && 'hidden', 'px-4'), 'px-4')
  })
})
