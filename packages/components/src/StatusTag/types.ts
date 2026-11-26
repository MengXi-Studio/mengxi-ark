/**
 * StatusTag 状态标签 Props / Slots 契约。
 * 纯展示件：不依赖任何 UI 库，样式仅引用 --mx-* token。
 */

/** 状态色调（映射 theme 功能色 token） */
export type StatusTagTone = 'success' | 'processing' | 'warning' | 'error' | 'default';

/** 单个状态映射项 */
export interface StatusTagItem {
  /** 展示文案 */
  label: string;
  /** 色调 */
  tone: StatusTagTone;
}

/** value → 映射项 */
export type StatusTagMapping = Record<string | number, StatusTagItem>;

export interface StatusTagProps {
  /** 状态值 */
  value?: string | number | null;
  /** 状态映射表；未命中时降级展示原始值（default 色调） */
  mapping?: StatusTagMapping;
}
