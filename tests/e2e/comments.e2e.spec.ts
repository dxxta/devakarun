import { expect, test } from '@playwright/test'

test('anonymous visitors can read comments and are prompted to sign in to write', async ({ page }) => {
  await page.goto('/blog/building-a-steady-writing-habit')

  const section = page.getByRole('region', { name: 'Comments' })
  await expect(section).toBeVisible()
  await expect(section.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  await expect(section.getByLabel('Your comment')).toHaveCount(0)
})
