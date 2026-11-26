/**
 * validateSchema —— Schema 结构校验工具（规范 §10.1）。
 *
 * 纯函数（不依赖 Vue）：校验 kind 判别、fields / columns 数组结构、字段 type / field、
 * 列 dataIndex / title、rules / visible / props 形态；返回 { valid, errors[] }，
 * 错误带路径（如 fields[2].type）便于定位。运行时渲染器不做全量校验（性能优先），
 * 开发期建议在接入处先调用本工具。
 */
import type { ValidationResult } from '../types/common';
import { isPlainObject } from '../types/common';

const SCHEMA_KINDS = new Set(['query', 'form', 'table']);

/** 校验单个字段 / 列配置，errors 就地追加 */
function validateEntry(entry: unknown, kind: string, path: string, errors: string[]): void {
  if (!isPlainObject(entry)) {
    errors.push(`${path} 必须为对象`);
    return;
  }
  if (kind === 'table') {
    if (typeof entry.dataIndex !== 'string' || !entry.dataIndex) errors.push(`${path}.dataIndex 必须为非空字符串`);
    if (typeof entry.title !== 'string' || !entry.title) errors.push(`${path}.title 必须为非空字符串`);
    if (entry.editable !== undefined
      && typeof entry.editable !== 'boolean'
      && typeof entry.editable !== 'function') {
      errors.push(`${path}.editable 必须为 boolean 或函数`);
    }
  } else {
    if (typeof entry.type !== 'string' || !entry.type) errors.push(`${path}.type 必须为非空字符串`);
    if (typeof entry.field !== 'string' || !entry.field) errors.push(`${path}.field 必须为非空字符串`);
    if (entry.visible !== undefined && typeof entry.visible !== 'function') {
      errors.push(`${path}.visible 必须为函数`);
    }
  }
  if (entry.rules !== undefined) {
    if (!Array.isArray(entry.rules)) {
      errors.push(`${path}.rules 必须为数组`);
    } else {
      entry.rules.forEach((rule, ruleIndex) => {
        if (!isPlainObject(rule)) errors.push(`${path}.rules[${ruleIndex}] 必须为对象`);
        else if (rule.required === undefined && typeof rule.validator !== 'function') {
          errors.push(`${path}.rules[${ruleIndex}] 必须声明 required 或 validator`);
        }
      });
    }
  }
  if (entry.props !== undefined && !isPlainObject(entry.props)) {
    errors.push(`${path}.props 必须为对象`);
  }
}

/**
 * 校验 Schema 结构（query / form / table 三类通用）。
 *
 * @param schema - 待校验对象（unknown，允许任意输入）
 * @returns { valid, errors[] }：valid 为 false 时 errors 含全部结构问题
 *
 * @example
 * const result = validateSchema(schema);
 * if (!result.valid) console.error(result.errors);
 */
export function validateSchema(schema: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isPlainObject(schema)) {
    return { valid: false, errors: ['Schema 必须为对象'] };
  }
  if (!SCHEMA_KINDS.has(schema.kind as string)) {
    errors.push('kind 必须为 query | form | table');
  } else {
    const kind = schema.kind as 'query' | 'form' | 'table';
    const listKey = kind === 'table' ? 'columns' : 'fields';
    const list = schema[listKey];
    if (!Array.isArray(list)) {
      errors.push(`${listKey} 必须为数组`);
    } else if (list.length === 0) {
      errors.push(`${listKey} 不能为空`);
    } else {
      list.forEach((entry, index) => validateEntry(entry, kind, `${listKey}[${index}]`, errors));
    }
    if (schema.mode !== undefined && kind === 'table' && schema.mode !== 'table' && schema.mode !== 'document') {
      errors.push('mode 必须为 table | document');
    }
  }
  return { valid: errors.length === 0, errors };
}
