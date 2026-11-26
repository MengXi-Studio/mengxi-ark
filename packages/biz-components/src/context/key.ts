import type { InjectionKey } from 'vue';
import type { MxRuntimeContext } from './types';

/**
 * runtime 上下文注入键：runtime / 业务 mock 基座经 provide 下发，
 * biz-components 组件 inject 探测（探测失败自动降级独立模式，不抛异常）。
 */
export const MX_RUNTIME_CONTEXT_KEY: InjectionKey<MxRuntimeContext> = Symbol('MX_RUNTIME_CONTEXT_KEY');
