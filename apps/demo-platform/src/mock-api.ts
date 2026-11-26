/**
 * demo-platform 用 mock 接口（仅演示环境使用，不属于框架包产物）。
 */

/** 23 条模拟用户数据（status 随序号交替） */
const ALL_USERS = Array.from({ length: 23 }, (_, i) => ({
	code: `U${String(i + 1).padStart(2, '0')}`,
	name: `用户${i + 1}`,
	status: i % 2 === 0 ? '1' : '0'
}))

/**
 * Lov 值集列表接口 mock：keyword / currentPage / pageSize 交互约定，
 * 返回 { list, total } 分页结构（约 200ms 延迟）。经 runtime context.lovListApi 下发。
 */
export function createMockLovApi(): (params: Record<string, unknown>) => Promise<{ list: Array<{ code: string; name: string; status: string }>; total: number }> {
	return (params: Record<string, unknown>) =>
		new Promise(resolve => {
			setTimeout(() => {
				const keyword = String(params.keyword ?? '')
				const filtered = ALL_USERS.filter(user => !keyword || user.name.includes(keyword) || user.code.includes(keyword))
				const currentPage = Number(params.currentPage ?? 1)
				const pageSize = Number(params.pageSize ?? 10)
				resolve({
					list: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
					total: filtered.length
				})
			}, 200)
		})
}

/** 单据行数据 mock（DocumentTable 演示） */
export const MOCK_ORDER_ROWS: Array<Record<string, unknown>> = [
	{ id: 1, product: '曦舟中台 license', count: 3, remark: '年度订阅' },
	{ id: 2, product: '组件库技术支持', count: 1, remark: '按次计费' },
	{ id: 3, product: '定制开发服务', count: 2, remark: '' }
]

/** 单据编辑器下拉选项 mock */
export const ORDER_COUNT_OPTIONS = [
	{ label: '1 件', value: 1 },
	{ label: '2 件', value: 2 },
	{ label: '3 件', value: 3 }
]
