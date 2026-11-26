function isBrowser(): boolean {
	return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 触发浏览器下载。
 *
 * @param source 下载源：Blob 实例（经临时 object URL 下载并在完成后回收）或 URL 字符串（data: / blob: / 同源地址直接作为下载地址）
 * @param filename 保存文件名
 * @returns 浏览器环境返回 true；**Node 环境（无 window / document）安全降级，静默返回 false**（不抛异常）
 *
 * @example
 * download(new Blob([content], { type: 'text/plain' }), '说明.txt'); // 浏览器中 true，Node 中 false
 * download('/api/export?id=1', '导出.xlsx'); // 浏览器中 true，Node 中 false
 */
export function download(source: Blob | string, filename: string): boolean {
	if (!isBrowser()) return false
	const isBlob = source instanceof Blob
	const href = isBlob ? URL.createObjectURL(source) : source
	const anchor = document.createElement('a')
	anchor.href = href
	anchor.download = filename
	document.body.appendChild(anchor)
	anchor.click()
	document.body.removeChild(anchor)
	if (isBlob) URL.revokeObjectURL(href)
	return true
}

/**
 * exportCsv 可选配置。
 */
export interface ExportCsvOptions {
	/** 表头文案数组，与列顺序一一对应（列顺序取首行数据的字段名顺序）；不传时表头直接使用字段名 */
	headers?: string[]
}

function escapeCsvField(field: string): string {
	if (/[",\n\r]/.test(field)) {
		return `"${field.replace(/"/g, '""')}"`
	}
	return field
}

/**
 * 把对象数组导出为 CSV 并触发下载。
 *
 * 内容前置 BOM（\\uFEFF）以保证 Excel 打开中文不乱码；字段含逗号 / 引号 / 换行时按 CSV 规范转义；
 * 行分隔符为 \\r\\n；null / undefined 单元格输出空串，复杂类型按 String() 转换。
 *
 * @param rows 行数据数组（列顺序取首行数据的字段名顺序；空数组时仅输出表头）
 * @param filename 保存文件名（建议以 .csv 结尾）
 * @param options 可选配置：headers 自定义表头文案（长度应与列数一致）
 * @returns 浏览器环境返回 true；**Node 环境（无 window / document）安全降级，静默返回 false**（不抛异常）
 *
 * @example
 * exportCsv([{ name: '张三', age: 18 }], 'users.csv', { headers: ['姓名', '年龄'] }); // 浏览器中 true，Node 中 false
 */
export function exportCsv(rows: Record<string, unknown>[], filename: string, options?: ExportCsvOptions): boolean {
	if (!isBrowser()) return false
	const columns = rows.length > 0 ? Object.keys(rows[0]) : []
	const headerRow = options?.headers ?? columns
	const lines = [headerRow, ...rows.map(row => columns.map(col => row[col]))].map(cells => cells.map(cell => escapeCsvField(cell == null ? '' : String(cell))).join(','))
	const content = `\uFEFF${lines.join('\r\n')}`
	return download(new Blob([content], { type: 'text/csv;charset=utf-8' }), filename)
}

/**
 * 读取 URL 查询参数（自动 URL 解码）。
 *
 * @param name 参数名
 * @param url 可选：目标 URL；不传时浏览器下取 window.location.href，**Node 环境（无 window）返回 null**
 * @returns 参数值（已解码）；参数不存在、无查询串或无法取得 URL 时返回 null
 *
 * @example
 * getUrlParam('id'); // 浏览器中取当前地址栏参数
 * getUrlParam('b', 'https://x.com/p?b=1#tag'); // '1'
 * getUrlParam('b', 'https://x.com/p'); // null
 */
export function getUrlParam(name: string, url?: string): string | null {
	let target = url
	if (target === undefined) {
		if (typeof window === 'undefined') return null
		target = window.location.href
	}
	const queryStart = target.indexOf('?')
	if (queryStart === -1) return null
	let query = target.slice(queryStart + 1)
	const hashIndex = query.indexOf('#')
	if (hashIndex !== -1) query = query.slice(0, hashIndex)
	return new URLSearchParams(query).get(name)
}
