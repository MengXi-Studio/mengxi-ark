import { describe, expect, it, vi } from 'vitest'
import { useTable } from '../index'

/** 等待一个宏任务，确保查询 promise 链完整跑完 */
function flush(): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, 0))
}

describe('useTable', () => {
	it('默认 immediate 立即查询并回填 dataSource / total / loading', async () => {
		const source = vi.fn(async () => ({ list: [{ id: 1 }], total: 42 }))
		const { dataSource, pagination, loading } = useTable(source)
		expect(source).toHaveBeenCalledTimes(1)
		expect(source).toHaveBeenLastCalledWith(
			expect.objectContaining({
				currentPage: 1,
				pageSize: 10,
				sortField: '',
				sortOrder: '',
				filters: {}
			})
		)
		expect(loading.value).toBe(true)
		await flush()
		expect(dataSource.value).toEqual([{ id: 1 }])
		expect(pagination.total).toBe(42)
		expect(loading.value).toBe(false)
	})

	it('search 合并参数并回到第 1 页', async () => {
		const source = vi.fn(async () => ({ list: [], total: 0 }))
		const { search, pagination } = useTable(source, { immediate: false, pageSize: 20 })
		pagination.onChange(3, 20)
		await flush()
		await search({ keyword: 'x' })
		expect(source).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: 'x', currentPage: 1, pageSize: 20 }))
		expect(pagination.current).toBe(1)
	})

	it('pagination.onChange 按新分页查询', async () => {
		const source = vi.fn(async () => ({ list: [], total: 0 }))
		const { pagination } = useTable(source, { immediate: false })
		pagination.onChange(2, 20)
		await flush()
		expect(source).toHaveBeenLastCalledWith(expect.objectContaining({ currentPage: 2, pageSize: 20 }))
		expect(pagination.current).toBe(2)
		expect(pagination.size).toBe(20)
	})

	it('sort 与 filters 修改后 run 合并进查询参数', async () => {
		const source = vi.fn(async () => ({ list: [], total: 0 }))
		const { sort, filters, run } = useTable(source, { immediate: false })
		sort.field = 'name'
		sort.order = 'asc'
		filters.status = 1
		await run()
		expect(source).toHaveBeenLastCalledWith(
			expect.objectContaining({
				sortField: 'name',
				sortOrder: 'asc',
				filters: { status: 1 }
			})
		)
	})

	it('run 增量合并额外查询条件', async () => {
		const source = vi.fn(async () => ({ list: [], total: 0 }))
		const { run, search } = useTable<Record<string, unknown>, Record<string, unknown>>(source, {
			immediate: false,
			defaultParams: { dept: 'A' }
		})
		await run({ keyword: 'k1' })
		expect(source).toHaveBeenLastCalledWith(expect.objectContaining({ dept: 'A', keyword: 'k1' }))
		await search({ keyword: 'k2' })
		expect(source).toHaveBeenLastCalledWith(expect.objectContaining({ dept: 'A', keyword: 'k2' }))
	})

	it('reset 恢复默认条件、清空排序筛选、回到第 1 页', async () => {
		const source = vi.fn(async () => ({ list: [{ id: 2 }], total: 1 }))
		const { sort, filters, pagination, search, reset, dataSource } = useTable(source, {
			immediate: false,
			defaultParams: { dept: 'A' },
			pageSize: 5
		})
		await search({ dept: 'B' })
		sort.field = 'name'
		sort.order = 'desc'
		filters.status = 1
		pagination.onChange(2, 20)
		await flush()

		await reset()
		expect(source).toHaveBeenLastCalledWith(
			expect.objectContaining({
				dept: 'A',
				currentPage: 1,
				// reset 恢复查询条件与页码，保留用户选择过的每页条数
				pageSize: 20,
				sortField: '',
				sortOrder: '',
				filters: {}
			})
		)
		expect(sort.field).toBe('')
		expect(sort.order).toBe('')
		expect(filters).toEqual({})
		expect(pagination.current).toBe(1)
		expect(dataSource.value).toEqual([{ id: 2 }])
	})

	it('查询失败写入 error 且 loading 复位', async () => {
		const source = vi.fn(async () => {
			throw new Error('boom')
		})
		const { run, error, loading } = useTable(source, { immediate: false })
		await run()
		expect(error.value).toBeInstanceOf(Error)
		expect(loading.value).toBe(false)
	})
})
