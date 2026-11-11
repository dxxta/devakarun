import { expect, test } from '@playwright/test'

test('published blog posts appear and can be opened', async ({ page }) => {
  await page.goto('/blog')

  const postLink = page.getByRole('link', { name: 'Building a steady writing habit' })
  await expect(postLink).toBeVisible()
  await postLink.click()
  await expect(page).toHaveURL('/blog/building-a-steady-writing-habit')
  await expect(page.getByRole('heading', { name: 'Building a steady writing habit' })).toBeVisible()
})

test('search returns matching published posts', async ({ page }) => {
  await page.goto('/search?q=steady')

  await expect(page.getByRole('link', { name: 'Building a steady writing habit' })).toBeVisible()
})

test('draft posts are not exposed by public routes', async ({ page }) => {
  const response = await page.goto('/blog/a-draft-about-search-quality')
  expect(response?.status()).toBe(404)
})
