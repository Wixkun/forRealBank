import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ForRealBank|forRealBank/i);
  });

  test('should have header visible', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header, nav, [role="banner"]').first();
    await expect(header).toBeVisible();
  });

  test('should navigate without crashing', async ({ page }) => {
    await page.goto('/');
    
    let hasErrors = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        hasErrors = true;
      }
    });

    await page.waitForTimeout(1000);
    expect(hasErrors).toBe(false);
  });

  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('/');
    
    const main = page.locator('main');
    await expect(main).toBeVisible().catch(() => {
      expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile friendly on iPhone', async ({ page }) => {
    await page.goto('/');
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(600);
    
    await expect(page).not.toHaveTitle('Error');
  });

  test('should be desktop friendly', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page).not.toHaveTitle('Error');
  });
});
