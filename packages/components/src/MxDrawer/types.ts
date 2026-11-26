/**
 * MxDrawer 抽屉 Props / Emits / Slots 契约（UI 适配器 Drawer 能力的统一壳）。
 */
export interface MxDrawerProps {
  /** 是否可见（v-model:open） */
  open?: boolean;
  /** 标题 */
  title?: string;
  /** 宽度 */
  width?: number | string;
  /** 关闭时销毁内容 */
  destroyOnClose?: boolean;
}

export interface MxDrawerEmits {
  (e: 'update:open', open: boolean): void;
}

export interface MxDrawerSlots {
  default?: () => unknown;
}
