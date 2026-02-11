import { describe, expect, it } from 'vitest'
import { getGridLayout, getWeekIndexAtPoint } from './gridRender'

describe('getGridLayout', () => {
  it('computes dimensions from total weeks', () => {
    const layout = getGridLayout(80 * 52, 10, 2)
    expect(layout.rows).toBe(80)
    expect(layout.width).toBe(622)
    expect(layout.height).toBe(958)
  })
})

describe('getWeekIndexAtPoint', () => {
  it('returns null in gap spacing', () => {
    const index = getWeekIndexAtPoint(10.5, 2, 100, 10, 2)
    expect(index).toBeNull()
  })

  it('returns week index for valid cell coordinate', () => {
    const index = getWeekIndexAtPoint(25, 13, 400, 10, 2)
    expect(index).toBe(54)
  })
})
