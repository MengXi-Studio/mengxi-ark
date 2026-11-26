import { describe, expect, it } from 'vitest'
import { buildDefaultComponentMap, createComponentMap } from '../index'
import { makeStubAdapter } from '../../__tests__/stub-adapter'

const stubAdapter = makeStubAdapter()

describe('componentMap', () => {
	it('buildDefaultComponentMap：覆盖 13 项默认条目（原子 + 跨组件实体）', () => {
		const map = buildDefaultComponentMap(stubAdapter)
		expect(Object.keys(map).sort()).toEqual(['button', 'dateRange', 'dialog', 'documentTable', 'emptyState', 'enhanceTable', 'input', 'lov', 'searchForm', 'select', 'statusTag', 'treeSelect', 'upload'].sort())
		// 原子能力取自适配器
		expect(map.input.component).toBe(stubAdapter.Input)
		expect(map.select.component).toBe(stubAdapter.Select)
	})

	it('createComponentMap：overrides 同 key 整体替换，其余保留', () => {
		const custom = { template: '<div />' }
		const map = createComponentMap({ input: { component: custom } }, stubAdapter)
		expect(map.input.component).toBe(custom)
		expect(map.select.component).toBe(stubAdapter.Select)
		expect(map.lov.component).toBeDefined()
		expect(map.lov.component).not.toBe(custom)
	})

	it('createComponentMap：缺省适配器回退默认（antdv）', () => {
		const map = createComponentMap(undefined, stubAdapter)
		expect(map.input.component).toBe(stubAdapter.Input)
	})
})
