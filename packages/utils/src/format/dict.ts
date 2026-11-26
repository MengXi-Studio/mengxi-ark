/**
 * 字典翻译：把字典值（如 '1' / 1）翻译为对应文案。
 *
 * 仅按对象自有属性匹配（不沿原型链查找），键统一按字符串比较（数字 1 与 '1' 等价）；
 * 命中空字符串文案时原样返回 ''。
 *
 * @param value 字典值
 * @param dictMap 字典映射表（值 → 文案）
 * @param fallback 未命中时的兜底文案，默认 '-'
 * @returns 命中的文案，或 fallback
 *
 * @example
 * formatDict(1, { 1: '启用', 0: '禁用' }); // '启用'
 * formatDict('male', { male: '男', female: '女' }); // '男'
 * formatDict(9, { 1: '启用' }, '未知'); // '未知'
 */
export function formatDict(value: string | number, dictMap: Record<string | number, string>, fallback = '-'): string {
	const key = String(value)
	return Object.hasOwn(dictMap, key) ? dictMap[key] : fallback
}
