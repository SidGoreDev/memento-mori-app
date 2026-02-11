import { beforeEach, describe, expect, it } from 'vitest'
import { clearStoredState, loadStateFromStorage, saveStateToStorage } from './persistence'
import type { AppInputState } from '../types'

const sampleState: AppInputState = {
  birthDate: '1988-05-11',
  lifeExpectancyYears: 86,
  colorScheme: 'paper',
  categories: [
    { id: '1', name: 'Work', color: '#111111', pastPercent: 30, futurePercent: 20 },
    { id: '2', name: 'Family', color: '#222222', pastPercent: 70, futurePercent: 80 },
  ],
}

describe('storage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads encoded state', () => {
    saveStateToStorage(sampleState)
    const loaded = loadStateFromStorage()
    expect(loaded).toEqual(sampleState)
  })

  it('clears stored state', () => {
    saveStateToStorage(sampleState)
    clearStoredState()
    expect(loadStateFromStorage()).toBeNull()
  })
})
