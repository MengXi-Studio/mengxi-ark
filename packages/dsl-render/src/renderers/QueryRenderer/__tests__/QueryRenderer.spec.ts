import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { UI_ADAPTER_KEY } from '@mengxi-ark/components';
import { MX_RUNTIME_CONTEXT_KEY } from '@mengxi-ark/biz-components';
import { makeStubAdapter } from '../../../__tests__/stub-adapter';
import type { QuerySchema } from '../../../types/query';
import QueryRenderer from '../QueryRenderer.vue';

const stubAdapter = makeStubAdapter();

const mountQuery = (schema: QuerySchema, extraProps: Record<string, unknown> = {}) =>
  mount(QueryRenderer, {
    props: { schema, ...extraProps },
    global: { provide: { [UI_ADAPTER_KEY as symbol]: stubAdapter } },
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe('QueryRenderer', () => {
  const baseSchema: QuerySchema = {
    kind: 'query',
    fields: [
      { type: 'input', field: 'name', label: '姓名', placeholder: '请输入姓名' },
      { type: 'select', field: 'status', label: '状态', options: [{ label: '启用', value: '1' }] },
      { type: 'dateRange', field: 'createdAt', label: '创建时间' },
    ],
  };

  it('按映射表渲染字段 + 查询 / 重置按钮', () => {
    const wrapper = mountQuery(baseSchema);
    expect(wrapper.findAll('.stub-input')).toHaveLength(1);
    expect(wrapper.findAll('.stub-select')).toHaveLength(1);
    expect(wrapper.findAll('.stub-range-picker')).toHaveLength(1);
    expect(wrapper.findAll('.stub-button')).toHaveLength(2);
    expect(wrapper.find('.stub-button--primary').text()).toBe('查询');
  });

  it('各字段输入后查询 → search 抛全量值', async () => {
    const wrapper = mountQuery(baseSchema);
    await wrapper.find('.stub-input').setValue('梦曦');
    await wrapper.find('.stub-select').setValue('1');
    await wrapper.find('.stub-button--primary').trigger('click');
    const emitted = wrapper.emitted('search');
    expect(emitted?.[0]?.[0]).toEqual({ name: '梦曦', status: '1', createdAt: undefined });
  });

  it('重置 → 恢复 initialValue 并 emit reset', async () => {
    const schema: QuerySchema = {
      kind: 'query',
      fields: [
        { type: 'input', field: 'name', initialValue: '默认名' },
        { type: 'select', field: 'status', initialValue: '1', options: [{ label: '启用', value: '1' }] },
      ],
    };
    const wrapper = mountQuery(schema);
    await wrapper.find('.stub-input').setValue('改过的值');
    await wrapper.findAll('.stub-button')[1].trigger('click');
    expect(wrapper.emitted('reset')).toBeTruthy();
    expect((wrapper.find('.stub-input').element as HTMLInputElement).value).toBe('默认名');

    await wrapper.find('.stub-button--primary').trigger('click');
    expect(wrapper.emitted('search')?.[0]?.[0]).toEqual({ name: '默认名', status: '1' });
  });

  it('visible 函数式联动：基于当前查询值实时显隐', async () => {
    const schema: QuerySchema = {
      kind: 'query',
      fields: [
        {
          type: 'select',
          field: 'dateType',
          options: [
            { label: '按周', value: 'week' },
            { label: '按年', value: 'year' },
          ],
        },
        { type: 'dateRange', field: 'weekRange', visible: (values: Record<string, unknown>) => values.dateType === 'week' },
        { type: 'input', field: 'year', visible: (values: Record<string, unknown>) => values.dateType === 'year' },
      ],
    };
    const wrapper = mountQuery(schema);
    expect(wrapper.find('.stub-range-picker').exists()).toBe(false);
    expect(wrapper.find('.stub-input').exists()).toBe(false);

    await wrapper.find('.stub-select').setValue('week');
    expect(wrapper.find('.stub-range-picker').exists()).toBe(true);

    await wrapper.find('.stub-select').setValue('year');
    expect(wrapper.find('.stub-input').exists()).toBe(true);
    expect(wrapper.find('.stub-range-picker').exists()).toBe(false);
  });

  it('未登记类型 → warn 并跳过渲染', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const wrapper = mountQuery({ kind: 'query', fields: [{ type: 'ghost', field: 'g' }] });
    expect(wrapper.findAll('.mx-dsl-query__field')).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('ghost'));
  });

  it('searchText / resetText / loading 透传', () => {
    const wrapper = mountQuery({ ...baseSchema, searchText: '搜索', resetText: '清空', loading: true });
    const buttons = wrapper.findAll('.stub-button');
    expect(buttons[0].text()).toBe('搜索');
    expect(buttons[1].text()).toBe('清空');
    expect((buttons[0].element as HTMLButtonElement).disabled).toBe(true);
  });

  it('Lov 字段探测基座上下文 lovCache（回归：字段绑定不得以 undefined 覆盖 Lov 内部 options）', () => {
    const wrapper = mount(QueryRenderer, {
      props: {
        schema: {
          kind: 'query',
          fields: [{ type: 'lov', field: 'statusUser', label: '状态筛选', props: { lovCode: 'STATUS' } }],
        },
      },
      global: {
        provide: {
          [UI_ADAPTER_KEY as symbol]: stubAdapter,
          [MX_RUNTIME_CONTEXT_KEY as symbol]: {
            lovCache: { STATUS: [{ label: '启用', value: '1' }, { label: '停用', value: '0' }] },
          },
        },
      },
    });
    const texts = wrapper.find('.stub-select').findAll('option').map((option) => option.text());
    expect(texts).toContain('启用');
    expect(texts).toContain('停用');
  });
});
