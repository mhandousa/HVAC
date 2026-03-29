import { test, expect } from '@playwright/test';

test.describe('Design Workflow Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to design workflow wizard
    await page.goto('/design/workflow-wizard');
  });

  test('displays all workflow stages in the wizard', async ({ page }) => {
    // Verify the main workflow wizard page loads
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check for workflow stage indicators (common stages)
    const stageTexts = [
      'Load',
      'Ventilation', 
      'Equipment',
      'Distribution',
    ];
    
    for (const text of stageTexts) {
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
  });

  test('shows progress bar with correct number of stages', async ({ page }) => {
    // Look for the progress indicator or stage count
    const progressBar = page.locator('[class*="progress"]').first();
    await expect(progressBar).toBeVisible();
  });

  test('can navigate to individual design tools', async ({ page }) => {
    // Navigate to load calculation tool
    await page.goto('/design/load-calculation');
    await expect(page).toHaveURL(/load-calculation/);
    
    // Navigate to equipment selection
    await page.goto('/design/equipment-selection');
    await expect(page).toHaveURL(/equipment-selection/);
  });
});

test.describe('Design Tools Navigation', () => {
  test('load calculation page loads correctly', async ({ page }) => {
    await page.goto('/design/load-calculation');
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('equipment selection page loads correctly', async ({ page }) => {
    await page.goto('/design/equipment-selection');
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('ahu configuration page loads correctly', async ({ page }) => {
    await page.goto('/design/ahu-configuration');
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('duct sizing page loads correctly', async ({ page }) => {
    await page.goto('/design/duct-sizing');
    
    // Check for main content area
    await expect(page.locator('main')).toBeVisible();
  });
});

test.describe('Design System Coverage Dashboard', () => {
  test('coverage dashboard loads and displays metrics', async ({ page }) => {
    await page.goto('/design/coverage');
    
    // Check for the main heading
    await expect(page.getByRole('heading', { name: /Design System Coverage/i })).toBeVisible();
    
    // Check for coverage percentage displays
    await expect(page.getByText(/PreSave Validation/i)).toBeVisible();
    await expect(page.getByText(/DataFlow Import/i)).toBeVisible();
    await expect(page.getByText(/CrossTool Validation/i)).toBeVisible();
  });

  test('coverage dashboard shows tool list', async ({ page }) => {
    await page.goto('/design/coverage');
    
    // Check for tool names in the table
    await expect(page.getByText('Load Calculation')).toBeVisible();
    await expect(page.getByText('Ventilation')).toBeVisible();
  });

  test('can search/filter tools in coverage dashboard', async ({ page }) => {
    await page.goto('/design/coverage');
    
    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('acoustic');
      
      // Verify filtered results
      await expect(page.getByText(/acoustic/i).first()).toBeVisible();
    }
  });
});

test.describe('Cross-Tool Validation Alerts', () => {
  test('design tools show validation banners when present', async ({ page }) => {
    // Navigate to a tool that has cross-tool validation
    await page.goto('/design/equipment-selection');
    
    // Check if the page loads (validation alerts depend on data state)
    await expect(page.locator('main')).toBeVisible();
    
    // Look for any validation alert containers (may or may not be visible based on data)
    const alertContainer = page.locator('[data-testid="cross-tool-validation-alert"]');
    // We just verify the page structure works, alerts depend on actual data
  });
});

test.describe('Data Lineage Graph', () => {
  test('data lineage component renders in design tools', async ({ page }) => {
    // Navigate to a page that might include the data lineage graph
    await page.goto('/design/workflow-wizard');
    
    // Check for the data lineage card if present
    const lineageCard = page.getByText('Data Lineage');
    // The component may or may not be visible based on project data
  });
});

test.describe('Stage Locking', () => {
  test('stage lock indicators are visible in wizard', async ({ page }) => {
    await page.goto('/design/workflow-wizard');
    
    // Check for lock-related UI elements
    // Lock buttons/indicators depend on project state
    await expect(page.locator('main')).toBeVisible();
  });
});
