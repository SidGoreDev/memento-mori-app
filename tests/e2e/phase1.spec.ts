import { expect, test } from '@playwright/test'

test('phase 1 desktop flow renders grid and exports png', async ({ page }) => {
  await page.goto('/')

  await page.getByTestId('birth-date-input').fill('1990-01-01')
  await page.getByTestId('render-grid-button').click()

  await expect(page.getByTestId('visualization-view')).toBeVisible()
  await expect(page.getByTestId('insights-panel')).toContainText('Weeks lived')
  await expect(page.getByTestId('memento-grid')).toBeVisible()

  const downloadPromise = page.waitForEvent('download')
  await page.getByTestId('export-png-button').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('memento-mori-')
})

test.describe('mobile friendliness', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('mobile viewport keeps layout usable', async ({ page }) => {
    await page.goto('/')
    await page.getByTestId('birth-date-input').fill('1990-01-01')
    await page.getByTestId('render-grid-button').click()

    await expect(page.getByTestId('visualization-view')).toBeVisible()

    const horizontalOverflow = await page.evaluate(() => {
      const { scrollWidth, clientWidth } = document.documentElement
      return scrollWidth > clientWidth + 1
    })

    expect(horizontalOverflow).toBe(false)
  })
})
