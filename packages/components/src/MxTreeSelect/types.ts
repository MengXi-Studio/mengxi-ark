/**
 * MxTreeSelect 树选择 Props / Emits / Slots 契约（UI 适配器 TreeSelect 能力的统一壳）。
 * 树节点统一结构：{ key, title, children? }，value 即 key。
 */
import type { MxSize, MxTreeNode } from '../adapter/types';

export interface MxTreeSelectProps {
  /** 选中值（单选为 key，multiple 为 key 数组；v-model） */
  modelValue?: string | number | Array<string | number> | null;
  /** 树数据 */
  treeData?: MxTreeNode[];
  size?: MxSize;
  placeholder?: string;
  disabled?: boolean;
  /** 是否可清除，默认 true */
  allowClear?: boolean;
  /** 是否多选 */
  multiple?: boolean;
}

export interface MxTreeSelectEmits {
  (e: 'update:modelValue', value: string | number | Array<string | number> | null): void;
}

export interface MxTreeSelectSlots {
  default?: () => unknown;
}
