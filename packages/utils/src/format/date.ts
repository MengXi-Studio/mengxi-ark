/**
 * 格式化日期为指定模式字符串。
 *
 * 支持占位符：YYYY（年）、MM（月）、DD（日）、HH（时，24 小时制）、mm（分）、ss（秒）、SSS（毫秒，3 位）、S（毫秒原值）。
 * 时间统一按本地时区取值。
 *
 * @param input 毫秒级时间戳、Date 实例或可被 Date 构造函数解析的字符串
 * @param pattern 格式模式，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns 格式化后的日期字符串；输入无法解析为有效日期时返回 ''
 *
 * @example
 * formatDate(new Date(2026, 0, 2, 3, 4, 5), 'YYYY-MM-DD HH:mm:ss'); // '2026-01-02 03:04:05'
 * formatDate(new Date(2026, 10, 25), 'YYYY/MM/DD'); // '2026/11/25'
 * formatDate('not-a-date'); // ''
 */
export function formatDate(input: number | Date | string, pattern = 'YYYY-MM-DD HH:mm:ss'): string {
	const date = input instanceof Date ? input : new Date(input)
	if (Number.isNaN(date.getTime())) return ''
	const pad = (n: number, len = 2): string => String(n).padStart(len, '0')
	const tokenMap: Record<string, string> = {
		YYYY: String(date.getFullYear()),
		MM: pad(date.getMonth() + 1),
		DD: pad(date.getDate()),
		HH: pad(date.getHours()),
		mm: pad(date.getMinutes()),
		ss: pad(date.getSeconds()),
		SSS: pad(date.getMilliseconds(), 3),
		S: String(date.getMilliseconds())
	}
	// 替换表按「长 token 优先」排列，保证 SSS 先于 S 匹配
	return pattern.replace(/YYYY|SSS|MM|DD|HH|mm|ss|S/g, token => tokenMap[token])
}
