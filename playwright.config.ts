import { defineConfig, devices } from '@playwright/test';

/**
 * M5 E2E 冒烟：双 demo 关键路径。
 * webServer 自动拉起两个 demo dev server（vite dev），测试结束自动回收。
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    // demo-light 为默认 baseURL；demo-platform 用绝对地址（不同端口）
    baseURL: 'http://localhost:5173/',
  },
  webServer: [
    {
      command: 'pnpm --filter demo-light dev --port 5173 --strictPort',
      url: 'http://localhost:5173/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter demo-platform dev --port 5174 --strictPort',
      url: 'http://localhost:5174/',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
