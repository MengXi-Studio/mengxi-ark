/**
 * 基座上下文探测与 props 兜底装配（规范 §6.3.4）。
 *
 * 探测结果字段与兜底 props 同名对应（如上下文 lovListApi ↔ props.lovApi），
 * 缺失字段回退 props / 独立模式；探测失败自动降级，不抛致命异常。
 */
import { inject } from 'vue';
import { MX_RUNTIME_CONTEXT_KEY } from './key';
import type { MxRuntimeContext } from './types';

export type { MxRuntimeContext } from './types';
export { MX_RUNTIME_CONTEXT_KEY } from './key';

/**
 * 组件内探测 runtime 上下文：未 provide 时返回 null（独立模式），不抛异常。
 */
export function useRuntimeContext(): MxRuntimeContext | null {
  return inject<Partial<MxRuntimeContext> | null>(MX_RUNTIME_CONTEXT_KEY, null);
}
