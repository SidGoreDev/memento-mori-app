import { describe, expect, it } from 'vitest'
import {
  buildAllWeekCategoryIndices,
  buildSegmentCategoryIndices,
} from './categoryAllocation'
import type { Category } from '../types'

describe('buildSegmentCategoryIndices', () => {
  it('returns exact length and deterministic output', () => {
    const first = buildSegmentCategoryIndices(10, [50, 30, 20], 1234)
    const second = buildSegmentCategoryIndices(10, [50, 30, 20], 1234)

    expect(first).toHaveLength(10)
    expect(first).toEqual(second)
  })

  it('uses largest-remainder quota allocation', () => {
    const result = buildSegmentCategoryIndices(7, [50, 30, 20], 1)
    const counts = result.reduce<Record<number, number>>((acc, index) => {
      acc[index] = (acc[index] ?? 0) + 1
      return acc
    }, {})

    expect(counts[0]).toBe(4)
    expect(counts[1]).toBe(2)
    expect(counts[2]).toBe(1)
  })
})

describe('buildAllWeekCategoryIndices', () => {
  const categories: Category[] = [
    { id: 'work', name: 'Work', color: '#111111', pastPercent: 50, futurePercent: 10 },
    { id: 'family', name: 'Family', color: '#222222', pastPercent: 50, futurePercent: 90 },
  ]

  it('combines past and future allocations', () => {
    const result = buildAllWeekCategoryIndices(4, 10, categories)
    expect(result).toHaveLength(10)

    const past = result.slice(0, 4)
    const future = result.slice(4)
    const pastFamily = past.filter((item) => item === 1).length
    const futureFamily = future.filter((item) => item === 1).length

    expect(pastFamily).toBe(2)
    expect(futureFamily).toBe(5)
  })
})
