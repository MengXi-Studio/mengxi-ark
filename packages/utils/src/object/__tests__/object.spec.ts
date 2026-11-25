import { afterEach, describe, expect, it, vi } from 'vitest';
import { deepClone, merge, omit, pick } from '../index';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('deepClone', () => {
  it('structuredClone 路径：嵌套对象 / 数组 / Date 完整克隆且引用隔离', () => {
    const source = {
      at: new Date(2026, 0, 2, 3, 4, 5),
      list: [1, { x: 2 }],
      nested: { deep: { v: 1 } },
    };
    const cloned = deepClone(source);
    expect(cloned).not.toBe(source);
    expect(cloned.list).not.toBe(source.list);
    expect(cloned.list[1]).not.toBe(source.list[1]);
    expect(cloned.nested.deep).not.toBe(source.nested.deep);
    expect(cloned.list).toEqual([1, { x: 2 }]);
    expect(cloned.at instanceof Date).toBe(true);
    expect(cloned.at.getTime()).toBe(source.at.getTime());
  });

  it('JSON 兜底路径：环境无 structuredClone 时 Date 仍可还原', () => {
    vi.stubGlobal('structuredClone', undefined);
    const source = {
      at: new Date(2026, 5, 1, 8, 9, 10),
      list: [1, 2],
      nested: { a: { b: 'c' } },
    };
    const cloned = deepClone(source);
    expect(cloned.at instanceof Date).toBe(true);
    expect(cloned.at.getTime()).toBe(source.at.getTime());
    expect(cloned.list).toEqual([1, 2]);
    expect(cloned.nested.a).not.toBe(source.nested.a);
    expect(cloned.nested.a).toEqual({ b: 'c' });
  });

  it('原始值直接返回自身', () => {
    expect(deepClone(5)).toBe(5);
    expect(deepClone('str')).toBe('str');
    expect(deepClone(null)).toBe(null);
    expect(deepClone(undefined)).toBe(undefined);
  });
});

describe('merge', () => {
  it('深合并嵌套普通对象且返回新对象不改入参', () => {
    const target = { a: 1, nested: { x: 1, y: 2 } };
    const source = { b: 2, nested: { y: 3, z: 4 } };
    const result = merge(target, source);
    expect(result).toEqual({ a: 1, b: 2, nested: { x: 1, y: 3, z: 4 } });
    expect(result.nested).not.toBe(target.nested);
    expect(target).toEqual({ a: 1, nested: { x: 1, y: 2 } });
  });

  it('多 source 依序合并，undefined 跳过、数组与 Date 等非普通对象直接覆盖', () => {
    const date = new Date(0);
    const result = merge({ a: 1, arr: [1, 2], d: 0 }, { arr: undefined, d: date }, { arr: [3] });
    expect(result).toEqual({ a: 1, arr: [3], d: date });
    expect(result.d).toBe(date);
  });

  it('null / undefined source 被忽略', () => {
    expect(merge({ a: 1 }, null, undefined)).toEqual({ a: 1 });
    expect(merge({ a: 1 }, { b: null })).toEqual({ a: 1, b: null });
  });
});

describe('omit', () => {
  const obj = { a: 1, b: 'x', c: true };

  it('剔除指定键并返回新对象', () => {
    const result = omit(obj, ['b']);
    expect(result).toEqual({ a: 1, c: true });
    expect(result).not.toBe(obj);
    expect(obj).toEqual({ a: 1, b: 'x', c: true });
  });

  it('空键数组返回全量副本', () => {
    expect(omit(obj, [])).toEqual({ a: 1, b: 'x', c: true });
    expect(omit(obj, [])).not.toBe(obj);
  });

  it('运行时缺失的键安全跳过', () => {
    const missing = 'missing' as unknown as keyof typeof obj;
    expect(omit(obj, [missing])).toEqual({ a: 1, b: 'x', c: true });
  });
});

describe('pick', () => {
  const obj = { a: 1, b: 'x', c: true };

  it('仅保留指定键并返回新对象', () => {
    const result = pick(obj, ['a', 'c']);
    expect(result).toEqual({ a: 1, c: true });
    expect(result).not.toBe(obj);
    expect(obj).toEqual({ a: 1, b: 'x', c: true });
  });

  it('空键数组返回空对象', () => {
    expect(pick(obj, [])).toEqual({});
  });

  it('运行时缺失的键安全跳过', () => {
    const missing = 'missing' as unknown as keyof typeof obj;
    expect(pick(obj, [missing])).toEqual({});
  });
});
