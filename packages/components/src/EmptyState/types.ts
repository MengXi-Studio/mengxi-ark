/**
 * EmptyState 统一空状态 Props / Slots 契约。
 * 纯展示件：不依赖任何 UI 库，样式仅引用 --mx-* token。
 */
export interface EmptyStateProps {
  /** 空状态描述文案，默认「暂无数据」 */
  description?: string;
}

export interface EmptyStateSlots {
  /** 顶部自定义区域（默认无图示，纯文案） */
  default?: () => unknown;
  /** 底部操作区（如「新建」按钮） */
  action?: () => unknown;
}
