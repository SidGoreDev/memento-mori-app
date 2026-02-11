import type { Category } from '../types'

interface FractionRow {
  index: number
  fraction: number
}

export function buildSegmentCategoryIndices(
  totalWeeks: number,
  percentages: number[],
  seed: number,
): number[] {
  if (totalWeeks <= 0 || percentages.length === 0) return []

  const raw = percentages.map((value) => (value / 100) * totalWeeks)
  const base = raw.map(Math.floor)
  let remainder = totalWeeks - base.reduce((acc, value) => acc + value, 0)

  const byFraction: FractionRow[] = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction)

  for (let i = 0; i < remainder; i += 1) {
    base[byFraction[i]?.index ?? 0] += 1
  }

  const buckets: number[] = []
  for (let categoryIndex = 0; categoryIndex < base.length; categoryIndex += 1) {
    for (let copy = 0; copy < base[categoryIndex]; copy += 1) {
      buckets.push(categoryIndex)
    }
  }

  let state = seed >>> 0
  const random = () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 2 ** 32
  }

  for (let i = buckets.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = buckets[i]
    buckets[i] = buckets[j]
    buckets[j] = swap
  }

  return buckets
}

export function buildAllWeekCategoryIndices(
  weeksLived: number,
  totalWeeks: number,
  categories: Category[],
): number[] {
  if (totalWeeks <= 0 || categories.length === 0) return []

  const safeWeeksLived = Math.max(0, Math.min(weeksLived, totalWeeks))
  const pastWeeks = safeWeeksLived
  const futureWeeks = totalWeeks - safeWeeksLived

  const pastPercents = categories.map((item) => item.pastPercent)
  const futurePercents = categories.map((item) => item.futurePercent)

  const past = buildSegmentCategoryIndices(pastWeeks, pastPercents, 0x9e3779b1)
  const future = buildSegmentCategoryIndices(
    futureWeeks,
    futurePercents,
    0x85ebca77,
  )

  return [...past, ...future]
}
