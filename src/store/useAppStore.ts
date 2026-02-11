import { create } from 'zustand'
import { DEFAULT_CATEGORIES, DEFAULT_LIFE_EXPECTANCY } from '../lib/defaults'
import type { Category, ColorScheme } from '../types'

export type AppStep = 'input' | 'visualization'

interface AppStore {
  birthDate: string
  lifeExpectancyYears: number
  categories: Category[]
  colorScheme: ColorScheme
  step: AppStep
  hoveredWeek: number | null
  setBirthDate: (birthDate: string) => void
  setLifeExpectancyYears: (years: number) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  addCategory: () => void
  removeCategory: (id: string) => void
  setColorScheme: (scheme: ColorScheme) => void
  setStep: (step: AppStep) => void
  setHoveredWeek: (week: number | null) => void
  reset: () => void
}

const initialState = {
  birthDate: '',
  lifeExpectancyYears: DEFAULT_LIFE_EXPECTANCY,
  categories: DEFAULT_CATEGORIES,
  colorScheme: 'obsidian' as ColorScheme,
  step: 'input' as AppStep,
  hoveredWeek: null,
}

function createCategoryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `category-${Math.random().toString(36).slice(2, 10)}`
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setBirthDate: (birthDate) => set({ birthDate }),
  setLifeExpectancyYears: (lifeExpectancyYears) => set({ lifeExpectancyYears }),
  updateCategory: (id, updates) =>
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === id ? { ...category, ...updates } : category,
      ),
    })),
  addCategory: () =>
    set((state) => ({
      categories: [
        ...state.categories,
        {
          id: createCategoryId(),
          name: `Category ${state.categories.length + 1}`,
          color: '#A0A0A0',
          pastPercent: 0,
          futurePercent: 0,
        },
      ],
    })),
  removeCategory: (id) =>
    set((state) => {
      if (state.categories.length <= 1) return state
      return { categories: state.categories.filter((category) => category.id !== id) }
    }),
  setColorScheme: (colorScheme) => set({ colorScheme }),
  setStep: (step) => set({ step }),
  setHoveredWeek: (hoveredWeek) => set({ hoveredWeek }),
  reset: () => set({ ...initialState }),
}))
