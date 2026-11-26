/**
 * 测试用统一契约 stub 适配器（dsl-render 副本，与 components / biz-components 同步维护）：
 * 不依赖任何 UI 库，按统一契约渲染可交互的原生元素 / 可触发的 emits。
 */
import { defineComponent, h } from 'vue';
import type { PropType } from 'vue';
import type {
  MxColumn,
  MxPaginationState,
  MxRowSelection,
  MxSelectOption,
  MxSize,
  MxTreeNode,
  MxUploadItem,
  UiAdapter,
} from '@mengxi-ark/components';

const StubInput = defineComponent({
  name: 'StubInput',
  props: {
    modelValue: { type: [String, Number], default: null },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        class: 'stub-input',
        value: String(props.modelValue ?? ''),
        placeholder: props.placeholder,
        disabled: props.disabled,
        onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value),
      });
  },
});

const StubSelect = defineComponent({
  name: 'StubSelect',
  props: {
    modelValue: { type: [String, Number, Array] as PropType<string | number | Array<string | number> | null>, default: null },
    options: { type: Array as PropType<MxSelectOption[]>, default: () => [] },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h(
        'select',
        {
          class: 'stub-select',
          disabled: props.disabled,
          onChange: (e: Event) => {
            const value = (e.target as HTMLSelectElement).value;
            emit('update:modelValue', value === '' ? undefined : value);
          },
        },
        [
          h('option', { value: '' }, props.placeholder ?? '请选择'),
          ...props.options.map((option) => h('option', { value: option.value }, option.label)),
        ],
      );
  },
});

const StubRangePicker = defineComponent({
  name: 'StubRangePicker',
  props: {
    modelValue: { type: Array as unknown as PropType<[string, string] | null>, default: null },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup(props) {
    return () => h('div', { class: 'stub-range-picker' }, props.modelValue ? props.modelValue.join(' ~ ') : props.placeholder ?? '请选择日期范围');
  },
});

const StubButton = defineComponent({
  name: 'StubButton',
  props: {
    type: { type: String as PropType<'primary' | 'default' | 'dashed' | 'text' | 'link'>, default: 'default' },
    size: { type: String as PropType<MxSize>, default: undefined },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
  },
  emits: ['click'],
  setup(props, { emit, slots }) {
    return () =>
      h(
        'button',
        {
          class: `stub-button stub-button--${props.type}`,
          type: 'button',
          disabled: props.disabled || props.loading,
          onClick: (e: MouseEvent) => emit('click', e),
        },
        slots.default?.(),
      );
  },
});

const StubDataTable = defineComponent({
  name: 'StubDataTable',
  props: {
    columns: { type: Array as PropType<MxColumn[]>, required: true },
    dataSource: { type: Array as PropType<Record<string, unknown>[]>, default: () => [] },
    rowKey: { type: [String, Function], default: 'id' },
    loading: { type: Boolean, default: false },
    size: { type: String as PropType<MxSize>, default: undefined },
    pagination: { type: [Object, Boolean] as PropType<MxPaginationState | false>, default: false },
    rowSelection: { type: [Object, Boolean] as PropType<MxRowSelection | false>, default: false },
    expandedRowKeys: { type: Array as PropType<Array<string | number> | undefined>, default: undefined },
  },
  emits: ['pageChange', 'sortChange', 'rowClick', 'rowDblclick', 'update:expandedRowKeys'],
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'stub-datatable' }, [
        h('span', { class: 'stub-datatable__count' }, String(props.dataSource.length)),
        ...props.dataSource.map((record, index) =>
          h(
            'div',
            { class: `stub-datatable__cell stub-datatable__cell--${String(record.id ?? index)}`, key: index },
            props.columns.map((col) =>
              h(
                'div',
                { class: `stub-datatable__col stub-datatable__col--${col.dataIndex}`, key: String(col.dataIndex) },
                [slots.bodyCell?.({ column: { dataIndex: col.dataIndex, title: col.title }, record, index })],
              ),
            ),
          ),
        ),
        props.dataSource.length === 0 ? slots.empty?.() : null,
      ]);
  },
});

const StubModal = defineComponent({
  name: 'StubModal',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: [Number, String], default: 520 },
    footer: { type: Boolean, default: true },
    maskClosable: { type: Boolean, default: true },
    destroyOnClose: { type: Boolean, default: true },
  },
  emits: ['update:open', 'ok', 'cancel'],
  setup(props, { emit, slots }) {
    return () =>
      props.open
        ? h('div', { class: 'stub-modal' }, [
            h('span', { class: 'stub-modal__title' }, props.title),
            slots.default?.(),
            props.footer
              ? slots.footer?.() ?? [
                  h('button', { class: 'stub-modal__cancel', type: 'button', onClick: () => emit('cancel') }, '取消'),
                  h('button', { class: 'stub-modal__ok', type: 'button', onClick: () => emit('ok') }, '确定'),
                ]
              : null,
          ])
        : null;
  },
});

const StubDrawer = defineComponent({
  name: 'StubDrawer',
  props: {
    open: { type: Boolean, default: false },
    title: { type: String, default: '' },
    width: { type: [Number, String], default: 520 },
    destroyOnClose: { type: Boolean, default: true },
  },
  emits: ['update:open'],
  setup(props, { slots }) {
    return () => (props.open ? h('div', { class: 'stub-drawer' }, [h('span', { class: 'stub-drawer__title' }, props.title), slots.default?.()]) : null);
  },
});

const StubUpload = defineComponent({
  name: 'StubUpload',
  props: {
    action: { type: String, default: undefined },
    accept: { type: String, default: undefined },
    multiple: { type: Boolean, default: false },
    maxCount: { type: Number, default: undefined },
    disabled: { type: Boolean, default: false },
    fileList: { type: Array as PropType<MxUploadItem[]>, default: () => [] },
  },
  emits: ['update:fileList'],
  setup(props, { slots }) {
    return () => h('div', { class: 'stub-upload' }, [h('span', { class: 'stub-upload__count' }, String(props.fileList.length)), slots.default?.()]);
  },
});

const StubTreeSelect = defineComponent({
  name: 'StubTreeSelect',
  props: {
    modelValue: { type: [String, Number, Array] as PropType<string | number | Array<string | number> | null>, default: null },
    treeData: { type: Array as PropType<MxTreeNode[]>, default: () => [] },
    size: { type: String as PropType<MxSize>, default: undefined },
    placeholder: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    allowClear: { type: Boolean, default: true },
    multiple: { type: Boolean, default: false },
  },
  emits: ['update:modelValue'],
  setup() {
    return () => h('div', { class: 'stub-tree-select' });
  },
});

/** 构造统一契约 stub 适配器（组件测试用，不依赖任何 UI 库） */
export function makeStubAdapter(): UiAdapter {
  return {
    name: 'stub',
    Input: StubInput,
    Select: StubSelect,
    RangePicker: StubRangePicker,
    Button: StubButton,
    DataTable: StubDataTable,
    Modal: StubModal,
    Drawer: StubDrawer,
    Upload: StubUpload,
    TreeSelect: StubTreeSelect,
  };
}
