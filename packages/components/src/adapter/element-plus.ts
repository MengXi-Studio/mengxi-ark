/**
 * Element Plus 适配器实现（规范 §6.3：与 antdv.ts 同步落地）。
 *
 * 与 antdv.ts 相同：UI 库组件全部经 defineAsyncComponent + 动态 import 惰性加载
 * （element-plus 为 optional peer）；外壳把 EP 组件 API 映射为统一契约（见 types.ts）。
 *
 * 使用约定：Element Plus 用户需自行引入主题样式（element-plus/dist/index.css），
 * theme 包 adapters/element-plus.scss 已把 --el-* 变量桥接到 --mx-* token。
 */
import { defineAsyncComponent, defineComponent, h } from 'vue';
import type { Component, PropType, VNode } from 'vue';
import type {
  MxColumn,
  MxPaginationState,
  MxRowSelection,
  MxSelectOption,
  MxSize,
  MxTreeNode,
  MxUploadItem,
  UiAdapter,
} from './types';

/** 动态加载 element-plus（不出现在顶层 import，保持 optional peer 语义） */
const loadEp = (): Promise<typeof import('element-plus')> => import('element-plus');

// 惰性组件引用（模块级单例）。
// 显式标注为宽松 Component：同 antdv.ts，适配器边界按 any props 渲染，避免 h() 双向推断误报。
const AsyncElInput: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElInput));
const AsyncElSelect: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElSelect));
const AsyncElOption: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElOption));
const AsyncElDatePicker: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElDatePicker));
const AsyncElButton: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElButton));
const AsyncElTable: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElTable));
const AsyncElTableColumn: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElTableColumn));
const AsyncElPagination: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElPagination));
const AsyncElDialog: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElDialog));
const AsyncElDrawer: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElDrawer));
const AsyncElUpload: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElUpload));
const AsyncElTreeSelect: Component = defineAsyncComponent(() => loadEp().then((m) => m.ElTreeSelect));

const SIZE_MAP: Record<MxSize, 'small' | 'default' | 'large'> = { sm: 'small', md: 'default', lg: 'large' };

/** 统一尺寸 → Element Plus 尺寸 */
export function mapEpSize(size?: MxSize): 'small' | 'default' | 'large' | undefined {
  return size ? SIZE_MAP[size] : undefined;
}

/** 统一按钮 type → Element Plus type（EP 无 dashed，映射为 plain default） */
export function mapEpButtonType(type: 'primary' | 'default' | 'dashed' | 'text' | 'link'): string | undefined {
  if (type === 'default' || type === 'dashed') return undefined;
  return type;
}

/** 树节点统一结构 → Element Plus el-tree-select data（value 即 key） */
export function mapEpTreeData(nodes: MxTreeNode[]): Array<Record<string, unknown>> {
  return nodes.map((node) => ({
    value: node.key,
    label: node.title,
    disabled: node.disabled,
    children: node.children ? mapEpTreeData(node.children) : undefined,
  }));
}

/** 统一契约上传项 → Element Plus file-list：status 转回 EP 语义（done→success / error→fail），uid 缺省按索引补为数字 */
const EP_STATUS_MAP: Record<string, string> = { done: 'success', error: 'fail' };

export function mapEpUploadFiles(items: MxUploadItem[] | undefined): Array<Record<string, unknown>> {
  return (items ?? []).map((item, index) => ({
    ...item,
    uid: typeof item.uid === 'number' ? item.uid : index,
    status: item.status ? (EP_STATUS_MAP[item.status] ?? item.status) : 'ready',
  }));
}

/** Element Plus 上传列表 → 统一契约（emit 方向）：status 转 antdv 语义（success→done / fail→error） */
export function normalizeEpUploadItems(items: Array<Record<string, unknown>> | undefined): MxUploadItem[] {
  const MX_STATUS_MAP: Record<string, MxUploadItem['status']> = { success: 'done', fail: 'error' };
  return (items ?? []).map((item, index) => ({
    uid: (item.uid as string | number | undefined) ?? index,
    name: String(item.name ?? ''),
    status: MX_STATUS_MAP[String(item.status)] ?? (item.status as MxUploadItem['status'] | undefined),
    url: item.url as string | undefined,
    response: item.response,
  }));
}

type RowKey = string | ((row: Record<string, unknown>) => string | number);

function resolveRowKey(rowKey: RowKey, row: Record<string, unknown>): string | number {
  return typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] as string | number);
}

// ---------- Input ----------
const EpInput = defineComponent({
  name: 'MxEpInput',
  inheritAttrs: false,
  props: {
    modelValue: { type: [String, Number] as PropType<string | number | null>, default: null },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    readonly: { type: Boolean, default: false },
    allowClear: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElInput, {
        ...attrs,
        modelValue: props.modelValue ?? '',
        size: mapEpSize(props.size),
        placeholder: props.placeholder,
        disabled: props.disabled,
        readonly: props.readonly,
        clearable: props.allowClear,
        'onUpdate:modelValue': (v: string | number) => emit('update:modelValue', v),
      }, slots);
  },
});

// ---------- Select ----------
const EpSelect = defineComponent({
  name: 'MxEpSelect',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Number, Array] as PropType<string | number | Array<string | number> | null>,
      default: null,
    },
    options: { type: Array as PropType<MxSelectOption[]>, default: () => [] },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    allowClear: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    multiple: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElSelect, {
        ...attrs,
        modelValue: props.modelValue ?? (props.multiple ? [] : undefined),
        size: mapEpSize(props.size),
        placeholder: props.placeholder,
        disabled: props.disabled,
        clearable: props.allowClear,
        loading: props.loading,
        multiple: props.multiple,
        'onUpdate:modelValue': (v: string | number | Array<string | number>) => emit('update:modelValue', v),
      }, {
        ...slots,
        default: () => [
          ...(slots.default?.() ?? []),
          ...props.options.map((option) =>
            h(AsyncElOption, {
              key: option.value,
              label: option.label,
              value: option.value,
              disabled: option.disabled,
            }),
          ),
        ],
      });
  },
});

// ---------- RangePicker ----------
const EpRangePicker = defineComponent({
  name: 'MxEpRangePicker',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Array as unknown as PropType<[string, string] | null>,
      default: null,
    },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    allowClear: { type: Boolean, default: true },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElDatePicker, {
        ...attrs,
        type: 'daterange',
        modelValue: props.modelValue ?? undefined,
        valueFormat: 'YYYY-MM-DD',
        rangeSeparator: '至',
        startPlaceholder: props.placeholder ?? '开始日期',
        endPlaceholder: props.placeholder ?? '结束日期',
        size: mapEpSize(props.size),
        disabled: props.disabled,
        clearable: props.allowClear,
        'onUpdate:modelValue': (v: [string, string] | null) => emit('update:modelValue', v),
      }, slots);
  },
});

// ---------- Button ----------
const EpButton = defineComponent({
  name: 'MxEpButton',
  inheritAttrs: false,
  props: {
    type: {
      type: String as PropType<'primary' | 'default' | 'dashed' | 'text' | 'link'>,
      default: 'default',
    },
    size: { type: String as PropType<MxSize>, default: undefined },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    danger: { type: Boolean, default: false },
    block: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElButton, {
        ...attrs,
        type: props.danger ? 'danger' : mapEpButtonType(props.type),
        plain: props.type === 'dashed' ? true : undefined,
        size: mapEpSize(props.size),
        disabled: props.disabled,
        loading: props.loading,
        // EP Button 无 block 属性：块级用 style 兜底
        style: props.block ? { width: '100%' } : undefined,
        onClick: (e: MouseEvent) => emit('click', e),
      }, slots);
  },
});

// ---------- DataTable ----------
const EpDataTable = defineComponent({
  name: 'MxEpDataTable',
  inheritAttrs: false,
  props: {
    columns: { type: Array as PropType<MxColumn[]>, required: true },
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    rowKey: { type: [String, Function] as PropType<RowKey>, default: 'id' },
    loading: { type: Boolean, default: false },
    size: { type: String as PropType<MxSize>, default: undefined },
    pagination: { type: [Object, Boolean] as PropType<MxPaginationState | false>, default: false },
    rowSelection: { type: [Object, Boolean] as PropType<MxRowSelection | false>, default: false },
    /** 受控行展开 keys：undefined = 不启用展开；启用时内部插入 type="expand" 列渲染 expandedRow 槽 */
    expandedRowKeys: { type: Array as PropType<Array<string | number> | undefined>, default: undefined },
  },
  emits: ['pageChange', 'sortChange', 'rowClick', 'rowDblclick', 'update:expandedRowKeys'],
  setup(props, { attrs, emit, slots }) {
    function getKey(row: Record<string, unknown>): string | number {
      return resolveRowKey(props.rowKey, row);
    }
    return () => {
      // 局部变量收窄：props.pagination 在闭包内不保留窄化结果
      const pagination = props.pagination;
      // 行展开受控契约：启用时在列首插入 type="expand" 列，展开内容由统一槽 expandedRow 渲染
      const expandedKeys = props.expandedRowKeys;
      const expandEnabled = expandedKeys !== undefined && slots.expandedRow !== undefined;
      const columnNodes: VNode[] = [];
      if (expandEnabled) {
        columnNodes.push(
          h(AsyncElTableColumn, {
            key: '__mx_expand',
            type: 'expand',
            width: 48,
          }, {
            default: (scope: { row: Record<string, unknown>; $index: number }) =>
              slots.expandedRow?.({ record: scope.row, index: scope.$index }),
          }),
        );
      }
      columnNodes.push(...props.columns.map((col) => {
        const colKey = (col.key ?? col.dataIndex) as string;
        if (col.type === 'selection') {
          return h(AsyncElTableColumn, { key: colKey, type: 'selection', width: col.width ?? 48, reserveSelection: true });
        }
        if (col.type === 'index') {
          return h(AsyncElTableColumn, {
            key: colKey,
            type: 'index',
            label: col.title,
            width: col.width ?? 60,
            align: col.align,
          });
        }
        return h(AsyncElTableColumn, {
          key: colKey,
          prop: col.dataIndex,
          label: col.title,
          width: col.width,
          fixed: col.fixed,
          align: col.align,
          showOverflowTooltip: col.ellipsis,
          sortable: col.sortable ? 'custom' : false,
        }, slots.bodyCell
          ? {
              default: (scope: { row: Record<string, unknown>; $index: number }) =>
                slots.bodyCell?.({
                  column: { dataIndex: col.dataIndex, title: col.title },
                  record: scope.row,
                  index: scope.$index,
                }),
            }
          : undefined);
      }));

      const tableNode = h(AsyncElTable, {
        ...attrs,
        data: props.dataSource,
        // EP rowKey 仅接受 string 返回值，统一契约的 number key 转字符串
        rowKey: (row: Record<string, unknown>) => String(getKey(row)),
        size: props.size ? 'default' : undefined,
        // 行展开受控：EP expand-row-keys 以 rowKey 函数结果（字符串）匹配
        ...(expandEnabled
          ? {
              expandRowKeys: (expandedKeys ?? []).map(String),
              onExpandChange: (
                _row: Record<string, unknown>,
                expandedRows: Array<Record<string, unknown>>,
              ) => emit('update:expandedRowKeys', expandedRows.map((row) => getKey(row))),
            }
          : {}),
        onSortChange: ({ prop, order }: { prop: string; order?: string }) => {
          if (prop && order) emit('sortChange', prop, order === 'descending' ? 'desc' : 'asc');
        },
        onSelectionChange: (rows: Array<Record<string, unknown>>) => {
          if (props.rowSelection !== false) {
            props.rowSelection.onChange(rows.map((row) => getKey(row)), rows);
          }
        },
        onRowClick: (row: Record<string, unknown>, _column: unknown, _event: Event) => {
          const index = props.dataSource.indexOf(row);
          emit('rowClick', row, index);
        },
        onRowDblclick: (row: Record<string, unknown>, _column: unknown, _event: Event) => {
          const index = props.dataSource.indexOf(row);
          emit('rowDblclick', row, index);
        },
      }, {
        default: () => columnNodes,
        empty: () => slots.empty?.(),
      });

      const bodyNodes: VNode[] = [tableNode];
      if (props.loading) {
        bodyNodes.push(
          h('div', {
            class: 'mx-ep-datatable__loading',
            style: 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:var(--mx-color-bg-container);opacity:.72;z-index:var(--mx-z-base);color:var(--mx-color-text-secondary);font-size:var(--mx-font-size-sm);',
          }, '加载中…'),
        );
      }
      if (pagination !== false) {
        bodyNodes.push(
          h('div', {
            class: 'mx-ep-datatable__pager',
            style: 'display:flex;justify-content:flex-end;padding-top:var(--mx-spacing-sm);',
          }, h(AsyncElPagination, {
            currentPage: pagination.current,
            pageSize: pagination.size,
            total: pagination.total,
            pageSizes: [10, 20, 50, 100],
            layout: 'total, sizes, prev, pager, next',
            background: true,
            'onUpdate:currentPage': (current: number) => emit('pageChange', current, pagination.size),
            'onUpdate:pageSize': (size: number) => emit('pageChange', pagination.current, size),
          })),
        );
      }
      return h('div', {
        class: 'mx-ep-datatable',
        style: 'position:relative;',
      }, bodyNodes);
    };
  },
});

// ---------- Modal ----------
const EpModal = defineComponent({
  name: 'MxEpModal',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: [Number, String], default: 520 },
    footer: { type: Boolean, default: true },
    maskClosable: { type: Boolean, default: true },
    destroyOnClose: { type: Boolean, default: true },
  },
  emits: ['update:open', 'ok', 'cancel'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElDialog, {
        ...attrs,
        modelValue: props.open,
        title: props.title,
        width: props.width,
        closeOnClickModal: props.maskClosable,
        destroyOnClose: props.destroyOnClose,
        'onUpdate:modelValue': (v: boolean) => emit('update:open', v),
      }, {
        default: slots.default,
        footer: () => {
          if (slots.footer) return slots.footer();
          if (!props.footer) return null;
          return [
            h(AsyncElButton, { key: 'cancel', onClick: () => { emit('cancel'); emit('update:open', false); } }, { default: () => '取消' }),
            h(AsyncElButton, { key: 'ok', type: 'primary', onClick: () => emit('ok') }, { default: () => '确定' }),
          ];
        },
      });
  },
});

// ---------- Drawer ----------
const EpDrawer = defineComponent({
  name: 'MxEpDrawer',
  inheritAttrs: false,
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: [Number, String], default: 520 },
    destroyOnClose: { type: Boolean, default: true },
  },
  emits: ['update:open'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElDrawer, {
        ...attrs,
        modelValue: props.open,
        title: props.title,
        size: props.width,
        destroyOnClose: props.destroyOnClose,
        'onUpdate:modelValue': (v: boolean) => emit('update:open', v),
      }, slots);
  },
});

// ---------- Upload ----------
const EpUpload = defineComponent({
  name: 'MxEpUpload',
  inheritAttrs: false,
  props: {
    action: { type: String, default: undefined },
    accept: { type: String, default: undefined },
    multiple: { type: Boolean, default: false },
    maxCount: { type: Number, default: undefined },
    disabled: { type: Boolean, default: false },
    fileList: { type: Array as PropType<MxUploadItem[]>, default: () => [] },
  },
  emits: ['update:fileList'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElUpload, {
        ...attrs,
        action: props.action,
        accept: props.accept,
        multiple: props.multiple,
        limit: props.maxCount,
        disabled: props.disabled,
        fileList: mapEpUploadFiles(props.fileList),
        'onUpdate:fileList': (v: Array<Record<string, unknown>> | undefined) =>
          emit('update:fileList', normalizeEpUploadItems(v)),
      }, slots);
  },
});

// ---------- TreeSelect ----------
const EpTreeSelect = defineComponent({
  name: 'MxEpTreeSelect',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: [String, Number, Array] as PropType<string | number | Array<string | number> | null>,
      default: null,
    },
    treeData: { type: Array as PropType<MxTreeNode[]>, default: () => [] },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    allowClear: { type: Boolean, default: true },
    multiple: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(AsyncElTreeSelect, {
        ...attrs,
        modelValue: props.modelValue ?? undefined,
        data: mapEpTreeData(props.treeData),
        size: mapEpSize(props.size),
        placeholder: props.placeholder,
        disabled: props.disabled,
        clearable: props.allowClear,
        multiple: props.multiple,
        renderAfterExpand: false,
        defaultExpandAll: true,
        'onUpdate:modelValue': (v: string | number | Array<string | number>) => emit('update:modelValue', v),
      }, slots);
  },
});

/**
 * 创建 Element Plus 适配器实例（统一契约外壳映射，见 types.ts）。
 */
export function createElementPlusAdapter(): UiAdapter {
  return {
    name: 'element-plus',
    Input: EpInput,
    Select: EpSelect,
    RangePicker: EpRangePicker,
    Button: EpButton,
    DataTable: EpDataTable,
    Modal: EpModal,
    Drawer: EpDrawer,
    Upload: EpUpload,
    TreeSelect: EpTreeSelect,
  };
}
