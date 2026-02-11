import { describe, expect, it } from 'vitest'
import { computeDerivedMetrics, getWeekDateRange } from './weekMath'

describe('computeDerivedMetrics', () => {
  it('clamps future birth date to zero weeks lived', () => {
    const metrics = computeDerivedMetrics('2100-01-01', 80, new Date('2026-02-11'))
    expect(metrics.weeksLived).toBe(0)
    expect(metrics.weeksRemaining).toBe(80 * 52)
  })

  it('clamps lived weeks to total weeks when age exceeds expectancy', () => {
    const metrics = computeDerivedMetrics('1900-01-01', 80, new Date('2026-02-11'))
    expect(metrics.weeksLived).toBe(80 * 52)
    expect(metrics.weeksRemaining).toBe(0)
  })
})

describe('getWeekDateRange', () => {
  it('returns expected week range boundaries', () => {
    const range = getWeekDateRange('2000-01-01', 2)
    expect(range.start).toBe('2000-01-15')
    expect(range.end).toBe('2000-01-21')
  })
})
