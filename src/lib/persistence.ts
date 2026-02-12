import type { AppState } from '../types'
import { LIFE_EXPECTANCY_MIN, LIFE_EXPECTANCY_MAX } from './defaults'

export const STORAGE_KEY = 'memento-mori-state'

export function saveStateToStorage(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function loadStateFromStorage(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed.birthDate !== 'string') return null
    if (typeof parsed.lifeExpectancyYears !== 'number') return null
    return {
      birthDate: parsed.birthDate,
      lifeExpectancyYears: Math.max(
        LIFE_EXPECTANCY_MIN,
        Math.min(LIFE_EXPECTANCY_MAX, parsed.lifeExpectancyYears),
      ),
    }
  } catch {
    return null
  }
}

export function clearStoredState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
