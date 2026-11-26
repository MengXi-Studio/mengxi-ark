import { expect, test, type Page } from '@playwright/test';

/** 收集页面 console.error 与未捕获异常 */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(String(error)));
  return errors;
}

test.describe('demo-platform 中台基座冒烟', () => {
  test('工作台加载 → 用户管理 Lov 基座值集 → DSL 渲染演示页，无控制台报错', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('http://localhost:5174/');
    await page.waitForURL(/#\//);

    // 1. 工作台 Layout（侧栏菜单 + 模块注册的首个页面）
    await expect(page.getByRole('menu')).toBeVisible();
    await expect(page.getByRole('heading', { name: '基座上下文探测' })).toBeVisible();
    await expect(page.getByText('权限码').first()).toBeVisible();

    // 2. 用户管理页：Lov lovCode 命中基座上下文 lovCache.STATUS（启用 / 停用）
    const statusLov = page.locator('.ant-select').first();
    await statusLov.scrollIntoViewIfNeeded();
    await statusLov.click();
    const dropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    await expect(dropdown.locator('.ant-select-item-option', { hasText: '启用' })).toBeVisible();
    await expect(dropdown.locator('.ant-select-item-option', { hasText: '停用' })).toBeVisible();
    await page.keyboard.press('Escape');

    // 3. 业务管理子菜单 → DSL 渲染演示页（三卡片 + Lov 值集联动）
    await page.getByText('业务管理', { exact: true }).click();
    await page.getByText('DSL 渲染演示', { exact: true }).first().click();
    await expect(page.locator('.dsl-card')).toHaveCount(3);
    await page.locator('.dsl-card').first().locator('.ant-select').first().click();
    await expect(
      page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', { hasText: '启用' }),
    ).toBeVisible();

    expect(errors, `控制台报错：\n${errors.join('\n')}`).toEqual([]);
  });
});
