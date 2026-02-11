import { describe, expect, it } from 'vitest'
import { generateReflectionInsights } from './reflectionInsights'
import type { Category, DerivedMetrics } from '../types'

const metrics: DerivedMetrics = {
  totalWeeks: 4160,
  weeksLived: 1588,
  weeksRemaining: 2572,
  percentLived: 38.2,
  todayWeekIndex: 1588,
  gridRows: 80,
  gridCols: 52,
}

const categories: Category[] = [
  { id: 'work', name: 'Work', color: '#4A90D9', pastPercent: 35, futurePercent: 25 },
  { id: 'family', name: 'Family', color: '#E07A5F', pastPercent: 20, futurePercent: 30 },
  { id: 'rest', name: 'Rest', color: '#81B29A', pastPercent: 25, futurePercent: 20 },
  { id: 'growth', name: 'Growth', color: '#F2CC8F', pastPercent: 10, futurePercent: 15 },
  { id: 'play', name: 'Play', color: '#9B72CF', pastPercent: 10, futurePercent: 10 },
]

describe('generateReflectionInsights', () => {
  it('returns exactly five reflection lines', () => {
    const lines = generateReflectionInsights(metrics, categories)
    expect(lines).toHaveLength(5)
    expect(lines.every((line) => line.length > 0)).toBe(true)
  })

  it('handles empty categories gracefully', () => {
    const lines = generateReflectionInsights(metrics, [])
    expect(lines).toHaveLength(5)
    expect(lines[0]).toContain('finite grid')
  })
})
