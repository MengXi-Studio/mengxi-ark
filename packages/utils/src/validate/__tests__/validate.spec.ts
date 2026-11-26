import { describe, expect, it } from 'vitest'
import { isEmail, isEmpty, isIdCard, isPhone } from '../index'

describe('isPhone', () => {
	it('合法的大陆手机号通过', () => {
		expect(isPhone('13812345678')).toBe(true)
		expect(isPhone('19912345678')).toBe(true)
		expect(isPhone('17012345678')).toBe(true)
	})

	it('非法号段或长度不通过', () => {
		expect(isPhone('12812345678')).toBe(false)
		expect(isPhone('23812345678')).toBe(false)
		expect(isPhone('1381234567')).toBe(false)
		expect(isPhone('138123456789')).toBe(false)
	})

	it('含非数字字符不通过', () => {
		expect(isPhone('138-1234-5678')).toBe(false)
		expect(isPhone('')).toBe(false)
		expect(isPhone('1381234567a')).toBe(false)
	})
})

describe('isEmail', () => {
	it('常规邮箱通过', () => {
		expect(isEmail('user@example.com')).toBe(true)
		expect(isEmail('first.last@sub-domain.cn')).toBe(true)
	})

	it('缺少域名后缀或 @ 不通过', () => {
		expect(isEmail('user@example')).toBe(false)
		expect(isEmail('userexample.com')).toBe(false)
		expect(isEmail('@example.com')).toBe(false)
	})

	it('含空格或空串不通过', () => {
		expect(isEmail('us er@example.com')).toBe(false)
		expect(isEmail('user@ example.com')).toBe(false)
		expect(isEmail('')).toBe(false)
	})
})

describe('isIdCard', () => {
	it('校验位正确的 18 位身份证通过（末位 X/x 均可）', () => {
		expect(isIdCard('11010519491231002X')).toBe(true)
		expect(isIdCard('110101199003077512')).toBe(true)
		expect(isIdCard('11010519491231002x')).toBe(true)
	})

	it('校验位错误不通过', () => {
		expect(isIdCard('110105194912310021')).toBe(false)
		expect(isIdCard('110101199003077517')).toBe(false)
	})

	it('格式不符（长度 / 非法字符）不通过', () => {
		expect(isIdCard('1101051949123100')).toBe(false)
		expect(isIdCard('11010519491231ABCD')).toBe(false)
		expect(isIdCard('')).toBe(false)
	})
})

describe('isEmpty', () => {
	it('null / undefined / 空串 / 空数组 / 空对象为空', () => {
		expect(isEmpty(null)).toBe(true)
		expect(isEmpty(undefined)).toBe(true)
		expect(isEmpty('')).toBe(true)
		expect(isEmpty([])).toBe(true)
		expect(isEmpty({})).toBe(true)
	})

	it('非空值不为空', () => {
		expect(isEmpty(' ')).toBe(false)
		expect(isEmpty(0)).toBe(false)
		expect(isEmpty(false)).toBe(false)
		expect(isEmpty([1])).toBe(false)
		expect(isEmpty({ a: 1 })).toBe(false)
	})

	it('任意非空原始值与函数不为空', () => {
		expect(isEmpty(Number.NaN)).toBe(false)
		expect(isEmpty('0')).toBe(false)
		expect(isEmpty(() => undefined)).toBe(false)
	})
})
