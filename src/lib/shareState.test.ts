import { describe, expect, it } from 'vitest'
import { encodeStateToHash, decodeStateFromHash } from './shareState'
import type { AppInputState } from '../types'

const sampleState: AppInputState = {
  birthDate: '1990-01-01',
  lifeExpectancyYears: 80,
  colorScheme: 'obsidian',
  categories: [
    { id: 'a', name: 'Work', color: '#111111', pastPercent: 50, futurePercent: 40 },
    { id: 'b', name: 'Family', color: '#222222', pastPercent: 50, futurePercent: 60 },
  ],
}

describe('shareState', () => {
  it('encodes and decodes a stable payload', () => {
    const hash = encodeStateToHash(sampleState)
    const decoded = decodeStateFromHash(hash)

    expect(decoded).not.toBeNull()
    expect(decoded?.birthDate).toBe(sampleState.birthDate)
    expect(decoded?.lifeExpectancyYears).toBe(sampleState.lifeExpectancyYears)
    expect(decoded?.categories).toHaveLength(2)
  })

  it('returns null for invalid hash', () => {
    const decoded = decodeStateFromHash('not-valid')
    expect(decoded).toBeNull()
  })
})
