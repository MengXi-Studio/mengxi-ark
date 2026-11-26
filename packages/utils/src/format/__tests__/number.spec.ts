import { describe, expect, it } from 'vitest'
import { formatNumber } from '../number'

describe('formatNumber', () => {
	it('默认保留原值小数并添加千分位', () => {
		expect(formatNumber(1234567.891)).toBe('1,234,567.891')
		expect(formatNumber(123)).toBe('123')
		expect(formatNumber('1234567')).toBe('1,234,567')
	})

	it('支持 precision 与自定义千分位分隔符', () => {
		expect(formatNumber(1234567.891, { precision: 2 })).toBe('1,234,567.89')
		expect(formatNumber(1234567.891, { precision: 2, thousandSeparator: '_' })).toBe('1_234_567.89')
		expect(formatNumber(1234567.891, { thousandSeparator: '' })).toBe('1234567.891')
	})

	it('负数符号置于最前', () => {
		expect(formatNumber(-9876543.21)).toBe('-9,876,543.21')
		expect(formatNumber(-9876543.21, { precision: 1 })).toBe('-9,876,543.2')
	})

	it('空串或非法输入返回空字符串', () => {
		expect(formatNumber('')).toBe('')
		expect(formatNumber('abc')).toBe('')
		expect(formatNumber(Number.NaN)).toBe('')
		expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('')
	})
})
