/**
 * 组件映射注册表（规范 §10.2）：schema.type → 组件 + 默认 props，业务可用映射表覆盖替换。
 *
 * 适配器原子（input / select / dateRange 等）经工厂按当前 UI 适配器解析；
 * 跨组件实体（lov / enhanceTable / documentTable 等）直接引用。
 * 渲染器统一经 createComponentMap(overrides, adapter) 取表，覆盖项整体替换同 key 条目。
 */
import { markRaw } from 'vue';
import type { Component } from 'vue';
import type { UiAdapter } from '@mengxi-ark/components';
import {
  EnhanceTable,
  EmptyState,
  MxDialog,
  SearchForm,
  StatusTag,
  getDefaultAdapter,
} from '@mengxi-ark/components';
import { DocumentTable, Lov } from '@mengxi-ark/biz-components';

/** 映射条目：组件 + 默认 props（与 schema.props 浅合并，schema.props 优先） */
export interface SchemaMapEntry {
  component: Component;
  defaultProps?: Record<string, unknown>;
}

/** 组件定义统一 markRaw（映射表存于 computed，防止组件对象被深度响应式代理） */
function rawEntry(component: Component, defaultProps?: Record<string, unknown>): SchemaMapEntry {
  return { component: markRaw(component), defaultProps };
}

/** 组件映射表：key 为 schema.type */
export type SchemaComponentMap = Record<string, SchemaMapEntry>;

/**
 * 构建默认映射表（基于给定 UI 适配器解析原子能力）。
 *
 * @param adapter - UI 适配器（原子能力来源）
 * @returns 默认映射表（13 项：原子 + 跨组件实体）
 */
export function buildDefaultComponentMap(adapter: UiAdapter): SchemaComponentMap {
  return {
    input: rawEntry(adapter.Input),
    select: rawEntry(adapter.Select),
    dateRange: rawEntry(adapter.RangePicker),
    treeSelect: rawEntry(adapter.TreeSelect),
    upload: rawEntry(adapter.Upload),
    button: rawEntry(adapter.Button),
    lov: rawEntry(Lov),
    searchForm: rawEntry(SearchForm),
    enhanceTable: rawEntry(EnhanceTable),
    documentTable: rawEntry(DocumentTable),
    dialog: rawEntry(MxDialog),
    statusTag: rawEntry(StatusTag),
    emptyState: rawEntry(EmptyState),
  };
}

/**
 * 创建组件映射表：默认表 + 业务覆盖（扩展优先，渲染器不硬编码组件清单）。
 *
 * @param overrides - 业务覆盖条目（同 key 整体替换，组件自动 markRaw）
 * @param adapter - UI 适配器，缺省取默认适配器（渲染器内部应传 inject 结果）
 * @returns 合并后的映射表
 */
export function createComponentMap(overrides?: SchemaComponentMap, adapter?: UiAdapter): SchemaComponentMap {
  const base = buildDefaultComponentMap(adapter ?? getDefaultAdapter());
  if (!overrides) return base;
  const merged: SchemaComponentMap = { ...base };
  for (const [key, entry] of Object.entries(overrides)) {
    merged[key] = rawEntry(entry.component, entry.defaultProps);
  }
  return merged;
}
