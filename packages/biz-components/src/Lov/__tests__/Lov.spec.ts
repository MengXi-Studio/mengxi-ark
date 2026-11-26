import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { UI_ADAPTER_KEY } from '@mengxi-ark/components'
import { makeStubAdapter } from '../../__tests__/stub-adapter'
import { MX_RUNTIME_CONTEXT_KEY } from '../../context/resolve'
import type { MxRuntimeContext } from '../../context/types'
import { resolveLovSource } from '../adapter'
import Lov from '../Lov.vue'
import type { LovOption, LovProps } from '../types'

const stubAdapter = makeStubAdapter()

const mountLov = (props: LovProps, context?: MxRuntimeContext) => {
	// Lov 为 props 驱动契约（v-model）：拦截 update:modelValue 并回写 props，模拟宿主绑定
	const wrapper = mount(Lov, {
		props: {
			...props,
			'onUpdate:modelValue': (v: LovProps['modelValue']) => {
				void wrapper.setProps({ modelValue: v })
			}
		},
		global: {
			provide: {
				[UI_ADAPTER_KEY as symbol]: stubAdapter,
				...(context ? { [MX_RUNTIME_CONTEXT_KEY as symbol]: context } : {})
			}
		}
	})
	return wrapper
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('resolveLovSource 数据源解析', () => {
	const SEX: LovOption[] = [
		{ label: '男', value: 'M' },
		{ label: '女', value: 'F' }
	]
	const api = () => Promise.resolve([])

	it('基座上下文 lovCache 命中 → 静态模式 + fromContext', () => {
		const result = resolveLovSource({ lovCache: { SEX } }, { lovCode: 'SEX' })
		expect(result.mode).toBe('static')
		expect(result.fromContext).toBe(true)
		expect(result.staticOptions).toBe(SEX)
	})

	it('上下文缺失 → 回退 props.lovCache（同名兜底）', () => {
		const result = resolveLovSource(null, { lovCode: 'SEX', lovCache: { SEX } })
		expect(result.mode).toBe('static')
		expect(result.fromContext).toBe(false)
		expect(result.staticOptions).toBe(SEX)
	})

	it('lovCache 未命中该编码 → 回退 props.lovOptions', () => {
		const result = resolveLovSource(null, { lovCode: 'SEX', lovOptions: SEX })
		expect(result.mode).toBe('static')
		expect(result.staticOptions).toBe(SEX)
	})

	it('远程接口：上下文 lovListApi 优先于 props.lovApi', () => {
		const propsApi = () => Promise.resolve([])
		const result = resolveLovSource({ lovListApi: api }, { lovApi: propsApi })
		expect(result.mode).toBe('remote')
		expect(result.fromContext).toBe(true)
		expect(result.api).toBe(api)
	})

	it('远程接口：上下文缺失 → props.lovApi 兜底（独立模式）', () => {
		const result = resolveLovSource(null, { lovApi: api })
		expect(result.mode).toBe('remote')
		expect(result.fromContext).toBe(false)
		expect(result.api).toBe(api)
	})

	it('全部缺失 → 独立空态（不抛异常）', () => {
		const result = resolveLovSource(null, {})
		expect(result.mode).toBe('static')
		expect(result.fromContext).toBe(false)
		expect(result.staticOptions).toEqual([])
		expect(result.api).toBeUndefined()
	})
})

describe('Lov 静态值集模式', () => {
	const OPTIONS: LovOption[] = [
		{ label: '启用', value: '1' },
		{ label: '停用', value: '0' }
	]

	it('lovOptions 命中：渲染下拉并抛出 update:modelValue / change', async () => {
		const wrapper = mountLov({ lovOptions: OPTIONS })
		const select = wrapper.find('.stub-select')
		expect(select.exists()).toBe(true)
		await select.setValue('1')
		expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1'])
		const change = wrapper.emitted('change')![0]
		expect(change[0]).toBe('1')
		expect(change[1]).toEqual([{ label: '启用', value: '1' }])
	})

	it('基座联动：provide 值集缓存后复用上下文（无需 props 数据源）', async () => {
		const wrapper = mountLov({ lovCode: 'STATUS' }, { lovCache: { STATUS: OPTIONS } })
		const select = wrapper.find('.stub-select')
		expect(select.exists()).toBe(true)
		await select.setValue('0')
		expect(wrapper.emitted('update:modelValue')![0]).toEqual(['0'])
		expect((wrapper.emitted('change')![0][1] as LovOption[])[0].label).toBe('停用')
	})

	it('全部缺失：降级空选项独立运行，仅 warn 不抛异常', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
		expect(() => mountLov({})).not.toThrow()
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('独立模式降级'))
	})
})

describe('Lov 远程接口模式（独立模式自请求）', () => {
	it('lovApi 拉取后触发器回显、弹窗选择并抛出选中值', async () => {
		const api = vi.fn().mockResolvedValue([
			{ code: 'U1', name: '张三' },
			{ code: 'U2', name: '李四' }
		])
		const wrapper = mountLov({
			lovApi: api,
			fieldNames: { label: 'name', value: 'code' }
		})
		// 挂载后自请求预热回显数据
		await vi.waitFor(() => expect(api).toHaveBeenCalled())
		// 触发器初始为占位文案
		expect(wrapper.find('.mx-lov__text').text()).toBe('请选择')
		// 打开弹窗
		await wrapper.find('.mx-lov__trigger').trigger('click')
		const modal = wrapper.find('.stub-modal')
		expect(modal.exists()).toBe(true)
		expect(wrapper.find('.stub-datatable').exists()).toBe(true)
		// 单击选中第一行（rowClick 模拟）并确认
		const table = wrapper.findComponent({ name: 'StubDataTable' })
		table.vm.$emit('rowClick', { code: 'U2', name: '李四' }, 1)
		await wrapper.find('.stub-modal__ok').trigger('click')
		expect(wrapper.emitted('update:modelValue')![0]).toEqual(['U2'])
		const change = wrapper.emitted('change')![0]
		expect(change[0]).toBe('U2')
		expect(change[1]).toEqual([{ label: '李四', value: 'U2' }])
		// 确认后弹窗关闭，触发器回显 label
		expect(wrapper.find('.stub-modal').exists()).toBe(false)
		await vi.waitFor(() => expect(wrapper.find('.mx-lov__text').text()).toBe('李四'))
	})

	it('lovApi 分页结构 {list,total}：请求参数带 keyword / currentPage / pageSize 交互约定', async () => {
		const api = vi.fn().mockResolvedValue({ list: [], total: 0 })
		mountLov({ lovApi: api, params: { orgId: 7 } })
		await vi.waitFor(() => expect(api).toHaveBeenCalled())
		expect(api).toHaveBeenCalledWith(expect.objectContaining({ orgId: 7, keyword: '', currentPage: 1, pageSize: 10 }))
	})
})

describe('Lov 双模式降级切换', () => {
	it('上下文命中远程接口 → 移除 provide 后回退 props.lovApi 独立模式，不抛异常', async () => {
		const contextApi = vi.fn().mockResolvedValue([])
		const propsApi = vi.fn().mockResolvedValue([])

		const withContext = mountLov({ lovApi: propsApi }, { lovListApi: contextApi })
		await vi.waitFor(() => expect(contextApi).toHaveBeenCalled())
		expect(propsApi).not.toHaveBeenCalled()
		withContext.unmount()

		const withoutContext = mountLov({ lovApi: propsApi })
		await vi.waitFor(() => expect(propsApi).toHaveBeenCalled())
		expect(withoutContext.find('.mx-lov').exists()).toBe(true)
		withoutContext.unmount()
	})
})

describe('Lov 弹窗自定义（columns / bodyCell）', () => {
	const openDialog = async (wrapper: ReturnType<typeof mountLov>): Promise<void> => {
		await wrapper.find('.mx-lov__trigger').trigger('click')
		await vi.waitFor(() => expect(wrapper.find('.stub-datatable').exists()).toBe(true))
	}

	it('未传 columns：默认「名称 / 编码」两列（fieldNames 映射）', async () => {
		const api = vi.fn().mockResolvedValue([{ code: 'U1', name: '张三' }])
		const wrapper = mountLov({ lovApi: api, fieldNames: { label: 'name', value: 'code' } })
		await vi.waitFor(() => expect(api).toHaveBeenCalled())
		await openDialog(wrapper)
		expect(wrapper.find('.stub-datatable__cell--name').exists()).toBe(true)
		expect(wrapper.find('.stub-datatable__cell--code').exists()).toBe(true)
	})

	it('columns prop 覆盖默认弹窗列', async () => {
		const api = vi.fn().mockResolvedValue([{ code: 'U1', name: '张三', dept: '研发部' }])
		const wrapper = mountLov({
			lovApi: api,
			fieldNames: { label: 'name', value: 'code' },
			columns: [
				{ dataIndex: 'name', title: '姓名' },
				{ dataIndex: 'dept', title: '部门' }
			]
		})
		await vi.waitFor(() => expect(api).toHaveBeenCalled())
		await openDialog(wrapper)
		expect(wrapper.find('.stub-datatable__cell--name').exists()).toBe(true)
		expect(wrapper.find('.stub-datatable__cell--dept').exists()).toBe(true)
		expect(wrapper.find('.stub-datatable__cell--code').exists()).toBe(false)
	})

	it('bodyCell 槽透传到弹窗表格（作用域含 record）', async () => {
		const api = vi.fn().mockResolvedValue([{ code: 'U1', name: '张三' }])
		const withSlot = mount(Lov, {
			props: {
				lovApi: api,
				fieldNames: { label: 'name', value: 'code' } as LovProps['fieldNames']
			},
			slots: {
				bodyCell: `<template #bodyCell="{ record }"><span class="lov-cell-custom">{{ record.name }}</span></template>`
			},
			global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } }
		})
		await vi.waitFor(() => expect(api).toHaveBeenCalled())
		await withSlot.find('.mx-lov__trigger').trigger('click')
		await vi.waitFor(() => expect(withSlot.find('.stub-datatable').exists()).toBe(true))
		const custom = withSlot.find('.lov-cell-custom')
		expect(custom.exists()).toBe(true)
		expect(custom.text()).toBe('张三')
	})
})

describe('Lov 级联（cascadeSource）', () => {
	const OPTIONS: LovOption[] = [
		{ label: '启用', value: '1' },
		{ label: '停用', value: '0' }
	]

	it('静态模式：父值为空时子下拉禁用；父值有值时恢复可用', async () => {
		const wrapper = mountLov({ lovOptions: OPTIONS, cascadeSource: null })
		expect((wrapper.find('.stub-select').element as HTMLSelectElement).disabled).toBe(true)
		await wrapper.setProps({ cascadeSource: 'P1' })
		expect((wrapper.find('.stub-select').element as HTMLSelectElement).disabled).toBe(false)
	})

	it('静态模式：父值任何变化清空自身选中值，change 同步抛空选项', async () => {
		const wrapper = mountLov({ lovOptions: OPTIONS, modelValue: '1', cascadeSource: 'P1' })
		await wrapper.setProps({ cascadeSource: 'P2' })
		expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([null])
		const change = wrapper.emitted('change')!.at(-1)!
		expect(change[0]).toBeNull()
		expect(change[1]).toEqual([])
	})

	it('父值变化但自身无选中值时不产生多余 emit', async () => {
		const wrapper = mountLov({ lovOptions: OPTIONS, cascadeSource: 'P1' })
		await wrapper.setProps({ cascadeSource: 'P2' })
		expect(wrapper.emitted('update:modelValue')).toBeUndefined()
	})

	it('远程模式：父值为空时点击触发器不打开弹窗（禁用）', async () => {
		const api = vi.fn().mockResolvedValue([])
		const wrapper = mountLov({ lovApi: api, cascadeSource: null })
		await wrapper.find('.mx-lov__trigger').trigger('click')
		expect(wrapper.find('.stub-modal').exists()).toBe(false)
	})

	it('级联不影响独立模式基础能力：父值有值时仍可正常选择', async () => {
		const wrapper = mountLov({ lovOptions: OPTIONS, cascadeSource: 'P1' })
		await wrapper.find('.stub-select').setValue('0')
		expect(wrapper.emitted('update:modelValue')![0]).toEqual(['0'])
	})
})
