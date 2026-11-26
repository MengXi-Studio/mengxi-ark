/**
 * demo 用 mock 接口（仅演示环境使用，不属于框架包产物）。
 */

/** 23 条模拟用户数据（status 随序号交替，供状态筛选演示） */
const ALL_USERS = Array.from({ length: 23 }, (_, i) => ({
	code: `U${String(i + 1).padStart(2, '0')}`,
	name: `用户${i + 1}`,
	status: i % 2 === 0 ? '1' : '0'
}))

/**
 * Lov 值集接口 mock：遵循交互约定字段 keyword / currentPage / pageSize，
 * 返回 { list, total } 分页结构（约 200ms 延迟）。
 */
export function createMockLovApi(): (params: Record<string, unknown>) => Promise<{ list: Array<{ code: string; name: string }>; total: number }> {
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

/**
 * useTable 数据源 mock：接收合并后查询参数，返回 { list, total }。
 */
export function createMockUserTableSource(): (params: Record<string, unknown>) => Promise<{ list: Array<Record<string, unknown>>; total: number }> {
	return params =>
		new Promise(resolve => {
			setTimeout(() => {
				const keyword = String(params.keyword ?? '')
				const status = params.status
				const filtered = ALL_USERS.filter(user => {
					if (keyword && !user.name.includes(keyword) && !user.code.includes(keyword)) return false
					if (status !== undefined && status !== null && status !== '' && user.status !== String(status)) return false
					return true
				})
				const currentPage = Number(params.currentPage ?? 1)
				const pageSize = Number(params.pageSize ?? 10)
				resolve({
					list: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
					total: filtered.length
				})
			}, 200)
		})
}

/** 省市级联 mock 数据：parentId 为 null 的是省级 */
const REGIONS: Array<{ code: string; name: string; parentId: string | null }> = [
	{ code: 'ZJ', name: '浙江省', parentId: null },
	{ code: 'GD', name: '广东省', parentId: null },
	{ code: 'JS', name: '江苏省', parentId: null },
	{ code: 'HZ', name: '杭州市', parentId: 'ZJ' },
	{ code: 'NB', name: '宁波市', parentId: 'ZJ' },
	{ code: 'WZ', name: '温州市', parentId: 'ZJ' },
	{ code: 'GZ', name: '广州市', parentId: 'GD' },
	{ code: 'SZ', name: '深圳市', parentId: 'GD' },
	{ code: 'NJ', name: '南京市', parentId: 'JS' },
	{ code: 'SZJ', name: '苏州市', parentId: 'JS' }
]

/**
 * 省市级联 Lov mock：带 parentId 入参时返回该父级下的市级（parentId 为 null 返回空）；
 * 不带 parentId 时返回省级列表。遵循 keyword / currentPage / pageSize 交互约定。
 */
export function createMockRegionLovApi(): (params: Record<string, unknown>) => Promise<{ list: Array<{ code: string; name: string }>; total: number }> {
	return params =>
		new Promise(resolve => {
			setTimeout(() => {
				const keyword = String(params.keyword ?? '')
				const filtered = REGIONS.filter(region => {
					if ('parentId' in params) {
						if (params.parentId === null || params.parentId === undefined || region.parentId !== String(params.parentId)) return false
					}
					if (keyword && !region.name.includes(keyword) && !region.code.includes(keyword)) return false
					return true
				})
				const currentPage = Number(params.currentPage ?? 1)
				const pageSize = Number(params.pageSize ?? 10)
				resolve({
					list: filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
					total: filtered.length
				})
			}, 200)
		})
}
