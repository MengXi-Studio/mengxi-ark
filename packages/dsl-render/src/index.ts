/**
 * @mengxi-ark/dsl-render —— DSL 配置渲染引擎（实施方案 §3.7 / §10）。
 *
 * - 手写 SFC 一等公民，配置渲染只是加速方案；
 * - Schema 强 TS 类型（QuerySchema / FormSchema / TableSchema）+ validateSchema 结构校验；
 * - 三个独立渲染器（QueryRenderer / FormRenderer / TableRenderer），组件经映射表解析，
 *   业务可传 componentMap 覆盖替换（渲染器不硬编码组件清单）；
 * - 双模式：Lov / DocumentTable 的基座联动由 biz-components 自身 inject 探测完成，
 *   本包不 import @mengxi-ark/runtime（规范 §5 硬性边界）；
 * - 渲染器只渲染：search / submit / save 事件抛给上层业务，不自带请求逻辑。
 */
// —— Schema 类型 ——
export type { ArkSchema, FieldRule, FieldSchemaBase, FormFieldSchema, FormSchema, QueryFieldSchema, QuerySchema, SchemaKind, TableColumnSchema, TableSchema, ValidationResult } from './types'
export { DEFAULT_RULE_MESSAGE, isPlainObject } from './types'

// —— 结构校验 ——
export { validateSchema } from './validate/validateSchema'

// —— 组件映射注册表 ——
export { buildDefaultComponentMap, createComponentMap } from './componentMap'
export type { SchemaComponentMap, SchemaMapEntry } from './componentMap'

// —— 渲染器 ——
export { QueryRenderer } from './renderers/QueryRenderer'
export { FormRenderer } from './renderers/FormRenderer'
export { TableRenderer } from './renderers/TableRenderer'

/** 包版本常量（M0 包壳遗留，保持兼容） */
export const MENGXI_ARK_VERSION = '0.0.0'
