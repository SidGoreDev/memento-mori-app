import { LIFE_EXPECTANCY_MAX, LIFE_EXPECTANCY_MIN } from './defaults'
import type { AppState } from '../types'

interface SharedStatePayload extends AppState {
  schemaVersion: 2
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function parsePayload(raw: unknown): SharedStatePayload | null {
  if (!raw || typeof raw !== 'object') return null
  const payload = raw as Partial<SharedStatePayload>
  if (payload.schemaVersion !== 2) return null
  if (typeof payload.birthDate !== 'string') return null
  if (
    typeof payload.lifeExpectancyYears !== 'number' ||
    Number.isNaN(payload.lifeExpectancyYears)
  ) {
    return null
  }

  return {
    schemaVersion: 2,
    birthDate: payload.birthDate,
    lifeExpectancyYears: clamp(
      payload.lifeExpectancyYears,
      LIFE_EXPECTANCY_MIN,
      LIFE_EXPECTANCY_MAX,
    ),
  }
}

export function encodeStateToHash(state: AppState): string {
  const payload: SharedStatePayload = { ...state, schemaVersion: 2 }
  const json = JSON.stringify(payload)
  const bytes = new TextEncoder().encode(json)
  return `v2.${toBase64Url(bytesToBase64(bytes))}`
}

export function decodeStateFromHash(hashValue: string): SharedStatePayload | null {
  const trimmed = hashValue.replace(/^#/, '')
  if (!trimmed.startsWith('v2.')) return null
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
