import { describe, expect, it } from 'vitest'
import { chunk, groupBy, unique } from '../index'

describe('unique', () => {
	it('原始值去重（含 NaN 视为相同）', () => {
		expect(unique([1, 2, 2, 3, 'a', 'a'])).toEqual([1, 2, 3, 'a'])
		expect(unique([Number.NaN, Number.NaN, 1])).toHaveLength(2)
		expect(unique([])).toEqual([])
	})

	it('按字段值去重对象数组，保留首个出现元素且不改入参', () => {
		const source = [
			{ id: 1, v: 'a' },
			{ id: 2, v: 'b' },
			{ id: 1, v: 'c' }
		]
		const result = unique(source, 'id')
		expect(result).toEqual([
			{ id: 1, v: 'a' },
			{ id: 2, v: 'b' }
		])
		expect(source).toHaveLength(3)
		expect(result[0]).toBe(source[0])
	})

	it('字段缺失的元素按 undefined 键去重', () => {
		const result = unique([{ a: 1 }, { b: 2 }, { c: 3 }], 'a')
		expect(result).toEqual([{ a: 1 }, { b: 2 }])
	})
})

describe('groupBy', () => {
	it('按函数返回键分组', () => {
		const result = groupBy([1, 2, 3, 4], n => (n % 2 === 0 ? 'even' : 'odd'))
		expect(result).toEqual({ odd: [1, 3], even: [2, 4] })
	})

	it('数字键转换为字符串键', () => {
		const result = groupBy(['x', 'y', 'z'], item => item.length)
		expect(result).toEqual({ '1': ['x', 'y', 'z'] })
	})

	it('空数组返回空对象', () => {
		expect(groupBy([], n => n)).toEqual({})
	})
})

describe('chunk', () => {
	it('按指定长度切分，末块可小于 size', () => {
		expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
		expect(chunk([1, 2, 3, 4], 2)).toEqual([
			[1, 2],
			[3, 4]
		])
	})

	it('size 大于等于数组长度时整体成一块', () => {
		expect(chunk([1, 2], 5)).toEqual([[1, 2]])
		expect(chunk([1, 2], 2)).toEqual([[1, 2]])
		expect(chunk([], 3)).toEqual([])
	})

	it('非正数或 NaN 的 size 返回空数组', () => {
		expect(chunk([1, 2, 3], 0)).toEqual([])
		expect(chunk([1, 2, 3], -1)).toEqual([])
		expect(chunk([1, 2, 3], Number.NaN)).toEqual([])
	})
})
