import type { Category } from '../types'

export const DEFAULT_LIFE_EXPECTANCY = 80
export const LIFE_EXPECTANCY_MIN = 40
export const LIFE_EXPECTANCY_MAX = 120
export const GRID_COLUMNS = 52

/** @deprecated categories removed from UI, kept for old test compat */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'work', name: 'Work', color: '#4A90D9', pastPercent: 35, futurePercent: 25 },
  { id: 'family', name: 'Family', color: '#E07A5F', pastPercent: 20, futurePercent: 30 },
  { id: 'rest', name: 'Rest', color: '#81B29A', pastPercent: 25, futurePercent: 20 },
  { id: 'growth', name: 'Growth', color: '#F2CC8F', pastPercent: 10, futurePercent: 15 },
  { id: 'play', name: 'Play', color: '#9B72CF', pastPercent: 10, futurePercent: 10 },
]
