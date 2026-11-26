import { describe, expect, it } from 'vitest'
import { formatDate } from '../date'

describe('formatDate', () => {
	it('时间戳 / Date 入参按默认模式格式化', () => {
		const ts = new Date(2026, 0, 2, 3, 4, 5, 6).getTime()
		expect(formatDate(ts)).toBe('2026-01-02 03:04:05')
		expect(formatDate(new Date(2026, 10, 25, 13, 5, 9, 789))).toBe('2026-11-25 13:05:09')
	})

	it('支持自定义模式、string 入参与毫秒占位符', () => {
		const date = new Date(2026, 10, 25, 13, 5, 9, 789)
		expect(formatDate(date, 'YYYY/MM/DD HH:mm:ss.SSS')).toBe('2026/11/25 13:05:09.789')
		// ISO 无时区后缀按本地时间解析，断言不依赖运行环境时区
		expect(formatDate('2026-06-08T00:00:00', 'YYYY年MM月DD日')).toBe('2026年06月08日')
		expect(formatDate(date, 'S')).toBe('789')
	})

	it('非法输入返回空字符串', () => {
		expect(formatDate('not-a-date')).toBe('')
		expect(formatDate(Number.NaN)).toBe('')
		expect(formatDate('')).toBe('')
	})
})
