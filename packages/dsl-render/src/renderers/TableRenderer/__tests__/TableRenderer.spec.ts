import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { UI_ADAPTER_KEY } from '@mengxi-ark/components';
import { DocumentTable } from '@mengxi-ark/biz-components';
import { EnhanceTable } from '@mengxi-ark/components';
import { makeStubAdapter } from '../../../__tests__/stub-adapter';
import type { TableSchema } from '../../../types/table';
import TableRenderer from '../TableRenderer.vue';

const stubAdapter = makeStubAdapter();

const mountTable = (schema: TableSchema, extraProps: Record<string, unknown> = {}) =>
  mount(TableRenderer, {
    props: { schema, ...extraProps },
    global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } },
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TableRenderer', () => {
  const rows = [
    { id: 1, name: '用户一', status: '1' },
    { id: 2, name: '用户二', status: '0' },
  ];
  const baseSchema: TableSchema = {
    kind: 'table',
    columns: [
      { dataIndex: 'name', title: '姓名' },
      { dataIndex: 'status', title: '状态' },
    ],
  };

  it('table 模式（默认）：渲染 EnhanceTable 并直传列与数据', () => {
    const wrapper = mountTable(baseSchema, { dataSource: rows, pagination: { current: 1, size: 10, total: 2 } });
    expect(wrapper.findComponent(EnhanceTable).exists()).toBe(true);
    expect(wrapper.findComponent(DocumentTable).exists()).toBe(false);
    expect(wrapper.find('.stub-datatable__count').text()).toBe('2');
  });

  it('table 模式事件透传：pageChange / sortChange / rowClick', async () => {
    const wrapper = mountTable(baseSchema, { dataSource: rows });
    const enhance = wrapper.findComponent(EnhanceTable);
    enhance.vm.$emit('pageChange', 2, 20);
    enhance.vm.$emit('sortChange', 'name', 'asc');
    enhance.vm.$emit('rowClick', rows[0], 0);
    expect(wrapper.emitted('pageChange')?.[0]).toEqual([2, 20]);
    expect(wrapper.emitted('sortChange')?.[0]).toEqual(['name', 'asc']);
    expect(wrapper.emitted('rowClick')?.[0]?.[0]).toEqual(rows[0]);
  });

  it('document 模式：渲染 DocumentTable + save / update:modelValue 透传', async () => {
    const schema: TableSchema = {
      kind: 'table',
      mode: 'document',
      columns: [
        { dataIndex: 'product', title: '品名', editable: true },
        { dataIndex: 'count', title: '数量', editable: true },
      ],
    };
    const wrapper = mountTable(schema, { modelValue: rows });
    expect(wrapper.findComponent(DocumentTable).exists()).toBe(true);
    expect(wrapper.findComponent(EnhanceTable).exists()).toBe(false);

    const doc = wrapper.findComponent(DocumentTable);
    doc.vm.$emit('update:modelValue', [...rows, { id: 3 }]);
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toHaveLength(3);

    doc.vm.$emit('save', rows);
    expect(wrapper.emitted('save')?.[0]?.[0]).toEqual(rows);
    doc.vm.$emit('rowAdd', { id: 3 });
    expect(wrapper.emitted('rowAdd')).toBeTruthy();
    doc.vm.$emit('rowRemove', rows[0]);
    expect(wrapper.emitted('rowRemove')).toBeTruthy();
  });

  it('document 模式 schema 开关透传（addable / savable / permissions）', () => {
    const schema: TableSchema = {
      kind: 'table',
      mode: 'document',
      addable: false,
      savable: false,
      permissions: ['biz:edit'],
      columns: [{ dataIndex: 'product', title: '品名', editable: true }],
    };
    const wrapper = mountTable(schema, { modelValue: [] });
    const doc = wrapper.findComponent(DocumentTable);
    expect(doc.props('addable')).toBe(false);
    expect(doc.props('savable')).toBe(false);
    expect(doc.props('permissions')).toEqual(['biz:edit']);
  });

  it('componentMap 覆盖：替换默认表格组件', () => {
    const wrapper = mountTable(baseSchema, {
      dataSource: rows,
      componentMap: {
        enhanceTable: { component: { template: '<div class="custom-table" />', props: ['columns', 'dataSource'] } },
      },
    });
    expect(wrapper.find('.custom-table').exists()).toBe(true);
    expect(wrapper.findComponent(EnhanceTable).exists()).toBe(false);
  });

  it('expandedRowKeys 受控透传', async () => {
    const wrapper = mountTable(baseSchema, { dataSource: rows, expandedRowKeys: [1] });
    const enhance = wrapper.findComponent(EnhanceTable);
    expect(enhance.props('expandedRowKeys')).toEqual([1]);
    enhance.vm.$emit('update:expandedRowKeys', [2]);
    expect(wrapper.emitted('update:expandedRowKeys')?.[0]).toEqual([[2]]);
  });

  it('插槽透传：toolbar / bodyCell 转发给底层表格', () => {
    const wrapper = mount(TableRenderer, {
      props: { schema: baseSchema, dataSource: rows },
      slots: {
        toolbar: () => '工具栏内容',
        bodyCell: ({ column, record }: { column: { dataIndex: string }; record: Record<string, unknown> }) =>
          column.dataIndex === 'name' ? String(record.name) : String(record.status),
      },
      global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } },
    });
    expect(wrapper.text()).toContain('工具栏内容');
    expect(wrapper.text()).toContain('用户一');
  });
});
