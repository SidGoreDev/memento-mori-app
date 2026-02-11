import { GRID_COLUMNS } from './defaults'
import type { DerivedMetrics } from '../types'

const DAYS_PER_WEEK = 7
const MS_PER_DAY = 24 * 60 * 60 * 1000
const MS_PER_WEEK = DAYS_PER_WEEK * MS_PER_DAY

function toUtcMidnightMs(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function parseDateInput(input: string): Date {
  const [y, m, d] = input.split('-').map(Number)
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1))
}

export function computeDerivedMetrics(
  birthDateIso: string,
  lifeExpectancyYears: number,
  now: Date = new Date(),
): DerivedMetrics {
  const totalWeeks = lifeExpectancyYears * GRID_COLUMNS
  const birthDate = parseDateInput(birthDateIso)
  const rawWeeksLived = Math.floor(
    (toUtcMidnightMs(now) - toUtcMidnightMs(birthDate)) / MS_PER_WEEK,
  )
  const weeksLived = clamp(rawWeeksLived, 0, totalWeeks)
  const weeksRemaining = Math.max(0, totalWeeks - weeksLived)

  return {
    totalWeeks,
    weeksLived,
    weeksRemaining,
    percentLived: totalWeeks === 0 ? 0 : (weeksLived / totalWeeks) * 100,
    todayWeekIndex: weeksLived,
    gridRows: Math.ceil(totalWeeks / GRID_COLUMNS),
    gridCols: GRID_COLUMNS,
  }
}

export function getWeekDateRange(
  birthDateIso: string,
  weekIndex: number,
): { start: string; end: string } {
  const birthDate = parseDateInput(birthDateIso).getTime()
  const start = new Date(birthDate + weekIndex * DAYS_PER_WEEK * MS_PER_DAY)
  const end = new Date(start.getTime() + (DAYS_PER_WEEK - 1) * MS_PER_DAY)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}
