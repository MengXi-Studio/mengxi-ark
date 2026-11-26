import { expect, test, type Page } from '@playwright/test'

/** 收集页面 console.error 与未捕获异常（vite debug 信息不算错误） */
function trackPageErrors(page: Page): string[] {
	const errors: string[] = []
	page.on('console', message => {
		if (message.type() === 'error') errors.push(message.text())
	})
	page.on('pageerror', error => errors.push(String(error)))
	return errors
}

test.describe('demo-light 轻量模式冒烟', () => {
	test('五个演示 tab 依次渲染，DSL 查询区函数式联动生效，无控制台报错', async ({ page }) => {
		const errors = trackPageErrors(page)
		await page.goto('/')

		const tabs = ['Utils 工具函数', 'Theme 设计令牌', 'Hooks 组合式函数', '组件（components / biz-components）', 'DSL 配置渲染（加速方案）']
		for (const label of tabs) {
			await page.getByRole('button', { name: label }).click()
			// 每个 tab 渲染出内容面板（main 区域非空）
			await expect(page.locator('.page-main section').first()).toBeVisible()
		}

		// DSL tab 关键交互：时间类型=自定义 → 出现日期范围控件（QueryRenderer visible 函数式联动）
		const queryZone = page.locator('.mx-dsl-query')
		await expect(queryZone.getByText('关键字')).toBeVisible()
		await queryZone.locator('.ant-select').first().click()
		await page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', { hasText: '自定义' }).click()
		await expect(queryZone.getByText('日期范围')).toBeVisible()

		expect(errors, `控制台报错：\n${errors.join('\n')}`).toEqual([])
	})
})
