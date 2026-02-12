import { describe, expect, it } from 'vitest'
import { encodeStateToHash, decodeStateFromHash } from './shareState'
import type { AppState } from '../types'

const sampleState: AppState = {
  birthDate: '1990-01-01',
  lifeExpectancyYears: 80,
}

describe('shareState', () => {
  it('encodes and decodes a stable payload', () => {
    const hash = encodeStateToHash(sampleState)
    const decoded = decodeStateFromHash(hash)

    expect(decoded).not.toBeNull()
    expect(decoded?.birthDate).toBe(sampleState.birthDate)
    expect(decoded?.lifeExpectancyYears).toBe(sampleState.lifeExpectancyYears)
  })

  it('returns null for invalid hash', () => {
    const decoded = decodeStateFromHash('not-valid')
    expect(decoded).toBeNull()
  })
})
