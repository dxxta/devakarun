import { expect, test } from '@playwright/test'

test('theme control cycles between light, dark, and system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')

  const themeToggle = page.getByRole('button', { name: /theme: system/i })
  await expect(themeToggle).toBeVisible()
  await themeToggle.click()
  await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  await page.getByRole('button', { name: /theme: dark/i }).click()
  await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
})

test('page fits a 360px viewport without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  const widths = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }))
  expect(widths.document).toBeLessThanOrEqual(360)
  expect(widths.document).toBeLessThanOrEqual(widths.viewport)
})
