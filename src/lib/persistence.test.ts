import { beforeEach, describe, expect, it } from 'vitest'
import { clearStoredState, loadStateFromStorage, saveStateToStorage } from './persistence'
import type { AppState } from '../types'

const sampleState: AppState = {
  birthDate: '1988-05-11',
  lifeExpectancyYears: 86,
}

describe('storage persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and loads state', () => {
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
