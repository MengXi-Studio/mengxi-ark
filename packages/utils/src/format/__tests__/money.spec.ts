import { describe, expect, it } from 'vitest'
import { formatMoney } from '../money'

describe('formatMoney', () => {
	it('默认保留两位小数并添加 ¥ 符号与千分位', () => {
		expect(formatMoney(1234567.891)).toBe('¥1,234,567.89')
		expect(formatMoney(0)).toBe('¥0.00')
		expect(formatMoney('999')).toBe('¥999.00')
	})

	it('支持自定义 precision / symbol / separator', () => {
		expect(formatMoney(1234.5, { precision: 0 })).toBe('¥1,235')
		expect(formatMoney(1234.5, { precision: 3, symbol: '$' })).toBe('$1,234.500')
		expect(formatMoney(1234.5, { separator: false, symbol: '' })).toBe('1234.50')
		expect(formatMoney(1234.5, { separator: false })).toBe('¥1234.50')
	})

	it('负数符号置于最前', () => {
		expect(formatMoney(-1234.5)).toBe('-¥1,234.50')
		expect(formatMoney(-1234.5, { symbol: '$' })).toBe('-$1,234.50')
	})

	it('空串或无法解析的字符串返回空字符串', () => {
		expect(formatMoney('')).toBe('')
		expect(formatMoney('  ')).toBe('')
		expect(formatMoney('abc')).toBe('')
		expect(formatMoney(Number.NaN)).toBe('')
		expect(formatMoney(Number.POSITIVE_INFINITY)).toBe('')
	})
})
