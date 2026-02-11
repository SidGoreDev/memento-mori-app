import type { ColorScheme } from '../types'

interface ThemeVars {
  bgPrimary: string
  bgSurface: string
  textPrimary: string
  textMuted: string
  gridEmpty: string
  accent: string
}

export const THEMES: Record<ColorScheme, ThemeVars> = {
  obsidian: {
    bgPrimary: '#0D0D0D',
    bgSurface: '#1A1A1A',
    textPrimary: '#E8E8E8',
    textMuted: '#666666',
    gridEmpty: '#1F1F1F',
    accent: '#FF6B35',
  },
  paper: {
    bgPrimary: '#F5F0EB',
    bgSurface: '#FFFFFF',
    textPrimary: '#2C2C2C',
    textMuted: '#777777',
    gridEmpty: '#E8E3DE',
    accent: '#D4421E',
  },
  midnight: {
    bgPrimary: '#0A0E1A',
    bgSurface: '#111827',
    textPrimary: '#D1D5DB',
    textMuted: '#6B7280',
    gridEmpty: '#151C2E',
    accent: '#60A5FA',
  },
}

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const value = parseInt(clean, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
