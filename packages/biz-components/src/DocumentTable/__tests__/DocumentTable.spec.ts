import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import { UI_ADAPTER_KEY } from '@mengxi-ark/components';
import { makeStubAdapter } from '../../__tests__/stub-adapter';
import { MX_RUNTIME_CONTEXT_KEY } from '../../context/resolve';
import { createTempRowKey, validateCell, validateRows } from '../adapter';
import DocumentTable from '../DocumentTable.vue';
import type { DocColumn } from '../types';

const stubAdapter = makeStubAdapter();

const columns: DocColumn[] = [
  { dataIndex: 'name', title: '名称', editable: true, rules: [{ required: true }] },
  {
    dataIndex: 'level',
    title: '级别',
    editable: true,
    editorType: 'select',
    editorOptions: [
      { label: '高', value: 'H' },
      { label: '低', value: 'L' },
    ],
  },
];

function mountTable(modelValue: Array<Record<string, unknown>> = []) {
  // 组件为 props 驱动契约：模拟 v-model，update:modelValue 回写响应式数据源
  const rows = reactive(modelValue.map((row) => ({ ...row })));
  return mount(DocumentTable, {
    props: {
      columns,
      modelValue: rows as Array<Record<string, unknown>>,
      'onUpdate:modelValue': (v: Array<Record<string, unknown>>) => {
        rows.splice(0, rows.length, ...v);
      },
    },
    global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } },
  });
}

describe('校验纯函数', () => {
  it('validateCell：required 空值返回错误文案', () => {
    const rule = { required: true, message: '名称不能为空' };
    expect(validateCell(rule, '', {})).toBe('名称不能为空');
    expect(validateCell(rule, '张三', {})).toBeNull();
  });

  it('validateCell：validator 自定义校验', () => {
    const rule = { validator: (v: unknown) => (v === 'bad' ? '不允许的值' : null) };
    expect(validateCell(rule, 'bad', {})).toBe('不允许的值');
    expect(validateCell(rule, 'ok', {})).toBeNull();
  });

  it('validateRows：按 rowKey 聚合错误', () => {
    const errors = validateRows(
      [
        { id: '1', name: '', level: 'H' },
        { id: '2', name: '张三', level: 'H' },
      ],
      columns,
      'id',
    );
    expect(Object.keys(errors)).toEqual(['1']);
    expect(errors['1'].name).toBeTruthy();
  });

  it('createTempRowKey：生成唯一临时 key', () => {
    const a = createTempRowKey();
    const b = createTempRowKey();
    expect(a).toMatch(/^__mx_row_/);
    expect(a).not.toBe(b);
  });
});

describe('DocumentTable 行编辑', () => {
  it('新增行：追加数据、自动进入编辑态并抛 rowAdd', async () => {
    const wrapper = mountTable();
    const addButton = wrapper.findAll('.stub-button').at(0)!;
    expect(addButton.text()).toBe('新增行');
    await addButton.trigger('click');
    const emitted = wrapper.emitted('update:modelValue')![0][0] as Array<Record<string, unknown>>;
    expect(emitted).toHaveLength(1);
    expect(String(emitted[0].id)).toMatch(/^__mx_row_/);
    expect(wrapper.emitted('rowAdd')).toBeTruthy();
    // 新增行自动进入编辑态（渲染行内 input 编辑器）
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.stub-input').exists()).toBe(true);
  });

  it('编辑值变更：setCellValue 抛 update:modelValue 且校验通过后保存抛全量数据', async () => {
    const wrapper = mountTable([{ id: 'r1', name: '初始', level: 'H' }]);
    // 进入编辑态（模拟双击行）
    const table = wrapper.findComponent({ name: 'StubDataTable' });
    table.vm.$emit('rowDblclick', { id: 'r1', name: '初始', level: 'H' }, 0);
    await wrapper.vm.$nextTick();
    await wrapper.find('.stub-input').setValue('张三');
    const updated = wrapper.emitted('update:modelValue')!.at(-1)![0] as Array<Record<string, unknown>>;
    expect(updated[0].name).toBe('张三');
    // 保存：校验通过 → save 事件抛全量单据数据
    const saveButton = wrapper.findAll('.stub-button').at(1)!;
    expect(saveButton.text()).toBe('保存');
    await saveButton.trigger('click');
    const save = wrapper.emitted('save')![0][0] as Array<Record<string, unknown>>;
    expect(save[0]).toMatchObject({ id: 'r1', name: '张三', level: 'H' });
  });

  it('校验未通过：阻断 save 事件并标记错误', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mountTable([{ id: 'r1', name: '', level: 'H' }]);
    const table = wrapper.findComponent({ name: 'StubDataTable' });
    table.vm.$emit('rowDblclick', { id: 'r1', name: '', level: 'H' }, 0);
    await wrapper.vm.$nextTick();
    await wrapper.findAll('.stub-button').at(1)!.trigger('click');
    expect(wrapper.emitted('save')).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('校验未通过'));
    // 错误文案已标记在编辑器下方
    expect(wrapper.find('.mx-doc-table__error').exists()).toBe(true);
    warn.mockRestore();
  });

  it('删除行：移除数据并抛 rowRemove', async () => {
    const wrapper = mountTable([{ id: 'r1', name: '张三', level: 'H' }]);
    const removeButton = wrapper.findAll('.stub-button').find((b) => b.text() === '删除');
    expect(removeButton).toBeTruthy();
    await removeButton!.trigger('click');
    expect((wrapper.emitted('update:modelValue')![0][0] as unknown[]).length).toBe(0);
    expect(wrapper.emitted('rowRemove')![0][0]).toMatchObject({ id: 'r1' });
  });

  it('select 编辑器：editorOptions 渲染下拉选项', async () => {
    const wrapper = mountTable([{ id: 'r1', name: '张三', level: 'H' }]);
    const table = wrapper.findComponent({ name: 'StubDataTable' });
    table.vm.$emit('rowDblclick', { id: 'r1', name: '张三', level: 'H' }, 0);
    await wrapper.vm.$nextTick();
    const select = wrapper.find('.stub-select');
    expect(select.exists()).toBe(true);
    expect(select.findAll('option').map((o) => o.text())).toEqual(expect.arrayContaining(['高', '低']));
  });

  it('expandedRowKeys 受控行展开：expandedRow 槽透传并回抛展开变化', async () => {
    const rows = reactive([{ id: 'r1', name: '张三', level: 'H' }]) as unknown as Array<Record<string, unknown>>;
    const wrapper = mount(DocumentTable, {
      props: {
        columns,
        modelValue: rows as Array<Record<string, unknown>>,
        expandedRowKeys: ['r1'],
        'onUpdate:modelValue': (v: Array<Record<string, unknown>>) => {
          rows.splice(0, rows.length, ...v);
        },
      },
      slots: { expandedRow: '<div class="stub-datatable__expanded-content">子单据内容</div>' },
      global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } },
    });
    await wrapper.vm.$nextTick();
    // 展开内容按行索引渲染标记节点
    const expanded = wrapper.find('.stub-datatable__expanded--0');
    expect(expanded.exists()).toBe(true);
    expect(expanded.text()).toContain('子单据内容');
    // 展开态变化经适配器表格回抛 update:expandedRowKeys
    const table = wrapper.findComponent({ name: 'StubDataTable' });
    table.vm.$emit('update:expandedRowKeys', []);
    expect(wrapper.emitted('update:expandedRowKeys')![0]).toEqual([[]]);
  });

  it('expandedRowKeys 未传（undefined）时不渲染展开内容', () => {
    const wrapper = mountTable([{ id: 'r1', name: '张三', level: 'H' }]);
    expect(wrapper.find('.stub-datatable__expanded').exists()).toBe(false);
  });
});

describe('DocumentTable 单元格级权限（M4）', () => {
  const permColumns: DocColumn[] = [
    { dataIndex: 'name', title: '名称', editable: true, permissionCode: 'doc:edit', rules: [{ required: true }] },
    { dataIndex: 'level', title: '级别', editable: true, editorType: 'select', editorOptions: [{ label: '高', value: 'H' }] },
  ];

  const mountWithPermissions = (
    permissions: string[] | undefined,
    options: { columns?: DocColumn[]; contextPermissions?: string[] } = {},
  ) => {
    const rows = reactive([{ id: 'r1', name: '', level: 'H' }]) as unknown as Array<Record<string, unknown>>;
    return mount(DocumentTable, {
      props: {
        columns: options.columns ?? permColumns,
        modelValue: rows as Array<Record<string, unknown>>,
        permissions,
        'onUpdate:modelValue': (v: Array<Record<string, unknown>>) => {
          rows.splice(0, rows.length, ...v);
        },
      },
      global: {
        provide: {
          [UI_ADAPTER_KEY as symbol]: stubAdapter,
          ...(options.contextPermissions
            ? { [MX_RUNTIME_CONTEXT_KEY as symbol]: { permissions: options.contextPermissions } }
            : {}),
        },
      },
    });
  };

  it('权限源缺失降级（Q3 方案 a）：无权限源时 warn 一次并视为有权限', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mountWithPermissions(undefined);
    const table = wrapper.findComponent({ name: 'StubDataTable' });
    table.vm.$emit('rowDblclick', { id: 'r1', name: '', level: 'H' }, 0);
    await wrapper.vm.$nextTick();
    // 降级为有权限：编辑器正常渲染
    expect(wrapper.find('.stub-input').exists()).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('权限拦截将不生效'));
    warn.mockRestore();
  });

  it('props.permissions 兜底：权限命中可编辑，未命中只读（不渲染编辑器）', async () => {
    const hit = mountWithPermissions(['doc:edit']);
    hit.findComponent({ name: 'StubDataTable' }).vm.$emit('rowDblclick', { id: 'r1', name: '', level: 'H' }, 0);
    await hit.vm.$nextTick();
    expect(hit.find('.stub-input').exists()).toBe(true);
    hit.unmount();

    const miss = mountWithPermissions(['other:code']);
    miss.findComponent({ name: 'StubDataTable' }).vm.$emit('rowDblclick', { id: 'r1', name: '', level: 'H' }, 0);
    await miss.vm.$nextTick();
    // 无权限单元格渲染只读文本（原始值兜底），不渲染编辑器；未配置 permissionCode 的列不受影响
    expect(miss.find('.stub-input').exists()).toBe(false);
    expect(miss.find('.stub-select').exists()).toBe(true);
    miss.unmount();
  });

  it('上下文 permissions 探测命中优先于 props（some 语义）', async () => {
    const wrapper = mountWithPermissions(['doc:no'], { contextPermissions: ['sys:any', 'doc:edit'] });
    wrapper.findComponent({ name: 'StubDataTable' }).vm.$emit('rowDblclick', { id: 'r1', name: '', level: 'H' }, 0);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.stub-input').exists()).toBe(true);
  });

  it('editable 函数形态：按行数据判定行级粒度', async () => {
    const rows = reactive([{ id: 'r1', name: '', level: 'H' }, { id: 'r2', name: '', level: 'L' }]) as unknown as Array<Record<string, unknown>>;
    const fnColumns: DocColumn[] = [
      { dataIndex: 'name', title: '名称', editable: (row) => row.id === 'r1' },
    ];
    const wrapper = mount(DocumentTable, {
      props: {
        columns: fnColumns,
        modelValue: rows as Array<Record<string, unknown>>,
        'onUpdate:modelValue': (v: Array<Record<string, unknown>>) => {
          rows.splice(0, rows.length, ...v);
        },
      },
      global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } },
    });
    const table = wrapper.findComponent({ name: 'StubDataTable' });
    table.vm.$emit('rowDblclick', { id: 'r1', name: '', level: 'H' }, 0);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.stub-input').exists()).toBe(true);
    wrapper.unmount();

    const wrapper2 = mount(DocumentTable, {
      props: {
        columns: fnColumns,
        modelValue: rows as Array<Record<string, unknown>>,
        'onUpdate:modelValue': (v: Array<Record<string, unknown>>) => {
          rows.splice(0, rows.length, ...v);
        },
      },
      global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } },
    });
    wrapper2.findComponent({ name: 'StubDataTable' }).vm.$emit('rowDblclick', { id: 'r2', name: '', level: 'L' }, 1);
    await wrapper2.vm.$nextTick();
    expect(wrapper2.find('.stub-input').exists()).toBe(false);
  });

  it('无权限必填列跳过校验：save 不被死锁阻断', async () => {
    const wrapper = mountWithPermissions(['other:code']);
    // name 列 required 且无权限 → 该单元格跳过校验；save 正常抛出
    await wrapper.findAll('.stub-button').at(1)!.trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
  });

  it('validateRows skip 入参：纯函数级跳过判定', () => {
    const errors = validateRows(
      [{ id: '1', name: '', level: 'H' }],
      columns,
      'id',
      (_row, dataIndex) => dataIndex === 'name',
    );
    expect(errors).toEqual({});
  });
});
