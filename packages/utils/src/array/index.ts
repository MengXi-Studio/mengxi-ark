/**
 * 数组去重。
 *
 * 不传 keyField 时对原始值去重（基于 Set，NaN 视为相同值）；
 * 传入 keyField 时按对象字段值去重，保留首个出现的元素（字段缺失视为 undefined 键）。
 * 纯函数不改入参。
 *
 * @param arr 源数组
 * @param keyField 可选：对象数组按该字段值去重
 * @returns 去重后的新数组
 *
 * @example
 * unique([1, 2, 2, 3]); // [1, 2, 3]
 * unique([{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }], 'id');
 * // [{ id: 1, v: 'a' }, { id: 2, v: 'b' }]
 */
export function unique<T>(arr: T[], keyField?: string): T[] {
  if (keyField === undefined) {
    return Array.from(new Set(arr));
  }
  const seen = new Set<unknown>();
  const result: T[] = [];
  for (const item of arr) {
    const key = (item as Record<string, unknown> | null | undefined)?.[keyField];
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/**
 * 数组分组：按 keyFn 返回的键把元素归入对应桶。
 *
 * 键统一转换为字符串（数字键 1 → '1'）；纯函数不改入参。
 *
 * @param arr 源数组
 * @param keyFn 分组键函数，入参为 (元素, 下标)，返回 string | number
 * @returns 分组结果（键 → 元素数组）
 *
 * @example
 * groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? 'even' : 'odd'));
 * // { odd: [1, 3], even: [2, 4] }
 */
export function groupBy<T>(
  arr: T[],
  keyFn: (item: T, index: number) => string | number,
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  arr.forEach((item, index) => {
    const key = String(keyFn(item, index));
    (result[key] ??= []).push(item);
  });
  return result;
}

/**
 * 数组分块：按指定长度切分为二维数组。
 *
 * size 为非正数或 NaN 时返回 []；末块长度可以小于 size；纯函数不改入参。
 *
 * @param arr 源数组
 * @param size 每块长度（正整数）
 * @returns 分块后的二维数组
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * chunk([1, 2], 5); // [[1, 2]]
 * chunk([1], 0); // []
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const safeSize = Math.floor(size);
  if (!Number.isFinite(safeSize) || safeSize <= 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += safeSize) {
    result.push(arr.slice(i, i + safeSize));
  }
  return result;
}
