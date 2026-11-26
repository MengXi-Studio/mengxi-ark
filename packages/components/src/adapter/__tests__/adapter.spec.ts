import { describe, expect, it } from 'vitest'
import { mapAntdvSize, mapAntdvTreeData } from '../antdv'
import { mapEpButtonType, mapEpSize, mapEpTreeData, mapEpUploadFiles, normalizeEpUploadItems } from '../element-plus'
import { UI_ADAPTER_KEY } from '../types'

describe('antdv 适配器映射', () => {
	it('mapAntdvSize：sm/md/lg → small/middle/large，未传返回 undefined', () => {
		expect(mapAntdvSize('sm')).toBe('small')
		expect(mapAntdvSize('md')).toBe('middle')
		expect(mapAntdvSize('lg')).toBe('large')
		expect(mapAntdvSize(undefined)).toBeUndefined()
	})

	it('mapAntdvTreeData：统一节点 {key,title} → antdv {value,title}', () => {
		const nodes = [
			{ key: 'a', title: '节点A', children: [{ key: 'a1', title: '子节点' }] },
			{ key: 'b', title: '节点B', disabled: true }
		]
		const mapped = mapAntdvTreeData(nodes)
		expect(mapped[0]).toMatchObject({ value: 'a', title: '节点A' })
		expect((mapped[0].children as Array<Record<string, unknown>>)[0]).toMatchObject({ value: 'a1', title: '子节点' })
		expect(mapped[1]).toMatchObject({ value: 'b', disabled: true })
	})
})

describe('element-plus 适配器映射', () => {
	it('mapEpSize：sm/md/lg → small/default/large', () => {
		expect(mapEpSize('sm')).toBe('small')
		expect(mapEpSize('md')).toBe('default')
		expect(mapEpSize('lg')).toBe('large')
		expect(mapEpSize(undefined)).toBeUndefined()
	})

	it('mapEpButtonType：default/dashed 无 EP 对应 type，其余透传', () => {
		expect(mapEpButtonType('primary')).toBe('primary')
		expect(mapEpButtonType('default')).toBeUndefined()
		expect(mapEpButtonType('dashed')).toBeUndefined()
		expect(mapEpButtonType('text')).toBe('text')
		expect(mapEpButtonType('link')).toBe('link')
	})

	it('mapEpTreeData：统一节点 {key,title} → EP {value,label}', () => {
		const nodes = [{ key: 'x', title: '标签X', children: [{ key: 'x1', title: '子标签' }] }]
		const mapped = mapEpTreeData(nodes)
		expect(mapped[0]).toMatchObject({ value: 'x', label: '标签X' })
		expect((mapped[0].children as Array<Record<string, unknown>>)[0]).toMatchObject({ value: 'x1', label: '子标签' })
	})

	it('mapEpUploadFiles：统一契约 → EP file-list（uid 缺省按索引补数字、status 转回 EP 语义）', () => {
		const files = mapEpUploadFiles([
			{ name: 'a.txt', status: 'done' },
			{ uid: 'x', name: 'b.txt', status: 'error' },
			{ uid: 3, name: 'c.txt' }
		])
		expect(files[0]).toMatchObject({ uid: 0, name: 'a.txt', status: 'success' })
		expect(files[1]).toMatchObject({ status: 'fail' })
		expect(files[2]).toMatchObject({ uid: 3, status: 'ready' })
		expect(mapEpUploadFiles(undefined)).toEqual([])
	})

	it('normalizeEpUploadItems：EP status 语义 → 统一契约（success→done / fail→error）', () => {
		const items = normalizeEpUploadItems([{ uid: 1, name: 'a.txt', status: 'success' }, { uid: 2, name: 'b.txt', status: 'fail' }, { uid: 3, name: 'c.txt', status: 'uploading' }, { name: 'd.txt' }])
		expect(items[0]).toMatchObject({ uid: 1, name: 'a.txt', status: 'done' })
		expect(items[1]).toMatchObject({ uid: 2, status: 'error' })
		expect(items[2]).toMatchObject({ uid: 3, status: 'uploading' })
		expect(items[3]).toMatchObject({ uid: 3, name: 'd.txt', status: undefined })
		expect(normalizeEpUploadItems(undefined)).toEqual([])
	})
})

describe('UI_ADAPTER_KEY', () => {
	it('注入键存在且为 Symbol', () => {
		expect(typeof UI_ADAPTER_KEY).toBe('symbol')
		expect((UI_ADAPTER_KEY as symbol).description).toBe('UI_ADAPTER_KEY')
	})
})
