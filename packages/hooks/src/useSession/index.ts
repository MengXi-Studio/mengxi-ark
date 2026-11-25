/**
 * useSession —— 会话 token 管理 hook（独立模式运行，不依赖任何基座）。
 *
 * token 存取介质可配置（localStorage / cookie）；自动刷新由业务注入 refreshFn 与间隔；
 * 刷新失败仅回调 onSessionExpired，登出与否由业务或 runtime 决定，本 hook 绝不跳转路由。
 * SSR / 无 window 环境下存储与定时器操作安全跳过。
 */
import { getCurrentInstance, onUnmounted, ref } from 'vue';
import type { Ref } from 'vue';

/** 默认存储介质：localStorage */
const DEFAULT_STORAGE: SessionStorageType = 'localStorage';
/** 默认存储键（localStorage 与 cookie 共用） */
const DEFAULT_STORAGE_KEY = 'mx_session_token';
/** 默认自动刷新间隔：0 表示不自动刷新 */
const DEFAULT_AUTO_REFRESH_INTERVAL = 0;
/** cookie 默认作用路径 */
const DEFAULT_COOKIE_PATH = '/';
/** 清除 cookie 用的过期时间戳 */
const COOKIE_EXPIRED_GMT = 'Thu, 01 Jan 1970 00:00:00 GMT';

/** token 存储介质 */
export type SessionStorageType = 'localStorage' | 'cookie';

/**
 * useSession 配置项（全部可选）。
 */
export interface UseSessionOptions {
  /** 存储介质，默认 localStorage */
  storage?: SessionStorageType;
  /** 自动刷新间隔（毫秒）；大于 0 且配置了 refreshFn 时创建即自动启动，默认 0（不自动刷新） */
  autoRefreshInterval?: number;
  /**
   * 刷新函数（业务注入）：返回新 token；
   * 返回空串视为会话过期（清除 token 并回调），抛错视为刷新失败（停止刷新并回调）。
   */
  refreshFn?: () => Promise<string>;
  /** 会话过期回调：刷新失败或返回空 token 时触发；登出逻辑由业务 / runtime 决定，本 hook 不跳转路由 */
  onSessionExpired?: (error: unknown) => void;
}

/**
 * useSession 返回值。
 */
export interface UseSessionResult {
  /** 当前 token（响应式，创建时从存储介质恢复） */
  token: Ref<string | null>;
  /** 读取当前 token */
  getToken: () => string | null;
  /** 写入 token（同步到存储介质） */
  setToken: (token: string) => void;
  /** 清除 token（内存与存储介质） */
  clearToken: () => void;
  /**
   * 启动自动刷新；interval 未传时使用 options.autoRefreshInterval。
   * @param interval - 刷新间隔（毫秒），需大于 0
   */
  startAutoRefresh: (interval?: number) => void;
  /** 停止自动刷新 */
  stopAutoRefresh: () => void;
}

/**
 * 会话 token 管理 hook。
 *
 * @param options - 配置项，全部可选
 * @returns token 响应式状态与存取 / 自动刷新调度方法
 */
export function useSession(options: UseSessionOptions = {}): UseSessionResult {
  const storageType = options.storage ?? DEFAULT_STORAGE;
  const autoRefreshInterval = options.autoRefreshInterval ?? DEFAULT_AUTO_REFRESH_INTERVAL;
  const refreshFn = options.refreshFn;
  const onSessionExpired = options.onSessionExpired;

  function readCookieToken(): string | null {
    for (const entry of document.cookie.split('; ')) {
      const eq = entry.indexOf('=');
      if (eq > 0 && entry.slice(0, eq) === DEFAULT_STORAGE_KEY) {
        return decodeURIComponent(entry.slice(eq + 1));
      }
    }
    return null;
  }

  function readToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return storageType === 'localStorage'
        ? window.localStorage.getItem(DEFAULT_STORAGE_KEY)
        : readCookieToken();
    } catch {
      // 隐私模式等存储不可用场景：静默降级为仅内存
      return null;
    }
  }

  function writeToken(value: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (storageType === 'localStorage') {
        window.localStorage.setItem(DEFAULT_STORAGE_KEY, value);
      } else {
        document.cookie = `${DEFAULT_STORAGE_KEY}=${encodeURIComponent(value)}; path=${DEFAULT_COOKIE_PATH}`;
      }
    } catch {
      // 存储失败静默降级，token 仍保留在内存
    }
  }

  function removeToken(): void {
    if (typeof window === 'undefined') return;
    try {
      if (storageType === 'localStorage') {
        window.localStorage.removeItem(DEFAULT_STORAGE_KEY);
      } else {
        document.cookie = `${DEFAULT_STORAGE_KEY}=; path=${DEFAULT_COOKIE_PATH}; expires=${COOKIE_EXPIRED_GMT}`;
      }
    } catch {
      // 存储失败静默降级
    }
  }

  const token = ref<string | null>(readToken());

  function setToken(value: string): void {
    token.value = value;
    writeToken(value);
  }

  function getToken(): string | null {
    return token.value;
  }

  function clearToken(): void {
    token.value = null;
    removeToken();
  }

  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  let refreshInFlight = false;

  async function doRefresh(): Promise<void> {
    if (!refreshFn || refreshInFlight) return;
    refreshInFlight = true;
    try {
      const nextToken = await refreshFn();
      if (nextToken) {
        setToken(nextToken);
      } else {
        // 刷新返回空 token：视为会话过期，清除本地 token 并回调
        stopAutoRefresh();
        clearToken();
        onSessionExpired?.(new Error('[mengxi-ark/useSession] 刷新函数返回空 token，视为会话过期'));
      }
    } catch (error) {
      // 刷新失败：停止自动刷新并仅回调业务方，由业务或 runtime 决定登出，本 hook 不跳转路由
      stopAutoRefresh();
      onSessionExpired?.(error);
    } finally {
      refreshInFlight = false;
    }
  }

  function startAutoRefresh(interval?: number): void {
    if (typeof window === 'undefined') return;
    const ms = interval ?? autoRefreshInterval;
    if (!refreshFn) {
      console.warn('[mengxi-ark/useSession] 未配置 refreshFn，无法启动自动刷新');
      return;
    }
    if (ms <= 0) {
      console.warn('[mengxi-ark/useSession] 自动刷新间隔需大于 0');
      return;
    }
    stopAutoRefresh();
    refreshTimer = setInterval(() => {
      void doRefresh();
    }, ms);
  }

  function stopAutoRefresh(): void {
    if (refreshTimer !== undefined) {
      clearInterval(refreshTimer);
      refreshTimer = undefined;
    }
  }

  if (autoRefreshInterval > 0) {
    startAutoRefresh();
  }

  // 卸载自动清理：组件外调用（无组件实例）跳过，不报错
  if (getCurrentInstance()) {
    onUnmounted(() => {
      stopAutoRefresh();
    });
  }

  return { token, getToken, setToken, clearToken, startAutoRefresh, stopAutoRefresh };
}
