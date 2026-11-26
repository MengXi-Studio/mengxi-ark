/**
 * EnhanceTable 增强表格 Props / Emits / Slots 契约。
 * 数据外部驱动（配合 hooks useTable 的返回值使用），内部经 UI 适配器 DataTable 能力渲染。
 */
import type { MxColumn, MxPaginationState, MxRowSelection, MxSize } from '../adapter/types';

export interface EnhanceTableProps {
  /** 列配置（必填） */
  columns: MxColumn[];
  /** 当页数据 */
  dataSource?: Array<Record<string, unknown>>;
  /** 行 key 字段名或取值函数，默认 'id' */
  rowKey?: string | ((row: Record<string, unknown>) => string | number);
  /** 加载中 */
  loading?: boolean;
  /** 尺寸语义（sm | md | lg） */
  size?: MxSize;
  /** 分页状态（false 关闭分页），结构对齐 useTable 的 pagination */
  pagination?: MxPaginationState | false;
  /** 行选择受控状态（false 关闭） */
  rowSelection?: MxRowSelection | false;
  /** 受控行展开 keys（undefined 不启用展开；展开内容经 expandedRow 槽渲染，v-model:expanded-row-keys） */
  expandedRowKeys?: Array<string | number> | undefined;
  /** 空状态描述文案，默认「暂无数据」 */
  emptyText?: string;
}

export interface EnhanceTableEmits {
  /** 页码 / 每页条数变更 */
  (e: 'pageChange', current: number, size: number): void;
  /** 表头排序变更 */
  (e: 'sortChange', field: string, order: 'asc' | 'desc'): void;
  /** 行点击 */
  (e: 'rowClick', record: Record<string, unknown>, index: number): void;
  /** 展开行变化（expandedRowKeys 受控回抛） */
  (e: 'update:expandedRowKeys', keys: Array<string | number>): void;
}

export interface EnhanceTableSlots {
  /** 工具栏（表格上方，与查询区配合） */
  toolbar?: () => unknown;
  /** 单元格自定义渲染 */
  bodyCell?: (binding: { column: { dataIndex: string; title: string }; record: Record<string, unknown>; index: number }) => unknown;
  /** 行展开内容（子表 / 任意内容由业务在槽内组合） */
  expandedRow?: (binding: { record: Record<string, unknown>; index: number }) => unknown;
  /** 空状态自定义（默认 EmptyState + emptyText） */
  empty?: () => unknown;
}
