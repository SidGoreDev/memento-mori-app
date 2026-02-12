import { GRID_COLUMNS } from './defaults'
import { hexToRgba } from './themes'
import type { Category } from '../types'

export interface GridRenderOptions {
  totalWeeks: number
  weeksLived: number
  selectedWeek?: number | null
  cellSize: number
  gap: number
  livedColor: string
  emptyColor: string
  currentColor: string
}

/** @deprecated kept for old test compat */
export interface LegacyGridRenderOptions {
  totalWeeks: number
  weeksLived: number
  categoryIndices: number[]
  categories: Category[]
  selectedWeek?: number | null
  cellSize: number
  gap: number
  emptyColor: string
  accentColor: string
}

export interface GridLayout {
  width: number
  height: number
  rows: number
}

export function getGridLayout(totalWeeks: number, cellSize: number, gap: number): GridLayout {
  const rows = Math.ceil(totalWeeks / GRID_COLUMNS)
  const width = GRID_COLUMNS * (cellSize + gap) - gap
  const height = rows * (cellSize + gap) - gap
  return { width, height, rows }
}

export function drawGridToContext(
  context: CanvasRenderingContext2D,
  options: GridRenderOptions,
): GridLayout {
  const {
    totalWeeks,
    weeksLived,
    selectedWeek,
    cellSize,
    gap,
    livedColor,
    emptyColor,
    currentColor,
  } = options

  const layout = getGridLayout(totalWeeks, cellSize, gap)

  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, layout.width, layout.height)

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const row = Math.floor(weekIndex / GRID_COLUMNS)
    const col = weekIndex % GRID_COLUMNS
    const x = col * (cellSize + gap)
    const y = row * (cellSize + gap)
    const isPast = weekIndex < weeksLived
    const isCurrent = weekIndex === weeksLived

    if (isCurrent) {
      context.fillStyle = currentColor
    } else if (isPast) {
      context.fillStyle = livedColor
    } else {
      context.fillStyle = emptyColor
    }

    context.fillRect(x, y, cellSize, cellSize)

    if (selectedWeek === weekIndex) {
      context.strokeStyle = '#ffffff'
      context.lineWidth = 2
      context.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2)
    }
  }

  return layout
}

/** @deprecated kept for old test compat */
export function drawLegacyGridToContext(
  context: CanvasRenderingContext2D,
  options: LegacyGridRenderOptions,
): GridLayout {
  const {
    totalWeeks,
    weeksLived,
    categoryIndices,
    categories,
    selectedWeek,
    cellSize,
    gap,
    emptyColor,
    accentColor,
  } = options

  const layout = getGridLayout(totalWeeks, cellSize, gap)
  context.clearRect(0, 0, layout.width, layout.height)

  for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
    const row = Math.floor(weekIndex / GRID_COLUMNS)
    const col = weekIndex % GRID_COLUMNS
    const x = col * (cellSize + gap)
    const y = row * (cellSize + gap)
    const categoryIndex = categoryIndices[weekIndex]
    const category = categories[categoryIndex]
    const isPast = weekIndex < weeksLived
    const isCurrent = weekIndex === weeksLived

    context.fillStyle = category
      ? isPast
        ? category.color
        : hexToRgba(category.color, 0.35)
      : emptyColor
    context.fillRect(x, y, cellSize, cellSize)

    if (!isPast) {
      context.strokeStyle = hexToRgba('#ffffff', 0.14)
      context.lineWidth = 1
      context.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)
    }

    if (isCurrent) {
      context.strokeStyle = accentColor
      context.lineWidth = 2
      context.strokeRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1)
    }

    if (selectedWeek === weekIndex) {
      context.strokeStyle = '#ffffff'
      context.lineWidth = 2
      context.strokeRect(x + 1.5, y + 1.5, cellSize - 3, cellSize - 3)
    }
  }

  return layout
}

export function getWeekIndexAtPoint(
  x: number,
  y: number,
  totalWeeks: number,
  cellSize: number,
  gap: number,
): number | null {
  const unit = cellSize + gap
  const col = Math.floor(x / unit)
  const row = Math.floor(y / unit)

  if (col < 0 || col >= GRID_COLUMNS || row < 0) return null
  if (x % unit > cellSize || y % unit > cellSize) return null

  const index = row * GRID_COLUMNS + col
  if (index < 0 || index >= totalWeeks) return null
  return index
}
