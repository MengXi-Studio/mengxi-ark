import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { makeStubAdapter } from '../adapter/__tests__/stub-adapter'
import { UI_ADAPTER_KEY } from '../adapter/types'
import EmptyState from '../EmptyState'
import EnhanceTable from '../EnhanceTable'
import MxDialog from '../MxDialog'
import MxDrawer from '../MxDrawer'
import MxTreeSelect from '../MxTreeSelect'
import MxUpload from '../MxUpload'
import ResultPage from '../ResultPage'
import SearchForm from '../SearchForm'
import StatusTag from '../StatusTag'

const globalWithStubAdapter = {
	provide: { [UI_ADAPTER_KEY as symbol]: makeStubAdapter() }
}

describe('EmptyState', () => {
	it('默认渲染「暂无数据」描述', () => {
		const wrapper = mount(EmptyState)
		expect(wrapper.text()).toContain('暂无数据')
	})

	it('自定义描述与 action 插槽', () => {
		const wrapper = mount(EmptyState, {
			props: { description: '没有匹配的记录' },
			slots: { action: '<button class="stub-action">新建</button>' }
		})
		expect(wrapper.text()).toContain('没有匹配的记录')
		expect(wrapper.find('.stub-action').exists()).toBe(true)
	})
})

describe('StatusTag', () => {
	const mapping = {
		'1': { label: '启用', tone: 'success' as const },
		'0': { label: '停用', tone: 'error' as const }
	}

	it('命中映射：渲染 label 与色调类', () => {
		const wrapper = mount(StatusTag, { props: { value: '1', mapping } })
		expect(wrapper.text()).toBe('启用')
		expect(wrapper.find('.mx-status-tag__dot--success').exists()).toBe(true)
	})

	it('未命中映射：降级展示原始值与 default 色调', () => {
		const wrapper = mount(StatusTag, { props: { value: '99', mapping } })
		expect(wrapper.text()).toBe('99')
		expect(wrapper.find('.mx-status-tag__dot--default').exists()).toBe(true)
	})
})

describe('ResultPage', () => {
	it('默认 success 状态与标题', () => {
		const wrapper = mount(ResultPage, { props: { title: '操作成功', subTitle: '数据已保存' } })
		expect(wrapper.text()).toContain('操作成功')
		expect(wrapper.text()).toContain('数据已保存')
		expect(wrapper.find('.mx-result--success').exists()).toBe(true)
	})

	it('error 状态渲染对应色调', () => {
		const wrapper = mount(ResultPage, { props: { status: 'error', title: '操作失败' } })
		expect(wrapper.find('.mx-result--error').exists()).toBe(true)
	})
})

describe('SearchForm', () => {
	const fields = [
		{ name: 'keyword', label: '名称', type: 'input' as const },
		{ name: 'status', label: '状态', type: 'select' as const, options: [{ label: '启用', value: '1' }] },
		{ name: 'created', label: '创建日期', type: 'dateRange' as const }
	]

	function mountForm(extraProps: Record<string, unknown> = {}) {
		return mount(SearchForm, {
			props: { fields, ...extraProps },
			global: globalWithStubAdapter
		})
	}

	it('渲染全部字段并随输入更新 search 值', async () => {
		const wrapper = mountForm()
		expect(wrapper.findAll('.stub-input').length).toBe(1)
		await wrapper.find('.stub-input').setValue('用户')
		await wrapper.findAll('.stub-button').at(0)!.trigger('click')
		const emitted = wrapper.emitted('search')
		expect(emitted).toBeTruthy()
		expect((emitted![0][0] as Record<string, unknown>).keyword).toBe('用户')
	})

	it('字段数超过 defaultCollapsedCount 时默认折叠并可展开', async () => {
		const wrapper = mountForm({ defaultCollapsedCount: 2 })
		// 折叠时第三个字段（dateRange）不渲染
		expect(wrapper.find('.stub-range-picker').exists()).toBe(false)
		const toggle = wrapper.findAll('.stub-button').at(-1)!
		expect(toggle.text()).toContain('展开')
		await toggle.trigger('click')
		expect(wrapper.find('.stub-range-picker').exists()).toBe(true)
	})

	it('reset 恢复 initialValue 并触发 reset 事件', async () => {
		const wrapper = mountForm({
			fields: [{ name: 'keyword', label: '名称', type: 'input' as const, initialValue: '默认值' }],
			collapsible: false
		})
		await wrapper.find('.stub-input').setValue('改过的值')
		await wrapper.findAll('.stub-button').at(1)!.trigger('click')
		expect((wrapper.find('.stub-input').element as HTMLInputElement).value).toBe('默认值')
		expect(wrapper.emitted('reset')).toBeTruthy()
	})
})

describe('EnhanceTable', () => {
	it('空数据渲染统一空状态（EmptyState 兜底）', () => {
		const wrapper = mount(EnhanceTable, {
			props: { columns: [{ dataIndex: 'name', title: '名称' }] },
			global: globalWithStubAdapter
		})
		expect(wrapper.find('.stub-datatable').exists()).toBe(true)
		expect(wrapper.text()).toContain('暂无数据')
	})

	it('透传分页 / 行选择状态并转发事件', async () => {
		const wrapper = mount(EnhanceTable, {
			props: {
				columns: [{ dataIndex: 'name', title: '名称' }],
				dataSource: [{ id: 1, name: '张三' }],
				pagination: { current: 1, size: 10, total: 100 },
				rowSelection: {
					selectedRowKeys: [],
					onChange: (keys: Array<string | number>) => keys
				},
				emptyText: '无记录'
			},
			global: globalWithStubAdapter
		})
		const table = wrapper.findComponent({ name: 'StubDataTable' })
		table.vm.$emit('pageChange', 2, 20)
		table.vm.$emit('sortChange', 'name', 'desc')
		table.vm.$emit('rowClick', { id: 1 }, 0)
		expect(wrapper.emitted('pageChange')![0]).toEqual([2, 20])
		expect(wrapper.emitted('sortChange')![0]).toEqual(['name', 'desc'])
		expect(wrapper.emitted('rowClick')![0]).toEqual([{ id: 1 }, 0])
	})

	it('bodyCell 插槽透传到适配器表格', () => {
		const wrapper = mount(EnhanceTable, {
			props: { columns: [{ dataIndex: 'name', title: '名称' }], dataSource: [{ id: 1, name: '张三' }] },
			slots: { bodyCell: '<span class="stub-cell">自定义单元格</span>' },
			global: globalWithStubAdapter
		})
		expect(wrapper.find('.stub-cell').exists()).toBe(true)
	})

	it('expandedRowKeys 受控行展开：expandedRow 槽透传并回抛展开变化', async () => {
		const wrapper = mount(EnhanceTable, {
			props: {
				columns: [{ dataIndex: 'name', title: '名称' }],
				dataSource: [{ id: 1, name: '张三' }],
				expandedRowKeys: [1]
			},
			slots: { expandedRow: '<div class="stub-datatable__expanded-content">子表内容</div>' },
			global: globalWithStubAdapter
		})
		// 展开内容按行索引渲染标记节点
		const expanded = wrapper.find('.stub-datatable__expanded--0')
		expect(expanded.exists()).toBe(true)
		expect(expanded.text()).toContain('子表内容')
		// 展开态变化经适配器表格回抛 update:expandedRowKeys
		const table = wrapper.findComponent({ name: 'StubDataTable' })
		table.vm.$emit('update:expandedRowKeys', [])
		expect(wrapper.emitted('update:expandedRowKeys')![0]).toEqual([[]])
	})

	it('expandedRowKeys 未传（undefined）时不渲染展开内容', () => {
		const wrapper = mount(EnhanceTable, {
			props: { columns: [{ dataIndex: 'name', title: '名称' }], dataSource: [{ id: 1, name: '张三' }] },
			slots: { expandedRow: '<div class="stub-datatable__expanded-content">子表内容</div>' },
			global: globalWithStubAdapter
		})
		expect(wrapper.find('.stub-datatable__expanded').exists()).toBe(false)
	})
})

describe('MxDialog / MxDrawer / MxUpload / MxTreeSelect 壳组件', () => {
	it('MxDialog：open 控制显隐并透传标题与 footer 插槽', async () => {
		const wrapper = mount(MxDialog, {
			props: { open: false, title: '确认删除' },
			slots: { default: '<p class="stub-dialog-body">内容</p>', footer: '<button class="stub-footer">确定</button>' },
			global: globalWithStubAdapter
		})
		expect(wrapper.find('.stub-modal').exists()).toBe(false)
		await wrapper.setProps({ open: true })
		expect(wrapper.find('.stub-modal__title').text()).toBe('确认删除')
		expect(wrapper.find('.stub-dialog-body').exists()).toBe(true)
		expect(wrapper.find('.stub-footer').exists()).toBe(true)
	})

	it('MxDrawer：open 控制显隐', async () => {
		const wrapper = mount(MxDrawer, {
			props: { open: true, title: '详情' },
			global: globalWithStubAdapter
		})
		expect(wrapper.find('.stub-drawer__title').text()).toBe('详情')
		await wrapper.setProps({ open: false })
		expect(wrapper.find('.stub-drawer').exists()).toBe(false)
	})

	it('MxUpload：默认触发器与 fileList 透传', () => {
		const wrapper = mount(MxUpload, {
			props: { action: '/api/upload', fileList: [{ name: 'a.txt', status: 'done' }] },
			global: globalWithStubAdapter
		})
		expect(wrapper.find('.stub-upload__count').text()).toBe('1')
		expect(wrapper.text()).toContain('上传文件')
	})

	it('MxTreeSelect：渲染 stub 且透传树数据', () => {
		const wrapper = mount(MxTreeSelect, {
			props: { treeData: [{ key: '1', title: '根节点' }], modelValue: '1' },
			global: globalWithStubAdapter
		})
		expect(wrapper.find('.stub-tree-select').exists()).toBe(true)
	})
})
