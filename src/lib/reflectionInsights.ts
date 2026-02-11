import type { Category, DerivedMetrics } from '../types'

function roundWeeks(weeks: number): string {
  return Math.round(weeks).toLocaleString()
}

export function generateReflectionInsights(
  metrics: DerivedMetrics,
  categories: Category[],
): string[] {
  if (categories.length === 0) {
    return [
      'You have a finite grid. Define at least one category to make that time intentional.',
      'Your lived and remaining weeks become clearer once your categories are concrete.',
      'A single category can still reveal where your attention is actually going.',
      'Try assigning future percentages before changing anything else.',
      'Use the next 7 days as a small experiment before changing your full plan.',
    ]
  }

  const dominantPast = categories.reduce((top, category) =>
    category.pastPercent > top.pastPercent ? category : top,
  )
  const dominantFuture = categories.reduce((top, category) =>
    category.futurePercent > top.futurePercent ? category : top,
  )
  const largestShift = categories.reduce((top, category) => {
    const shift = category.futurePercent - category.pastPercent
    return Math.abs(shift) > Math.abs(top.shift) ? { category, shift } : top
  }, { category: categories[0], shift: categories[0].futurePercent - categories[0].pastPercent })

  const yearsRemaining = (metrics.weeksRemaining / 52).toFixed(1)
  const onePercentWeeks = Math.max(1, Math.round(metrics.weeksRemaining / 100))
  const dominantFutureWeeks = (dominantFuture.futurePercent / 100) * metrics.weeksRemaining
  const shiftWeeks = (Math.abs(largestShift.shift) / 100) * metrics.weeksRemaining

  return [
    `You have ${metrics.weeksRemaining.toLocaleString()} weeks left (~${yearsRemaining} years). What matters enough to claim the next 52 weeks on purpose?`,
    `Your past is dominated by ${dominantPast.name} at ${dominantPast.pastPercent}%. Did that happen by design, or by inertia?`,
    `Your plan gives ${dominantFuture.name} about ${roundWeeks(dominantFutureWeeks)} of your remaining weeks. Is that enough for who you want to become?`,
    largestShift.shift >= 0
      ? `Your biggest intended shift is +${largestShift.shift}% toward ${largestShift.category.name} (~${roundWeeks(shiftWeeks)} weeks). What will you deliberately reduce to fund that change?`
      : `Your biggest intended shift is ${largestShift.shift}% away from ${largestShift.category.name} (~${roundWeeks(shiftWeeks)} weeks). What boundary will protect that decision?`,
    `A 1% allocation change is roughly ${onePercentWeeks.toLocaleString()} weeks. Which category deserves your next 1% right now?`,
  ]
}
