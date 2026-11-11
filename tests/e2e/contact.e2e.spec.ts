import { expect, test } from '@playwright/test'

test('contact page presents the validated message form', async ({ page }) => {
  await page.goto('/contact')

  await expect(page.getByRole('heading', { name: 'Contact', level: 1 })).toBeVisible()
  await expect(page.getByLabel('Name')).toBeVisible()
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel('Subject')).toBeVisible()
  await expect(page.getByLabel('Message')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send message' })).toBeVisible()
})
