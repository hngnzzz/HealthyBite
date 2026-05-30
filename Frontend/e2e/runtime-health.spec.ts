import { expect, test } from '@playwright/test'

test('HealthyMeal runtime stack smoke', async ({ page }) => {
  const stamp = Date.now()
  const email = `runtime-${stamp}@healthymeal.test`
  const password = 'Runtime123456!'

  await page.goto('http://localhost:5173/')
  await expect(page.locator('.topbar__nav a')).toHaveCount(1)
  await expect(page.locator('.topbar__nav a')).toHaveText('Blogs')
  await expect(page.locator('a[href="#features"]')).toHaveCount(0)
  await expect(page.locator('a[href="#plans"]')).toHaveCount(0)
  await expect(page.locator('.hero-section__glow, .floating')).toHaveCount(0)

  await page.goto('http://localhost:5173/login')
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password')
  await page.getByRole('button', { name: 'Show password' }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Hide password' }).click()
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password')

  await page.goto('http://localhost:5173/register')
  await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible()

  await page.getByLabel('Name').fill('Runtime User')
  await page.getByLabel('Mobile no.').fill('+84900000000')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.locator('input[name="confirmPassword"]').fill(password)
  await page.getByRole('button', { name: 'Get started' }).click()

  await expect(page).toHaveURL(/\/welcome$/)
  await page.getByRole('link', { name: 'Start' }).click()

  await expect(page).toHaveURL(/\/choose-goals$/)
  await page.getByRole('button', { name: /Lose weight/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()

  await expect(page).toHaveURL(/\/fill-details$/)
  await page.getByPlaceholder('Enter your name here').fill('Runtime User')
  await page.locator('select[name="birthDay"]').selectOption('15')
  await page.locator('select[name="birthMonth"]').selectOption('05')
  await page.locator('select[name="birthYear"]').selectOption('1995')
  await page.getByPlaceholder('Enter your current weight in kgs').fill('72')
  await page.getByPlaceholder('Enter your desired weight in kgs').fill('68')
  await page.getByPlaceholder('Enter your height in cm').fill('175')
  await page.getByRole('button', { name: 'Create my plan' }).click()

  await expect(page).toHaveURL(/\/plan-ready$/)
  await page.getByRole('button', { name: 'Open dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Hello,/ })).toBeVisible()

  await page.goto('http://localhost:5173/body-review')
  await expect(page.getByRole('heading', { name: 'Body Review' })).toBeVisible()
  await page.getByPlaceholder('Enter waist circumference').fill('82')
  await page.getByPlaceholder('Enter hip circumference').fill('94')
  await page.getByPlaceholder('Enter shoulder measurement').fill('108')
  await page.getByPlaceholder('Enter chest measurement').fill('100')
  await expect(page.getByRole('heading', { name: /Body Shape Assessment: (Trapezoid|Athletic|Rectangle|Inverted Triangle|V-shape|Muscular)/ })).toBeVisible()

  await page.goto('http://localhost:5173/food-search')
  await expect(page.getByRole('heading', { name: 'Food Search' })).toBeVisible()
  await page.getByPlaceholder(/Search Vietnamese or English foods/).fill('apple')
  await expect.poll(async () => await page.locator('.food-item-card').count(), { timeout: 15000 }).toBeGreaterThan(0)
})
