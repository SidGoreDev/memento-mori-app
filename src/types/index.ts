export interface Category {
  id: string
  name: string
  color: string
  pastPercent: number
  futurePercent: number
}

export interface AppInputState {
  birthDate: string
  lifeExpectancyYears: number
  categories: Category[]
  colorScheme: ColorScheme
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

export type ColorScheme = 'obsidian' | 'paper' | 'midnight'
