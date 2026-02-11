import { expect, test } from '@playwright/test'

test('share payload roundtrip preserves key inputs', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('birth-date-input').fill('1994-06-15')
  await page.getByTestId('life-expectancy-input').fill('90')

  const hash = await page.evaluate(() => localStorage.getItem('memento-mori-state'))
  expect(hash).toBeTruthy()

  await page.goto(`/#${hash}`)
  await expect(page.getByTestId('birth-date-input')).toHaveValue('1994-06-15')
  await expect(page.getByTestId('life-expectancy-input')).toHaveValue('90')
})

test('grid supports keyboard navigation', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('birth-date-input').fill('1990-01-01')
  await page.getByTestId('render-grid-button').click()

  const grid = page.getByTestId('memento-grid')
  await grid.focus()
  await grid.press('ArrowRight')

  const tooltip = page.getByTestId('week-tooltip')
  await expect(tooltip).toBeVisible()
  const firstText = (await tooltip.textContent()) ?? ''

  await grid.press('ArrowRight')
  const secondText = (await tooltip.textContent()) ?? ''
  expect(secondText).not.toBe(firstText)
})

test('reset clears local persisted state', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('birth-date-input').fill('1989-10-03')
  await page.getByTestId('render-grid-button').click()
  await page.getByTestId('reset-button').click()

  const [hash, stored] = await page.evaluate(() => [
    window.location.hash,
    localStorage.getItem('memento-mori-state'),
  ])

  expect(hash).toBe('')
  expect(stored).toBeNull()
})
