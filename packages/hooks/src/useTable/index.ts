/**
 * useTable —— 表格查询 hook：查询、分页、排序、筛选状态管理（独立模式运行，不依赖任何基座）。
 *
 * 查询参数合并 = 额外查询条件（defaultParams / run / search 参数）+ 分页（currentPage / pageSize）
 * + 排序（sortField / sortOrder）+ 筛选（filters）。数据由业务注入的 source 异步获取，
 * 本 hook 不绑定任何后端字段与 UI 库。
 */
import { getCurrentInstance, onUnmounted, reactive, ref, shallowRef } from 'vue'
import type { Ref } from 'vue'

/** 默认页码：1 */
const DEFAULT_CURRENT_PAGE = 1
/** 默认每页条数：10 */
const DEFAULT_PAGE_SIZE = 10
/** 默认立即发起首次查询（immediate: true） */
const DEFAULT_IMMEDIATE = true

/**
 * source 返回结构。
 */
export interface TableSourceResult<T> {
	/** 当页数据 */
	list: T[]
	/** 总条数 */
	total: number
}

/**
 * 排序状态（reactive；修改后调用 run() 生效）。
 */
export interface TableSortState {
	/** 排序字段，空串表示未排序 */
	field: string
	/** 排序方向（asc / desc 等，由业务约定），空串表示未排序 */
	order: string
}

/**
 * 分页状态（reactive）与页码变更回调。
 */
export interface TablePaginationState {
	/** 当前页码（从 1 开始） */
	current: number
	/** 每页条数 */
	size: number
	/** 总条数（由 source 返回回填） */
	total: number
	/** 页码 / 每页条数变更（antdv onChange 语义），触发按新分页重新查询 */
	onChange: (current: number, pageSize: number) => void
}

/** source 接收的合并后查询参数：额外查询条件 + 分页 + 排序 + 筛选 */
export type TableQueryParams<P> = P & {
	currentPage: number
	pageSize: number
	sortField: string
	sortOrder: string
	filters: Record<string, unknown>
}

/**
 * useTable 配置项（全部可选）。
 */
export interface UseTableOptions<P extends Record<string, unknown>> {
	/** 默认查询条件（reset() 恢复的基准），默认 {} */
	defaultParams?: P
	/** 初始每页条数，默认 10 */
	pageSize?: number
	/** 是否立即发起首次查询，默认 true */
	immediate?: boolean
}

/**
 * useTable 返回值（响应式状态 + 副作用方法并列）。
 */
export interface UseTableResult<T, P extends Record<string, unknown>> {
	/** 当页数据 */
	dataSource: Ref<T[]>
	/** 是否查询中 */
	loading: Ref<boolean>
	/** 最近一次查询失败的错误（成功或重新发起查询时复位为 undefined） */
	error: Ref<unknown>
	/** 分页状态（reactive，含 onChange） */
	pagination: TablePaginationState
	/** 排序状态（reactive，修改后调用 run() 生效） */
	sort: TableSortState
	/** 筛选状态（reactive，修改后调用 run() 生效） */
	filters: Record<string, unknown>
	/**
	 * 合并参数并按当前页码发起查询；params 增量合并进额外查询条件。
	 * @param params - 额外查询条件（增量合并）
	 */
	run: (params?: Partial<P>) => Promise<void>
	/**
	 * 合并参数、回到第 1 页并发起查询。
	 * @param params - 额外查询条件（增量合并）
	 */
	search: (params?: Partial<P>) => Promise<void>
	/** 恢复默认查询条件、清空排序与筛选、回到第 1 页并发起查询 */
	reset: () => Promise<void>
}

/**
 * 表格查询 hook。
 *
 * @param source - 数据源（业务注入）：接收合并后的查询参数，返回 { list, total }
 * @param options - 配置项，全部可选
 * @returns 响应式状态与 run / search / reset 方法
 */
export function useTable<T extends Record<string, unknown> = Record<string, unknown>, P extends Record<string, unknown> = Record<string, unknown>>(
	source: (params: TableQueryParams<P>) => Promise<TableSourceResult<T>>,
	options: UseTableOptions<P> = {}
): UseTableResult<T, P> {
	const defaultParams = options.defaultParams ?? ({} as P)
	const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
	const immediate = options.immediate ?? DEFAULT_IMMEDIATE

	const dataSource = ref<T[]>([]) as Ref<T[]>
	const loading = ref(false)
	const error = ref<unknown>(undefined)
	const extraParams = shallowRef<P>({ ...defaultParams })
	const sort = reactive<TableSortState>({ field: '', order: '' })
	const filters = reactive<Record<string, unknown>>({})

	/** 查询序号（竞态保护）：响应回写前比对，旧序号一律丢弃 */
	let requestSeq = 0

	function buildParams(): TableQueryParams<P> {
		return {
			...extraParams.value,
			currentPage: pagination.current,
			pageSize: pagination.size,
			sortField: sort.field,
			sortOrder: sort.order,
			filters: { ...filters }
		}
	}

	async function run(params?: Partial<P>): Promise<void> {
		if (params) {
			extraParams.value = { ...extraParams.value, ...params }
		}
		requestSeq += 1
		const seq = requestSeq
		loading.value = true
		error.value = undefined
		try {
			const result = await source(buildParams())
			if (seq !== requestSeq) return
			dataSource.value = result.list
			pagination.total = result.total
		} catch (err) {
			if (seq !== requestSeq) return
			error.value = err
		} finally {
			if (seq === requestSeq) {
				loading.value = false
			}
		}
	}

	function search(params?: Partial<P>): Promise<void> {
		pagination.current = DEFAULT_CURRENT_PAGE
		return run(params)
	}

	function reset(): Promise<void> {
		extraParams.value = { ...defaultParams }
		for (const key of Object.keys(filters)) {
			delete filters[key]
		}
		sort.field = ''
		sort.order = ''
		pagination.current = DEFAULT_CURRENT_PAGE
		return run()
	}

	function onChange(current: number, size: number): void {
		pagination.current = current
		pagination.size = size
		void run()
	}

	const pagination = reactive<TablePaginationState>({
		current: DEFAULT_CURRENT_PAGE,
		size: pageSize,
		total: 0,
		onChange
	})

	if (immediate) {
		void run()
	}

	// 卸载自动清理：组件外调用（无组件实例）跳过；使在途查询失效
	if (getCurrentInstance()) {
		onUnmounted(() => {
			requestSeq += 1
		})
	}

	return { dataSource, loading, error, pagination, sort, filters, run, search, reset }
}
