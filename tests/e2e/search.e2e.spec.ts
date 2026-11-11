import { expect, test } from '@playwright/test'

test('search finds a seeded post by a word in its title', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open search' }).click()
  await page.getByRole('searchbox', { name: 'Search posts and projects' }).fill('steady')
  await expect(page.getByRole('link', { name: 'Building a steady writing habit' })).toBeVisible()
})

test('search results link to their corresponding content routes', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Open search' }).click()
  await page.getByRole('searchbox', { name: 'Search posts and projects' }).fill('design')

  const resultLinks = page.getByRole('list', { name: 'Search results' }).getByRole('link')
  await expect(resultLinks.first()).toHaveAttribute('href', /\/(blog|projects)\//)
})
