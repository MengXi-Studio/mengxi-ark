import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { MX_I18N_KEY, createI18n, useI18n } from '../index'

describe('createI18n', () => {
	it('t 支持点路径与 {name} 插值（含数字参数）', () => {
		const i18n = createI18n({
			messages: {
				'zh-CN': { hello: '你好，{name}', count: '共 {n} 条', nav: { home: '首页' } },
				'en-US': { hello: 'Hello, {name}' }
			}
		})
		expect(i18n.locale.value).toBe('zh-CN')
		expect(i18n.t('hello', { name: '世界' })).toBe('你好，世界')
		expect(i18n.t('count', { n: 5 })).toBe('共 5 条')
		expect(i18n.t('nav.home')).toBe('首页')
	})

	it('setLocale 切换语言后 t 即时更新', () => {
		const i18n = createI18n({
			messages: { 'zh-CN': { hi: '你好' }, 'en-US': { hi: 'Hi' } }
		})
		i18n.setLocale('en-US')
		expect(i18n.locale.value).toBe('en-US')
		expect(i18n.t('hi')).toBe('Hi')
	})

	it('fallbackLocale：当前语言缺词条时回退查找', () => {
		const i18n = createI18n({
			locale: 'en-US',
			fallbackLocale: 'zh-CN',
			messages: { 'zh-CN': { only: '仅有中文' } }
		})
		expect(i18n.t('only')).toBe('仅有中文')
	})

	it('缺失词条返回 key 本身且每个 key 仅警告一次', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const i18n = createI18n({ messages: {} })
		expect(i18n.t('missing.key')).toBe('missing.key')
		expect(i18n.t('missing.key')).toBe('missing.key')
		expect(warnSpy).toHaveBeenCalledTimes(1)
		warnSpy.mockRestore()
	})
})

describe('useI18n', () => {
	it('inject 探测：app.provide 的实例被使用', () => {
		const instance = createI18n({ messages: { 'zh-CN': { hi: '你好' } } })
		const Comp = defineComponent({
			setup() {
				const { t } = useI18n()
				return () => h('div', t('hi'))
			}
		})
		const wrapper = mount(Comp, {
			global: { provide: { [MX_I18N_KEY]: instance } }
		})
		expect(wrapper.text()).toBe('你好')
	})

	it('显式传入实例时优先使用', () => {
		const instance = createI18n({ messages: { 'zh-CN': { hi: '你好' } } })
		expect(useI18n(instance).t('hi')).toBe('你好')
	})

	it('未提供实例时降级为模块级默认实例（t 返回 key，不报错）', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const fallback = useI18n()
		expect(fallback.locale.value).toBe('zh-CN')
		expect(fallback.t('anything')).toBe('anything')
		expect(warnSpy).toHaveBeenCalledTimes(1)
		warnSpy.mockRestore()
	})
})
