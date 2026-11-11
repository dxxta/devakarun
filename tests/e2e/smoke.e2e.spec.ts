import { expect, test } from '@playwright/test'

test('homepage responds successfully', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
})

test('admin requires anonymous visitors to log in', async ({ page }) => {
  await page.goto('/admin')

  await expect(page.locator('form')).toBeVisible()
  await expect(page.locator('input[type="email"]')).toBeVisible()
  await expect(page.locator('input[type="password"]')).toBeVisible()
})
