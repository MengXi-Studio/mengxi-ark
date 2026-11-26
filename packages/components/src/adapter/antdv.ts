/**
 * Ant Design Vue 适配器实现（默认适配器，规范 §6.3）。
 *
 * 全部 UI 库组件经 defineAsyncComponent + 动态 import 惰性加载：
 * ant-design-vue 为 optional peer，未安装时仅在渲染适配器能力的组件时才会触发加载失败，
 * 纯展示件（EmptyState / StatusTag / ResultPage）与类型导入不受影响。
 *
 * 外壳把 antdv 组件 API 映射为统一契约（见 types.ts）：modelValue 受控、size 语义、
 * Select options、DataTable columns/pagination/rowSelection/bodyCell 槽等。
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

/** 动态加载 ant-design-vue（不出现在顶层 import，保持 optional peer 语义） */
const loadAntd = (): Promise<typeof import('ant-design-vue')> => import('ant-design-vue');

// 惰性组件引用（模块级单例，避免每次渲染重建）。
// 显式标注为宽松 Component：antdv 的 props 类型与统一契约外壳不逐字段重合，
// 保留强类型会让 h() 双向推断产生大量误报，适配器边界按 any props 渲染。
const AsyncInput: Component = defineAsyncComponent(() => loadAntd().then((m) => m.Input));
const AsyncSelect: Component = defineAsyncComponent(() => loadAntd().then((m) => m.Select));
const AsyncDatePicker: Component = defineAsyncComponent(() => loadAntd().then((m) => m.DatePicker));
const AsyncButton: Component = defineAsyncComponent(() => loadAntd().then((m) => m.Button));
const AsyncTable: Component = defineAsyncComponent(() => loadAntd().then((m) => m.Table));
const AsyncModal: Component = defineAsyncComponent(() => loadAntd().then((m) => m.Modal));
const AsyncDrawer: Component = defineAsyncComponent(() => loadAntd().then((m) => m.Drawer));
const AsyncUpload: Component = defineAsyncComponent(() => loadAntd().then((m) => m.Upload));
const AsyncTreeSelect: Component = defineAsyncComponent(() => loadAntd().then((m) => m.TreeSelect));

const SIZE_MAP: Record<MxSize, 'small' | 'middle' | 'large'> = { sm: 'small', md: 'middle', lg: 'large' };

/** 统一尺寸 → antdv 尺寸 */
export function mapAntdvSize(size?: MxSize): 'small' | 'middle' | 'large' | undefined {
  return size ? SIZE_MAP[size] : undefined;
}

type RowKey = string | ((row: Record<string, unknown>) => string | number);

function resolveRowKey(rowKey: RowKey, row: Record<string, unknown>): string | number {
  return typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] as string | number);
}

/** 树节点统一结构 → antdv TreeSelect treeData（value 即 key） */
export function mapAntdvTreeData(nodes: MxTreeNode[]): Array<Record<string, unknown>> {
  return nodes.map((node) => ({
    value: node.key,
    title: node.title,
    disabled: node.disabled,
    children: node.children ? mapAntdvTreeData(node.children) : undefined,
  }));
}

// ---------- Input ----------
const AntdvInput = defineComponent({
  name: 'MxAntdvInput',
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
      h(AsyncInput, {
        ...attrs,
        value: props.modelValue ?? '',
        size: mapAntdvSize(props.size),
        placeholder: props.placeholder,
        disabled: props.disabled,
        readonly: props.readonly,
        allowClear: props.allowClear,
        'onUpdate:value': (v: string | number) => emit('update:modelValue', v),
      }, slots);
  },
});

// ---------- Select ----------
const AntdvSelect = defineComponent({
  name: 'MxAntdvSelect',
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
      h(AsyncSelect, {
        ...attrs,
        value: props.modelValue ?? undefined,
        options: props.options,
        size: mapAntdvSize(props.size),
        placeholder: props.placeholder,
        disabled: props.disabled,
        allowClear: props.allowClear,
        loading: props.loading,
        mode: props.multiple ? 'multiple' : undefined,
        'onUpdate:value': (v: string | number | Array<string | number>) => emit('update:modelValue', v),
      }, slots);
  },
});

// ---------- RangePicker ----------
const AntdvRangePicker = defineComponent({
  name: 'MxAntdvRangePicker',
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
      h(AsyncDatePicker, {
        ...attrs,
        picker: 'range',
        value: props.modelValue ?? undefined,
        valueFormat: 'YYYY-MM-DD',
        size: mapAntdvSize(props.size),
        placeholder: props.placeholder ? [props.placeholder, props.placeholder] : undefined,
        disabled: props.disabled,
        allowClear: props.allowClear,
        'onUpdate:value': (v: [string, string] | null) => emit('update:modelValue', v),
      }, slots);
  },
});

// ---------- Button ----------
const AntdvButton = defineComponent({
  name: 'MxAntdvButton',
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
      h(AsyncButton, {
        ...attrs,
        type: props.type,
        size: mapAntdvSize(props.size),
        disabled: props.disabled,
        loading: props.loading,
        danger: props.danger,
        block: props.block,
        onClick: (e: MouseEvent) => emit('click', e),
      }, slots);
  },
});

// ---------- DataTable ----------
const AntdvDataTable = defineComponent({
  name: 'MxAntdvDataTable',
  inheritAttrs: false,
  props: {
    columns: { type: Array as PropType<MxColumn[]>, required: true },
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    rowKey: { type: [String, Function] as PropType<RowKey>, default: 'id' },
    loading: { type: Boolean, default: false },
    size: { type: String as PropType<MxSize>, default: undefined },
    pagination: { type: [Object, Boolean] as PropType<MxPaginationState | false>, default: false },
    rowSelection: { type: [Object, Boolean] as PropType<MxRowSelection | false>, default: false },
    /** 受控行展开 keys：undefined = 不启用展开；启用时经 expandedRowRender 槽渲染展开内容 */
    expandedRowKeys: { type: Array as PropType<Array<string | number> | undefined>, default: undefined },
  },
  emits: ['pageChange', 'sortChange', 'rowClick', 'rowDblclick', 'update:expandedRowKeys'],
  setup(props, { attrs, emit, slots }) {
    function handleTableChange(
      _pagination: unknown,
      _filters: unknown,
      sorter: { field?: unknown; order?: string },
    ): void {
      if (sorter && sorter.field && sorter.order) {
        emit('sortChange', String(sorter.field), sorter.order === 'descend' ? 'desc' : 'asc');
      }
    }
    return () => {
      const columns = props.columns.map((col) => ({ ...col, key: col.key ?? col.dataIndex }));
      // 局部变量收窄：props.rowSelection 在箭头函数闭包内不保留窄化结果
      const selection = props.rowSelection;
      const pagination = props.pagination === false
        ? false
        : {
            current: props.pagination.current,
            pageSize: props.pagination.size,
            total: props.pagination.total,
            showSizeChanger: true,
            onChange: (current: number, size: number) => emit('pageChange', current, size),
          };
      const rowSelection = selection === false
        ? undefined
        : {
            selectedRowKeys: selection.selectedRowKeys,
            preserveSelectedRowKeys: true,
            onChange: (keys: Array<string | number>, rows: Array<Record<string, unknown>>) =>
              selection.onChange(keys, rows),
          };
      // 行展开受控契约：启用时透传 expandedRowKeys 并把统一槽 expandedRow 映射为 antdv expandedRowRender。
      // childrenColumnName 传哑键：显式禁用 antdv 树形嵌套语义（数据行 children 字段会被 antdv 当作
      // 树形数据，触发 expandedRowRender 冲突告警与 expandIconColumnIndex 弃用告警）；
      // 统一契约的行展开完全由 expandedRowKeys 受控驱动，不做树形表格。
      const expandedKeys = props.expandedRowKeys;
      const expandEnabled = expandedKeys !== undefined && slots.expandedRow !== undefined;
      const expandProps = expandEnabled
        ? {
            childrenColumnName: '__mx_expand_no_nesting',
            expandedRowKeys: expandedKeys,
            'onUpdate:expandedRowKeys': (keys: Array<string | number>) =>
              emit('update:expandedRowKeys', keys),
          }
        : {};
      const tableSlots = expandEnabled
        ? {
            ...slots,
            expandedRowRender: (scope: { record: Record<string, unknown>; index: number }) =>
              slots.expandedRow?.({ record: scope.record, index: scope.index }),
          }
        : slots;
      return h(AsyncTable, {
        ...attrs,
        columns,
        dataSource: props.dataSource,
        rowKey: (row: Record<string, unknown>) => resolveRowKey(props.rowKey, row),
        loading: props.loading,
        size: mapAntdvSize(props.size),
        pagination,
        rowSelection,
        onChange: handleTableChange,
        customRow: (record: Record<string, unknown>, index: number) => ({
          onClick: () => emit('rowClick', record, index),
          onDblclick: () => emit('rowDblclick', record, index),
        }),
        ...expandProps,
      }, tableSlots as unknown as Record<string, ((...args: unknown[]) => VNode | VNode[]) | undefined>);
    };
  },
});

// ---------- Modal ----------
const AntdvModal = defineComponent({
  name: 'MxAntdvModal',
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
      h(AsyncModal, {
        ...attrs,
        open: props.open,
        title: props.title,
        width: props.width,
        footer: props.footer ? undefined : null,
        maskClosable: props.maskClosable,
        destroyOnClose: props.destroyOnClose,
        'onUpdate:open': (v: boolean) => emit('update:open', v),
        onOk: () => emit('ok'),
        onCancel: () => emit('cancel'),
      }, slots);
  },
});

// ---------- Drawer ----------
const AntdvDrawer = defineComponent({
  name: 'MxAntdvDrawer',
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
      h(AsyncDrawer, {
        ...attrs,
        open: props.open,
        title: props.title,
        width: props.width,
        destroyOnClose: props.destroyOnClose,
        'onUpdate:open': (v: boolean) => emit('update:open', v),
      }, slots);
  },
});

// ---------- Upload ----------
const AntdvUpload = defineComponent({
  name: 'MxAntdvUpload',
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
      h(AsyncUpload, {
        ...attrs,
        action: props.action,
        accept: props.accept,
        multiple: props.multiple,
        maxCount: props.maxCount,
        disabled: props.disabled,
        fileList: props.fileList,
        'onUpdate:fileList': (v: MxUploadItem[] | undefined) => emit('update:fileList', v ?? []),
      }, slots);
  },
});

// ---------- TreeSelect ----------
const AntdvTreeSelect = defineComponent({
  name: 'MxAntdvTreeSelect',
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
      h(AsyncTreeSelect, {
        ...attrs,
        value: props.modelValue ?? undefined,
        treeData: mapAntdvTreeData(props.treeData),
        size: mapAntdvSize(props.size),
        placeholder: props.placeholder,
        disabled: props.disabled,
        allowClear: props.allowClear,
        multiple: props.multiple,
        treeDefaultExpandAll: true,
        'onUpdate:value': (v: string | number | Array<string | number>) => emit('update:modelValue', v),
      }, slots);
  },
});

/**
 * 创建 Ant Design Vue 适配器实例（统一契约外壳映射，见 types.ts）。
 */
export function createAntdvAdapter(): UiAdapter {
  return {
    name: 'antdv',
    Input: AntdvInput,
    Select: AntdvSelect,
    RangePicker: AntdvRangePicker,
    Button: AntdvButton,
    DataTable: AntdvDataTable,
    Modal: AntdvModal,
    Drawer: AntdvDrawer,
    Upload: AntdvUpload,
    TreeSelect: AntdvTreeSelect,
  };
}
