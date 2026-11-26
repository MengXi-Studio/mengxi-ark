import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { UI_ADAPTER_KEY } from '@mengxi-ark/components'
import { makeStubAdapter } from '../../../__tests__/stub-adapter'
import { createComponentMap } from '../../../componentMap'
import type { FormSchema } from '../../../types/form'
import FormRenderer from '../FormRenderer.vue'

const stubAdapter = makeStubAdapter()

const mountForm = (schema: FormSchema, extraProps: Record<string, unknown> = {}) =>
	mount(FormRenderer, {
		props: { schema, ...extraProps },
		global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } }
	})

afterEach(() => {
	vi.restoreAllMocks()
})

describe('FormRenderer', () => {
	const baseSchema: FormSchema = {
		kind: 'form',
		fields: [
			{ type: 'input', field: 'name', label: '姓名', rules: [{ required: true }] },
			{ type: 'select', field: 'status', label: '状态', options: [{ label: '启用', value: '1' }] }
		]
	}

	it('按映射表渲染字段（label 展示 + 原子控件）', () => {
		const wrapper = mountForm(baseSchema)
		expect(wrapper.findAll('.mx-dsl-form__row')).toHaveLength(2)
		expect(wrapper.find('.stub-input').exists()).toBe(true)
		expect(wrapper.find('.stub-select').exists()).toBe(true)
		expect(wrapper.text()).toContain('姓名')
	})

	it('输入值 → update:modelValue 抛全量', async () => {
		const wrapper = mountForm(baseSchema)
		await wrapper.find('.stub-input').setValue('梦曦')
		const emitted = wrapper.emitted('update:modelValue')
		expect(emitted?.[0]?.[0]).toEqual({ name: '梦曦' })
	})

	it('required 校验未通过 → validateFailed + 错误文案，不 emit submit', async () => {
		const wrapper = mountForm(baseSchema)
		await wrapper.find('.stub-button--primary').trigger('click')
		expect(wrapper.emitted('validateFailed')).toBeTruthy()
		expect(wrapper.emitted('submit')).toBeUndefined()
		expect(wrapper.text()).toContain('该字段不能为空')
	})

	it('填写后提交 → submit 抛全量值', async () => {
		const wrapper = mountForm(baseSchema)
		await wrapper.find('.stub-input').setValue('梦曦')
		await wrapper.find('.stub-select').setValue('1')
		await wrapper.find('.stub-button--primary').trigger('click')
		const emitted = wrapper.emitted('submit')
		expect(emitted?.[0]?.[0]).toEqual({ name: '梦曦', status: '1' })
	})

	it('validator 自定义校验 → 失败提示自定义文案', async () => {
		const schema: FormSchema = {
			kind: 'form',
			fields: [
				{
					type: 'input',
					field: 'code',
					rules: [{ validator: (v: unknown) => (v === 'BAD' ? '编码不合法' : null) }]
				}
			]
		}
		const wrapper = mountForm(schema)
		await wrapper.find('.stub-input').setValue('BAD')
		await wrapper.find('.stub-button--primary').trigger('click')
		expect(wrapper.emitted('submit')).toBeUndefined()
		expect(wrapper.text()).toContain('编码不合法')
	})

	it('visible 函数式联动：父值变化实时显隐', async () => {
		const schema: FormSchema = {
			kind: 'form',
			fields: [
				{ type: 'input', field: 'province' },
				{ type: 'input', field: 'city', visible: (values: Record<string, unknown>) => Boolean(values.province) }
			]
		}
		const wrapper = mountForm(schema)
		expect(wrapper.findAll('.stub-input')).toHaveLength(1)
		await wrapper.find('.stub-input').setValue('浙江省')
		expect(wrapper.findAll('.stub-input')).toHaveLength(2)
	})

	it('defaultValue 初始值生效，外部 modelValue 同步', () => {
		const schema: FormSchema = {
			kind: 'form',
			fields: [{ type: 'input', field: 'name', defaultValue: '默认名' }]
		}
		const wrapper = mountForm(schema)
		expect((wrapper.find('.stub-input').element as HTMLInputElement).value).toBe('默认名')

		const withModel = mountForm(schema, { modelValue: { name: '外部值' } })
		expect((withModel.find('.stub-input').element as HTMLInputElement).value).toBe('外部值')
	})

	it('componentMap 覆盖：同 key 整体替换默认条目', () => {
		const wrapper = mountForm(baseSchema, {
			componentMap: createComponentMap({
				input: { component: { template: '<input class="custom-input" />' } }
			})
		})
		expect(wrapper.find('.custom-input').exists()).toBe(true)
		expect(wrapper.find('.stub-input').exists()).toBe(false)
	})

	it('未登记类型 → warn 一次并跳过渲染（不抛异常）', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const schema: FormSchema = {
			kind: 'form',
			fields: [{ type: 'unknown-type', field: 'mystery' }]
		}
		const wrapper = mountForm(schema)
		expect(wrapper.findAll('.mx-dsl-form__row')).toHaveLength(1)
		expect(wrapper.find('.stub-input').exists()).toBe(false)
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown-type'))
	})

	it('showSubmit: false → 不渲染内置提交按钮', () => {
		const wrapper = mountForm(baseSchema, { schema: { ...baseSchema, showSubmit: false } })
		expect(wrapper.find('.mx-dsl-form__actions').exists()).toBe(false)
	})

	it('defineExpose validate：供宿主主动校验', async () => {
		const wrapper = mountForm(baseSchema)
		const exposed = wrapper.vm as unknown as { validate: () => boolean }
		expect(exposed.validate()).toBe(false)
		await wrapper.find('.stub-input').setValue('梦曦')
		expect(exposed.validate()).toBe(true)
	})
})
