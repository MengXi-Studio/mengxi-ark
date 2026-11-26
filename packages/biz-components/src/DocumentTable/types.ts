/**
 * DocumentTable 单据表格 Props / Emits / Slots 契约。
 *
 * 核心是可编辑表格：基于 EnhanceTable 能力 + 行编辑状态 + 字段校验；
 * save 事件抛全量单据数据，组件不自带提交请求（§10「渲染器只渲染」精神）。
 * 行展开：expandedRowKeys 受控 + expandedRow 通用作用域槽（子表由业务在槽内组合，不做一键子表模板）。
 * 单元格级粒度权限：列级 permissionCode（some 语义）+ 列级 editable 函数化（行级粒度），
 * 权限源「上下文 permissions 探测 → props.permissions 兜底」；无权限单元格渲染只读文本（不隐藏列）。
 */
import type { MxColumn, MxSelectOption, MxSize } from '@mengxi-ark/components';

/** 行内编辑器类型 */
export type DocEditorType = 'input' | 'select';

/** 单元格校验规则（本地轻量实现，save 前统一校验） */
export interface DocCellRule {
  /** 是否必填，默认 false */
  required?: boolean;
  /** 校验失败提示，默认「该字段不能为空」 */
  message?: string;
  /** 自定义校验：返回错误文案，null 表示通过 */
  validator?: (value: unknown, row: Record<string, unknown>) => string | null;
}

/** 可编辑列配置（在统一列结构上扩展编辑能力） */
export interface DocColumn extends MxColumn {
  /**
   * 该列是否可编辑，默认 false；函数形态按行数据判定该行此列是否可编辑（行级粒度）。
   * 最终可编辑性 = editable 判定通过 + permissionCode 命中权限源；无权限单元格渲染只读文本。
   */
  editable?: boolean | ((row: Record<string, unknown>) => boolean);
  /** 编辑器类型，默认 'input' */
  editorType?: DocEditorType;
  /** editorType === 'select' 时的选项 */
  editorOptions?: MxSelectOption[];
  /** 该列校验规则（多条按顺序执行） */
  rules?: DocCellRule[];
  /**
   * 列级权限码（some 语义：命中任一即可编辑）。
   * 权限源：上下文 permissions 探测 → props.permissions 兜底；无权限源时降级策略见 DocumentTableProps.permissions。
   */
  permissionCode?: string | string[];
}

export interface DocumentTableProps {
  /** 行数据（v-model） */
  modelValue?: Array<Record<string, unknown>>;
  /** 列配置（必填） */
  columns: DocColumn[];
  /** 行 key 字段名，默认 'id'（新增行无该字段时自动生成临时 key） */
  rowKey?: string;
  /** 是否启用行编辑能力，默认 true */
  editable?: boolean;
  /** 是否展示「新增行」按钮，默认 true */
  addable?: boolean;
  /** 是否展示「删除行」按钮，默认 true */
  deletable?: boolean;
  /** 是否展示「保存」按钮（emit save，不自带提交请求），默认 true */
  savable?: boolean;
  size?: MxSize;
  /** 新增行按钮文案，默认「新增行」 */
  addText?: string;
  /** 保存按钮文案，默认「保存」 */
  saveText?: string;
  /** 受控行展开 keys（undefined 不启用展开；v-model:expanded-row-keys） */
  expandedRowKeys?: Array<string | number> | undefined;
  /**
   * 权限码列表（props 兜底，与上下文 permissions 同名对应；上下文命中优先）。
   * 配置了 permissionCode 但上下文与 props 均未提供权限源时：console.warn 一次并视为有权限
   * （独立模式不做权限拦截，避免配置遗漏导致业务不可编辑）。
   */
  permissions?: string[];
}

export interface DocumentTableEmits {
  (e: 'update:modelValue', rows: Array<Record<string, unknown>>): void;
  /** 点击保存：校验通过后抛全量单据数据（不自带提交请求） */
  (e: 'save', rows: Array<Record<string, unknown>>): void;
  /** 新增行 */
  (e: 'rowAdd', row: Record<string, unknown>): void;
  /** 删除行 */
  (e: 'rowRemove', row: Record<string, unknown>): void;
  /** 展开行变化（expandedRowKeys 受控回抛） */
  (e: 'update:expandedRowKeys', keys: Array<string | number>): void;
}

export interface DocumentTableSlots {
  /** 自定义工具栏（追加在默认按钮之后） */
  toolbar?: () => unknown;
  /** 单元格自定义渲染（非编辑态生效） */
  bodyCell?: (binding: { column: { dataIndex: string; title: string }; record: Record<string, unknown>; index: number }) => unknown;
  /** 行展开内容（内嵌子 DocumentTable / EnhanceTable 由业务在槽内组合） */
  expandedRow?: (binding: { record: Record<string, unknown>; index: number }) => unknown;
}
