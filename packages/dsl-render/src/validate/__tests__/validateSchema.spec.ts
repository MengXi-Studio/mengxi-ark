import { describe, expect, it } from 'vitest';
import { validateSchema } from '../validateSchema';

describe('validateSchema', () => {
  it('非对象输入 → invalid', () => {
    expect(validateSchema(null).valid).toBe(false);
    expect(validateSchema('x').valid).toBe(false);
    expect(validateSchema([1]).valid).toBe(false);
  });

  it('kind 缺失 / 非法 → 报 kind 错误', () => {
    const result = validateSchema({ fields: [{ type: 'input', field: 'name' }] });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('kind'))).toBe(true);

    const bad = validateSchema({ kind: 'grid', fields: [] });
    expect(bad.errors.some((e) => e.includes('kind'))).toBe(true);
  });

  it('合法 query Schema → valid', () => {
    const result = validateSchema({
      kind: 'query',
      fields: [{ type: 'input', field: 'name', label: '姓名' }],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fields 缺失 / 非数组 / 空数组 → 报错', () => {
    expect(validateSchema({ kind: 'form' }).errors.some((e) => e.includes('fields 必须为数组'))).toBe(true);
    expect(validateSchema({ kind: 'form', fields: 'x' }).errors.some((e) => e.includes('fields 必须为数组'))).toBe(true);
    expect(validateSchema({ kind: 'form', fields: [] }).errors.some((e) => e.includes('fields 不能为空'))).toBe(true);
  });

  it('字段缺 type / field → 带路径报错', () => {
    const result = validateSchema({ kind: 'form', fields: [{ field: 'name' }, { type: 'input' }] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('fields[0].type 必须为非空字符串');
    expect(result.errors).toContain('fields[1].field 必须为非空字符串');
  });

  it('visible 非函数 → 报错', () => {
    const result = validateSchema({ kind: 'query', fields: [{ type: 'input', field: 'a', visible: 'x' }] });
    expect(result.errors).toContain('fields[0].visible 必须为函数');
  });

  it('rules 非数组 / 空规则 → 报错；合法规则通过', () => {
    const bad = validateSchema({ kind: 'form', fields: [{ type: 'input', field: 'a', rules: 'x' }] });
    expect(bad.errors).toContain('fields[0].rules 必须为数组');

    const empty = validateSchema({ kind: 'form', fields: [{ type: 'input', field: 'a', rules: [{}] }] });
    expect(empty.errors.some((e) => e.includes('rules[0] 必须声明 required 或 validator'))).toBe(true);

    const ok = validateSchema({
      kind: 'form',
      fields: [{ type: 'input', field: 'a', rules: [{ required: true }, { validator: () => null }] }],
    });
    expect(ok.valid).toBe(true);
  });

  it('props 非对象 → 报错', () => {
    const result = validateSchema({ kind: 'query', fields: [{ type: 'input', field: 'a', props: 1 }] });
    expect(result.errors).toContain('fields[0].props 必须为对象');
  });

  it('table Schema：columns 结构 / dataIndex / title / editable', () => {
    const ok = validateSchema({
      kind: 'table',
      columns: [{ dataIndex: 'name', title: '姓名' }],
    });
    expect(ok.valid).toBe(true);

    const bad = validateSchema({
      kind: 'table',
      columns: [{ dataIndex: 'name', editable: 'x' }],
      mode: 'grid',
    });
    expect(bad.errors).toContain('columns[0].title 必须为非空字符串');
    expect(bad.errors).toContain('columns[0].editable 必须为 boolean 或函数');
    expect(bad.errors).toContain('mode 必须为 table | document');
  });

  it('document 模式合法 Schema → valid', () => {
    const result = validateSchema({
      kind: 'table',
      mode: 'document',
      columns: [{ dataIndex: 'product', title: '品名', editable: true, rules: [{ required: true }] }],
    });
    expect(result.valid).toBe(true);
  });
});
