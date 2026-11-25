/**
 * useRequest —— 通用请求 hook（独立模式运行，不依赖任何基座）。
 *
 * 内置：loading / error 状态、竞态保护（旧响应丢弃）、取消、重试（次数 + 间隔 + 指数退避）、
 * 显式 cacheKey 缓存。卸载时自动取消在途请求；组件外调用仅跳过清理，不报错。
 */
import { getCurrentInstance, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';

/** 默认创建即发起首次请求（immediate: true） */
const DEFAULT_IMMEDIATE = true;
/** 默认重试次数：0 表示失败后不自动重试 */
const DEFAULT_RETRY_COUNT = 0;
/** 默认重试基础间隔（毫秒） */
const DEFAULT_RETRY_INTERVAL = 1000;
/** 默认关闭指数退避 */
const DEFAULT_RETRY_BACKOFF = false;

/** 模块级请求缓存：仅当 options.cacheKey 显式传入时启用，默认不缓存 */
const requestCache = new Map<string, unknown>();

/**
 * 重试配置。
 */
export interface UseRequestRetryOptions {
  /** 最大重试次数，默认 0（不重试） */
  count?: number;
  /** 重试基础间隔（毫秒），默认 1000；开启 backoff 后逐次翻倍 */
  interval?: number;
  /** 是否指数退避（每次重试间隔翻倍），默认 false */
  backoff?: boolean;
}

/**
 * useRequest 配置项（全部可选）。
 */
export interface UseRequestOptions<T, P = void> {
  /** 是否创建时立即发起一次请求，默认 true */
  immediate?: boolean;
  /** 显式缓存键：命中缓存时先同步回填 data 再发起请求，成功结果写入缓存；默认不缓存 */
  cacheKey?: string;
  /** 失败自动重试配置，默认不重试 */
  retry?: UseRequestRetryOptions;
  /** 请求成功回调（重试后成功同样触发） */
  onSuccess?: (data: T, params: P | undefined) => void;
  /** 请求失败回调（重试耗尽后的最终失败） */
  onError?: (error: unknown, params: P | undefined) => void;
}

/**
 * useRequest 返回值（响应式状态 + 副作用方法并列）。
 */
export interface UseRequestResult<T, P = void> {
  /** 响应数据（成功后回写，初始 null） */
  data: Ref<T | null>;
  /** 最近一次失败的错误（成功或重新发起请求时复位为 undefined） */
  error: Ref<unknown>;
  /** 是否请求中（cancel / 完成后自动复位） */
  loading: Ref<boolean>;
  /**
   * 手动发起请求；params 为 source 入参。
   * @param params - 请求参数
   */
  run: (params?: P) => Promise<void>;
  /** 取消在途请求并复位 loading；被取消请求的响应回写将被丢弃 */
  cancel: () => void;
  /** 以最近一次 run 的参数重放请求 */
  refresh: () => Promise<void>;
  /** 手动重试：以最近一次参数重新发起请求（重置重试预算） */
  retry: () => Promise<void>;
}

/**
 * 通用请求 hook。
 *
 * @param source - 请求源函数（业务注入请求实例，本 hook 不绑定任何后端字段）
 * @param options - 配置项，全部可选
 * @returns 响应式状态与 run / cancel / refresh / retry 方法
 *
 * @example
 * ```ts
 * const { data, loading, run, cancel } = useRequest(() => fetchUser(id));
 * ```
 */
export function useRequest<T, P = void>(
  source: (params: P) => Promise<T>,
  options: UseRequestOptions<T, P> = {},
): UseRequestResult<T, P> {
  const { immediate = DEFAULT_IMMEDIATE, cacheKey, retry: retryOptions, onSuccess, onError } = options;
  const retryCount = retryOptions?.count ?? DEFAULT_RETRY_COUNT;
  const retryInterval = retryOptions?.interval ?? DEFAULT_RETRY_INTERVAL;
  const retryBackoff = retryOptions?.backoff ?? DEFAULT_RETRY_BACKOFF;

  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<unknown>(undefined);
  const loading = ref(false);

  /** 请求序号（竞态保护）：响应回写前比对，旧序号一律丢弃 */
  let requestSeq = 0;
  let lastParams: P | undefined;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;

  function clearRetryTimer(): void {
    if (retryTimer !== undefined) {
      clearTimeout(retryTimer);
      retryTimer = undefined;
    }
  }

  async function run(params?: P): Promise<void> {
    requestSeq += 1;
    const seq = requestSeq;
    lastParams = params;
    clearRetryTimer();
    loading.value = true;
    error.value = undefined;
    if (cacheKey !== undefined && requestCache.has(cacheKey)) {
      data.value = requestCache.get(cacheKey) as T;
    }
    let attempt = 0;
    let interval = retryInterval;
    while (true) {
      try {
        const result = await source(params as P);
        if (seq !== requestSeq) return;
        loading.value = false;
        data.value = result;
        if (cacheKey !== undefined) {
          requestCache.set(cacheKey, result);
        }
        onSuccess?.(result, params);
        return;
      } catch (err) {
        if (seq !== requestSeq) return;
        if (attempt >= retryCount) {
          loading.value = false;
          error.value = err;
          onError?.(err, params);
          return;
        }
        attempt += 1;
        await new Promise<void>((resolve) => {
          retryTimer = setTimeout(resolve, interval);
        });
        if (seq !== requestSeq) return;
        if (retryBackoff) {
          interval *= 2;
        }
      }
    }
  }

  function cancel(): void {
    requestSeq += 1;
    clearRetryTimer();
    loading.value = false;
  }

  function refresh(): Promise<void> {
    return run(lastParams);
  }

  function retry(): Promise<void> {
    return run(lastParams);
  }

  if (immediate) {
    void run();
  }

  // 卸载自动清理：组件外调用（无组件实例）跳过，不报错
  if (getCurrentInstance()) {
    onUnmounted(() => {
      cancel();
    });
  }

  return { data, error, loading, run, cancel, refresh, retry };
}
