export interface AppState {
  birthDate: string
  lifeExpectancyYears: number
}

export interface DerivedMetrics {
  totalWeeks: number
  weeksLived: number
  weeksRemaining: number
  percentLived: number
  todayWeekIndex: number
  gridRows: number
  gridCols: 52
}

/** @deprecated kept for backwards compat with old tests */
export interface Category {
  id: string
  name: string
  color: string
  pastPercent: number
  futurePercent: number
}

/** @deprecated kept for backwards compat with old tests */
export type ColorScheme = 'obsidian' | 'paper' | 'midnight'

/** @deprecated kept for backwards compat with old tests */
export interface AppInputState {
  birthDate: string
  lifeExpectancyYears: number
  categories: Category[]
  colorScheme: ColorScheme
}
