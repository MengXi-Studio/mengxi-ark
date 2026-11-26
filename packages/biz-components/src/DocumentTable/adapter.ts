/**
 * DocumentTable 行编辑与校验逻辑（上下文探测与 props 兜底装配的独立模块）。
 *
 * 校验采用本地轻量 rules 实现（required / message / validator）：
 * useForm 依赖适配器表单实例（整体表单校验场景），行级编辑表格不适用，故不在 M2 强行复用。
 */
import type { DocCellRule, DocColumn } from './types';

/** 校验错误：rowKey → dataIndex → 错误文案 */
export type DocValidateErrors = Record<string, Record<string, string>>;

/**
 * 执行单条规则的校验。
 * @returns 错误文案，null 表示通过
 */
export function validateCell(
  rule: DocCellRule,
  value: unknown,
  row: Record<string, unknown>,
): string | null {
  const empty =
    value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
  if (rule.required && empty) {
    return rule.message ?? '该字段不能为空';
  }
  if (rule.validator) {
    return rule.validator(value, row);
  }
  return null;
}

/**
 * 全量校验：按列 rules 逐行执行。
 * @param skip 可选跳过判定（如单元格级权限不可编辑的单元格）——跳过的单元格不做校验，
 *             防止「必填列对当前用户无编辑权限 → 永远无法保存」死锁。
 * @returns 全部错误（空对象表示全部通过）
 */
export function validateRows(
  rows: Array<Record<string, unknown>>,
  columns: DocColumn[],
  rowKey: string,
  skip?: (row: Record<string, unknown>, dataIndex: string) => boolean,
): DocValidateErrors {
  const errors: DocValidateErrors = {};
  for (const row of rows) {
    const key = String(row[rowKey] ?? '');
    for (const column of columns) {
      if (!column.rules || column.rules.length === 0) continue;
      if (skip?.(row, column.dataIndex)) continue;
      const value = row[column.dataIndex];
      for (const rule of column.rules) {
        const message = validateCell(rule, value, row);
        if (message) {
          errors[key] ??= {};
          errors[key][column.dataIndex] = message;
          break;
        }
      }
    }
  }
  return errors;
}

/**
 * 生成新增行的临时 key（rowKey 字段缺失时使用，形如 __mx_row_<时间戳>_<序号>）。
 */
export function createTempRowKey(): string {
  const seq = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  return `__mx_row_${seq}`;
}
