import { expect, test } from '@playwright/test'

test.describe('About page', () => {
  test('shows the seeded profile and opens a featured project', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Dinta Syaifuddin' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Featured projects' })).toBeVisible()

    const featuredProject = page.getByRole('link', {
      name: /Byecheating: Real-time Exam Integrity Platform For Cheating Detection/,
    })
    await expect(featuredProject).toBeVisible()
    await featuredProject.click()

    await expect(page).toHaveURL(/\/projects\/byecheating$/)
    await expect(
      page.getByRole('heading', {
        name: 'Byecheating: Real-time Exam Integrity Platform For Cheating Detection',
        level: 1,
      }),
    ).toBeVisible()
    await expect(
      page.getByText(
        'Integrated REST API with a cheating detection model (YOLOv5) through RTSP protocol.',
      ),
    ).toBeVisible()
  })

  test('shows Payload technologies, certificates, and projects on the About page', async ({
    page,
  }) => {
    await page.goto('/about')

    await expect(
      page.getByRole('heading', { name: 'Dinta Syaifuddin', level: 1 }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Technology' })).toBeVisible()
    await expect(page.getByText('Vue', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Certificates' })).toBeVisible()
    await expect(page.getByText('Kotlin Android Intermediate')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible()
    await expect(
      page.getByRole('link', {
        name: /Byecheating: Real-time Exam Integrity Platform For Cheating Detection/,
      }),
    ).toBeVisible()
  })
})
