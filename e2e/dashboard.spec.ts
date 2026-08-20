import { expect, test } from '@playwright/test'

test.describe('Luxe Tracker dashboard', () => {
  test('renders live telemetry with the 38.0% hero number', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible()
    await expect(page.getByText('Live Telemetry')).toBeVisible()
    await expect(page.getByText('Maximum Markup vs EU')).toBeVisible()
    await expect(page.locator('span.hero-num').first()).toContainText('38.0')
    await expect(page.locator('aside').getByText('Luxe', { exact: true })).toBeVisible()
    await expect(page.locator('aside').getByText('Tracker', { exact: true })).toBeVisible()
    await expect(page.getByText('Across 5 maisons, 5 regions, 25 SKUs')).toBeVisible()
  })

  test('navigates to the Price Matrix panel', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Price Matrix' }).click()
    await expect(page.getByRole('heading', { name: 'Price Matrix' })).toBeVisible()
    await expect(page.getByText('Price Disparity Matrix')).toBeVisible()
  })

  test('toggles dark / light theme on <html>', async ({ page }) => {
    await page.goto('/')

    const html = page.locator('html')
    const before = await html.getAttribute('data-theme')
    expect(before).toMatch(/^(dark|light)$/)

    await page.getByRole('button', { name: /Switch to (light|dark) mode/ }).click()

    const after = await html.getAttribute('data-theme')
    expect(after).toMatch(/^(dark|light)$/)
    expect(after).not.toBe(before)
  })
})
