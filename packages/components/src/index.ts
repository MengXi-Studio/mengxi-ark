/**
 * @mengxi-ark/components —— 通用增强组件层（完全独立可导入，不需要基座注册）。
 *
 * - 适配器：UI 库差异收敛在 src/adapter/（默认 Ant Design Vue，可 provide 切换 Element Plus）；
 * - 组件：props 驱动优先，插槽兜底；样式仅引用 --mx-* token，随包产出独立 css（./style.css）。
 */
// —— UI 适配层 ——
export { UI_ADAPTER_KEY, useUiAdapter, getDefaultAdapter } from './adapter/key';
export { createAntdvAdapter } from './adapter/antdv';
export { createElementPlusAdapter } from './adapter/element-plus';
export type {
  UiAdapter,
  MxSize,
  MxSelectOption,
  MxColumn,
  MxPaginationState,
  MxRowSelection,
  MxTreeNode,
  MxUploadItem,
} from './adapter/types';

// —— 通用增强组件（方案 §3.4 清单） ——
export { default as SearchForm } from './SearchForm';
export type { SearchField, SearchFieldType, SearchFormEmits, SearchFormProps, SearchFormSlots } from './SearchForm';

export { default as EnhanceTable } from './EnhanceTable';
export type { EnhanceTableEmits, EnhanceTableProps, EnhanceTableSlots } from './EnhanceTable';

export { default as EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateSlots } from './EmptyState';

export { default as StatusTag } from './StatusTag';
export type { StatusTagItem, StatusTagMapping, StatusTagProps, StatusTagTone } from './StatusTag';

export { default as ResultPage } from './ResultPage';
export type { ResultPageProps, ResultPageSlots, ResultPageStatus } from './ResultPage';

export { default as MxDialog } from './MxDialog';
export type { MxDialogEmits, MxDialogProps, MxDialogSlots } from './MxDialog';

export { default as MxDrawer } from './MxDrawer';
export type { MxDrawerEmits, MxDrawerProps, MxDrawerSlots } from './MxDrawer';

export { default as MxUpload } from './MxUpload';
export type { MxUploadEmits, MxUploadProps, MxUploadSlots } from './MxUpload';

export { default as MxTreeSelect } from './MxTreeSelect';
export type { MxTreeSelectEmits, MxTreeSelectProps, MxTreeSelectSlots } from './MxTreeSelect';

/** 包版本常量（M0 包壳遗留，保持兼容） */
export const MENGXI_ARK_VERSION = '0.0.0';
