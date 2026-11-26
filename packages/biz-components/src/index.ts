/**
 * @mengxi-ark/biz-components —— 双模式业务组件层。
 *
 * 双模式契约（规范 §5）：
 * 1. 独立模式（默认降级）：lovApi / params 等 props 驱动，组件内部 useRequest 自行请求；
 * 2. 基座联动：inject 探测 MX_RUNTIME_CONTEXT_KEY（值集缓存 / 用户信息 / 权限），
 *    探测成功自动复用，禁止 import @mengxi-ark/runtime；
 * 3. 上下文字段全部支持 props 兜底（lovListApi ↔ lovApi、lovCache ↔ lovCache）；
 * 4. 探测失败自动切独立模式，不抛致命异常。
 */
// —— 基座上下文探测契约 ——
export {
  MX_RUNTIME_CONTEXT_KEY,
  useRuntimeContext,
} from './context/resolve';
export type {
  MxOrgInfo,
  MxRuntimeContext,
  MxTenantInfo,
  MxUserInfo,
} from './context/types';

// —— 双模式业务组件 ——
export { default as Lov } from './Lov';
export {
  resolveLovSource,
  type LovMode,
  type LovSourceResolution,
  type LovEmits,
  type LovFieldNames,
  type LovListApi,
  type LovOption,
  type LovProps,
  type LovRow,
  type LovSlots,
} from './Lov';

export { default as DocumentTable } from './DocumentTable';
export {
  createTempRowKey,
  validateCell,
  validateRows,
  type DocValidateErrors,
  type DocCellRule,
  type DocColumn,
  type DocEditorType,
  type DocumentTableEmits,
  type DocumentTableProps,
  type DocumentTableSlots,
} from './DocumentTable';

/** 包版本常量（M0 包壳遗留，保持兼容） */
export const MENGXI_ARK_VERSION = '0.0.0';
