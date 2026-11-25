function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

const DATE_CLONE_TAG = '__mx_clone_date__';

/**
 * JSON 兜底前把 Date 预处理为时间戳标记对象。
 * 原因：JSON.stringify 的 toJSON 先于 replacer 执行，replacer 收到的 Date 已是字符串，无法拦截。
 */
function replaceDatesWithMarker(value: unknown): unknown {
  if (value instanceof Date) return { [DATE_CLONE_TAG]: value.getTime() };
  if (Array.isArray(value)) return value.map(replaceDatesWithMarker);
  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      result[key] = replaceDatesWithMarker(value[key]);
    }
    return result;
  }
  return value;
}

/**
 * 深拷贝。
 *
 * 优先使用环境的 structuredClone（支持 Date / 数组 / 嵌套对象 / Map / Set 等）；
 * 环境不支持时降级为 JSON 兜底（Date 先替换为时间戳标记对象序列化，parse 时还原，不退化成字符串）。
 * 原始值（number / string / boolean / null / undefined）直接返回自身；
 * 不适用于含函数、DOM 节点等不可序列化值的对象（JSON 兜底下原型信息会丢失）。
 *
 * @param value 待拷贝值
 * @returns 深拷贝结果（与入参引用隔离）
 *
 * @example
 * const copy = deepClone({ at: new Date(), list: [1, { x: 2 }] });
 * copy.list[1] !== source.list[1]; // true
 */
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') return value;
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(
    JSON.stringify(replaceDatesWithMarker(value)),
    (_key, v: unknown) => {
      if (
        v !== null &&
        typeof v === 'object' &&
        Object.hasOwn(v as object, DATE_CLONE_TAG) &&
        Object.keys(v as object).length === 1
      ) {
        return new Date((v as Record<string, unknown>)[DATE_CLONE_TAG] as number);
      }
      return v;
    },
  ) as T;
}

function deepMergeRecord(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    if (sourceValue === undefined) continue;
    const targetValue = result[key];
    if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
      result[key] = deepMergeRecord(targetValue, sourceValue);
    } else {
      result[key] = sourceValue;
    }
  }
  return result;
}

/**
 * 深合并对象（支持多个 source 从左到右依次合并）。
 *
 * 纯函数：返回全新对象，不改入参（嵌套层同样引用隔离）；
 * 嵌套普通对象递归合并；数组与 Date 等非普通对象直接覆盖；source 中值为 undefined 的字段跳过。
 *
 * @param target 目标对象
 * @param sources 待合并来源（null / undefined 会被忽略）
 * @returns 合并后的新对象（类型与 target 一致；新增字段不做类型提示，按需断言）
 *
 * @example
 * merge({ a: 1, nested: { x: 1 } }, { nested: { y: 2 }, b: 3 });
 * // { a: 1, nested: { x: 1, y: 2 }, b: 3 }
 */
export function merge<T extends object>(
  target: T,
  ...sources: Array<Record<string, unknown> | null | undefined>
): T {
  let result: Record<string, unknown> = { ...(target as Record<string, unknown>) };
  for (const source of sources) {
    if (isPlainObject(source)) result = deepMergeRecord(result, source);
  }
  return result as T;
}

/**
 * 剔除对象指定键，返回新对象（纯函数不改入参）。
 *
 * @param obj 源对象
 * @param keys 要剔除的键名数组
 * @returns 剔除后的新对象
 *
 * @example
 * omit({ a: 1, b: 2, c: 3 }, ['b']); // { a: 1, c: 3 }
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const keySet = new Set<unknown>(keys);
  const source = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (!keySet.has(key)) result[key] = source[key];
  }
  return result as Omit<T, K>;
}

/**
 * 从对象中挑选指定键，返回新对象（纯函数不改入参）。
 *
 * 仅拷贝对象上实际存在的键；运行时不存在的键会被安全跳过。
 *
 * @param obj 源对象
 * @param keys 要保留的键名数组
 * @returns 仅含指定键的新对象
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c']); // { a: 1, c: 3 }
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const source = obj as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    const keyStr = key as string;
    if (Object.hasOwn(source, keyStr)) result[keyStr] = source[keyStr];
  }
  return result as Pick<T, K>;
}
