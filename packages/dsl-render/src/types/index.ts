/**
 * DSL Schema 类型汇总出口（规范 §10：显式导出 + validateSchema 校验工具）。
 */
export { DEFAULT_RULE_MESSAGE, isPlainObject } from './common';
export type { FieldRule, FieldSchemaBase, SchemaKind, ValidationResult } from './common';
export type { QueryFieldSchema, QuerySchema } from './query';
export type { FormFieldSchema, FormSchema } from './form';
export type { TableColumnSchema, TableSchema } from './table';

import type { QuerySchema } from './query';
import type { FormSchema } from './form';
import type { TableSchema } from './table';

/** 三类 Schema 联合类型（kind 字段判别） */
export type ArkSchema = QuerySchema | FormSchema | TableSchema;
