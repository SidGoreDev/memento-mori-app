import { LIFE_EXPECTANCY_MAX, LIFE_EXPECTANCY_MIN } from './defaults'
import type { AppInputState, Category } from '../types'

interface SharedStatePayload extends AppInputState {
  schemaVersion: 1
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  return pad ? `${base64}${'='.repeat(4 - pad)}` : base64
}

function isValidCategory(candidate: unknown): candidate is Category {
  if (!candidate || typeof candidate !== 'object') return false
  const data = candidate as Category
  return (
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.color === 'string' &&
    typeof data.pastPercent === 'number' &&
    typeof data.futurePercent === 'number'
  )
}

function parsePayload(raw: unknown): SharedStatePayload | null {
  if (!raw || typeof raw !== 'object') return null
  const payload = raw as Partial<SharedStatePayload>
  if (payload.schemaVersion !== 1) return null
  if (typeof payload.birthDate !== 'string') return null
  if (
    typeof payload.lifeExpectancyYears !== 'number' ||
    Number.isNaN(payload.lifeExpectancyYears)
  ) {
    return null
  }
  if (!Array.isArray(payload.categories) || !payload.categories.every(isValidCategory)) {
    return null
  }
  if (
    payload.colorScheme !== 'obsidian' &&
    payload.colorScheme !== 'paper' &&
    payload.colorScheme !== 'midnight'
  ) {
    return null
  }

  return {
    schemaVersion: 1,
    birthDate: payload.birthDate,
    lifeExpectancyYears: clamp(
      payload.lifeExpectancyYears,
      LIFE_EXPECTANCY_MIN,
      LIFE_EXPECTANCY_MAX,
    ),
    categories: payload.categories.map((category) => ({
      ...category,
      pastPercent: clamp(Math.round(category.pastPercent), 0, 100),
      futurePercent: clamp(Math.round(category.futurePercent), 0, 100),
    })),
    colorScheme: payload.colorScheme,
  }
}

export function encodeStateToHash(state: AppInputState): string {
  const payload: SharedStatePayload = { ...state, schemaVersion: 1 }
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  return `v1.${toBase64Url(bytesToBase64(bytes))}`
}

export function decodeStateFromHash(hashValue: string): SharedStatePayload | null {
  const trimmed = hashValue.replace(/^#/, '')
  if (!trimmed.startsWith('v1.')) return null
  const encoded = trimmed.slice(3)

  try {
    const bytes = base64ToBytes(fromBase64Url(encoded))
    const json = new TextDecoder().decode(bytes)
    const payload = JSON.parse(json)
    return parsePayload(payload)
  } catch {
    return null
  }
}
