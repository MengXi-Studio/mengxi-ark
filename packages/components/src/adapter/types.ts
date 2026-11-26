/**
 * UI 适配器统一契约（规范 §6.3）。
 *
 * 适配器实现（antdv / element-plus）把各 UI 库组件包装为统一 props / 事件外壳：
 * - 统一受控绑定：`modelValue` + `update:modelValue`；
 * - 统一尺寸语义：`sm | md | lg`（全库通用 props 约定 §6.2.5）；
 * - 组件文件禁止 import 任何 UI 库，一律经 `inject(UI_ADAPTER_KEY)` 取本接口（默认 Ant Design Vue）。
 */
import type { Component, InjectionKey } from 'vue';

/** 统一尺寸语义 */
export type MxSize = 'sm' | 'md' | 'lg';

/** 统一选项结构（Select / 行内编辑下拉等） */
export interface MxSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

/** 统一表格列配置（EnhanceTable / DocumentTable / Lov 弹窗表格共用基础结构） */
export interface MxColumn {
  /** 数据字段名（EP 映射为 prop，antdv 映射为 dataIndex） */
  dataIndex: string;
  /** 列标题 */
  title: string;
  /** 列标识（默认取 dataIndex） */
  key?: string;
  width?: number | string;
  fixed?: 'left' | 'right';
  align?: 'left' | 'center' | 'right';
  /** 溢出省略 */
  ellipsis?: boolean;
  /** 特殊列：选择列 / 序号列 */
  type?: 'selection' | 'index';
  /** 表头排序（触发 sortChange 事件） */
  sortable?: boolean;
  /** 列级扩展信息（业务透传，适配器原样保留） */
  [key: string]: unknown;
}

/** 统一分页状态（对齐 hooks useTable 的 pagination 结构，缺 onChange） */
export interface MxPaginationState {
  current: number;
  size: number;
  total: number;
}

/** 统一行选择受控状态（antdv rowSelection 语义） */
export interface MxRowSelection {
  selectedRowKeys: Array<string | number>;
  onChange: (keys: Array<string | number>, rows: Array<Record<string, unknown>>) => void;
}

/** 统一树节点结构（value 即 key） */
export interface MxTreeNode {
  key: string | number;
  title: string;
  disabled?: boolean;
  children?: MxTreeNode[];
}

/** 统一上传文件项（antdv UploadFile 语义为基准） */
export interface MxUploadItem {
  uid?: string | number;
  name: string;
  status?: 'uploading' | 'done' | 'error';
  url?: string;
  response?: unknown;
  [key: string]: unknown;
}

/**
 * UI 适配器接口：原子能力 → 统一契约组件映射。
 *
 * 新增组件涉及新 UI 库原子能力时，先扩本接口，再在 antdv.ts / element-plus.ts 两套实现中同步落地；
 * 只改一套实现视为未完成。
 */
export interface UiAdapter {
  /** 适配器标识（antdv / element-plus / ...） */
  name: string;
  /** 文本输入：modelValue / size / placeholder / disabled / readonly / allowClear */
  Input: Component;
  /** 下拉选择：modelValue / options / size / placeholder / disabled / allowClear / loading / multiple */
  Select: Component;
  /** 日期范围：modelValue: [string, string] | null（YYYY-MM-DD 字符串） */
  RangePicker: Component;
  /** 按钮：type('primary'|'default'|'dashed'|'text'|'link') / size / disabled / loading / danger / block */
  Button: Component;
  /**
   * 数据表格：columns / dataSource / rowKey / loading / size / pagination(MxPaginationState|false) /
   * rowSelection(MxRowSelection|false)；槽：bodyCell({ column, record, index })、empty；
   * 事件：pageChange(current, size)、sortChange(field, order)、rowClick(record, index)、
   * rowDblclick(record, index)。
   *
   * 行展开（受控契约）：expandedRowKeys 传 undefined 时整体不启用展开；
   * 传数组时启用展开列并受控——槽 expandedRow({ record, index }) 渲染展开内容，
   * 展开态变化经 update:expandedRowKeys(keys) 抛回宿主（v-model:expanded-row-keys）。
   */
  DataTable: Component;
  /** 模态框：open / title / width / footer(bool) / maskClosable / destroyOnClose；槽：default、footer */
  Modal: Component;
  /** 抽屉：open / title / width / destroyOnClose；槽：default */
  Drawer: Component;
  /** 上传：action / accept / multiple / maxCount / disabled / fileList(v-model) */
  Upload: Component;
  /** 树选择：modelValue(key 或数组) / treeData / size / placeholder / disabled / allowClear / multiple */
  TreeSelect: Component;
}

/** UI 适配器注入键：基座或业务经 app.provide(UI_ADAPTER_KEY, adapter) 覆盖默认适配器 */
export const UI_ADAPTER_KEY: InjectionKey<UiAdapter> = Symbol('UI_ADAPTER_KEY');
