import { describe, expect, it } from 'vitest';
import { formatDict } from '../dict';

describe('formatDict', () => {
  const dictMap = { 1: '启用', 0: '禁用', male: '男', female: '女' };

  it('命中字典返回文案（数字与字符串键等价）', () => {
    expect(formatDict(1, dictMap)).toBe('启用');
    expect(formatDict('1', dictMap)).toBe('启用');
    expect(formatDict('male', dictMap)).toBe('男');
  });

  it('未命中返回 fallback，默认 -', () => {
    expect(formatDict(2, dictMap)).toBe('-');
    expect(formatDict('unknown', dictMap, '未知')).toBe('未知');
  });

  it('命中空字符串文案时原样返回', () => {
    expect(formatDict('empty', { empty: '' })).toBe('');
  });
});
