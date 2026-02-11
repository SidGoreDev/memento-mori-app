import { expect, test } from '@playwright/test'

test('restores input state from localStorage on reload', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('birth-date-input').fill('1987-03-22')
  await page.reload()

  await expect(page.getByTestId('birth-date-input')).toHaveValue('1987-03-22')
})

test('loads state from URL hash share payload', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('birth-date-input').fill('1992-11-19')

  const hash = await page.evaluate(() => localStorage.getItem('memento-mori-state'))
  expect(hash).toBeTruthy()

  await page.goto(`/#${hash}`)
  await expect(page.getByTestId('birth-date-input')).toHaveValue('1992-11-19')
})

test('allows adding and removing categories', async ({ page }) => {
  await page.goto('/')
  const beforeCount = await page.locator('.category-row').count()

  await page.getByTestId('add-category-button').click()
  await expect(page.locator('.category-row')).toHaveCount(beforeCount + 1)

  await page.getByRole('button', { name: 'Remove Category 6' }).click()
  await expect(page.locator('.category-row')).toHaveCount(beforeCount)
})
