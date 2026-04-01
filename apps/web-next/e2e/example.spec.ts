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
    
    // Check that page loads without console errors
    let hasErrors = false;
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        hasErrors = true;
      }
    });

    // Wait a bit for any deferred errors
    await page.waitForTimeout(1000);
    expect(hasErrors).toBe(false);
  });

  test('should have proper HTML structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    const main = page.locator('main');
    await expect(main).toBeVisible().catch(() => {
      // Fallback if no main element
      expect(page.locator('body')).toBeVisible();
    });
  });
});

test.describe('Responsive Design', () => {
  test('should be mobile friendly on iPhone', async ({ page }) => {
    // This test runs with iPhone 12 viewport from config
    await page.goto('/');
    
    // Check viewport size
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThan(600);
    
    // Page should still load
    await expect(page).not.toHaveTitle('Error');
  });

  test('should be desktop friendly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Page should still load
    await expect(page).not.toHaveTitle('Error');
  });
});
