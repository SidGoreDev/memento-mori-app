import type { AppInputState } from '../types'
import { decodeStateFromHash, encodeStateToHash } from './shareState'

export const STORAGE_KEY = 'memento-mori-state'

export function saveStateToStorage(state: AppInputState): void {
  localStorage.setItem(STORAGE_KEY, encodeStateToHash(state))
}

export function loadStateFromStorage(): AppInputState | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  const decoded = decodeStateFromHash(raw)
  if (!decoded) return null
  const { schemaVersion, ...state } = decoded
  void schemaVersion
  return state
}

export function clearStoredState(): void {
  localStorage.removeItem(STORAGE_KEY)
}
