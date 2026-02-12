import { create } from 'zustand'
import { DEFAULT_LIFE_EXPECTANCY } from '../lib/defaults'

export type AppStep = 'input' | 'visualization'

interface AppStore {
  birthDate: string
  lifeExpectancyYears: number
  step: AppStep
  setBirthDate: (birthDate: string) => void
  setLifeExpectancyYears: (years: number) => void
  setStep: (step: AppStep) => void
  reset: () => void
}

const initialState = {
  birthDate: '',
  lifeExpectancyYears: DEFAULT_LIFE_EXPECTANCY,
  step: 'input' as AppStep,
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setBirthDate: (birthDate) => set({ birthDate }),
  setLifeExpectancyYears: (lifeExpectancyYears) => set({ lifeExpectancyYears }),
  setStep: (step) => set({ step }),
  reset: () => set({ ...initialState }),
}))
