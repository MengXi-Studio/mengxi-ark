/**
 * 会话服务（纯逻辑）：过期回调广播 + 轻量 token 定时刷新调度器（任务文档 Q4）。
 *
 * - onExpired / notifyExpired：业务探测到过期时手动广播，登出决策交给钩子注册方，服务自身不跳转路由；
 * - startTokenRefresh：定时调用 getToken，返回空值或抛错视为刷新失败 → 停止调度并广播 expired。
 */
import type { SessionExpiredHook, SessionService, TokenGetter, TokenRefreshOptions } from '../../types';

/** token 刷新默认间隔：5 分钟 */
export const DEFAULT_TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * 创建会话服务。
 */
export function createSessionService(): SessionService {
  const expiredHooks: SessionExpiredHook[] = [];
  let timer: ReturnType<typeof setTimeout> | null = null;

  function onExpired(hook: SessionExpiredHook): void {
    expiredHooks.push(hook);
  }

  function notifyExpired(): void {
    // 快照遍历：钩子内 stopTokenRefresh / 再注册不影响本轮广播
    for (const hook of [...expiredHooks]) hook();
  }

  function stopTokenRefresh(): void {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function startTokenRefresh(getToken: TokenGetter, options?: TokenRefreshOptions): void {
    stopTokenRefresh();
    const intervalMs = options?.intervalMs ?? DEFAULT_TOKEN_REFRESH_INTERVAL_MS;
    const tick = async (): Promise<void> => {
      try {
        const token = await getToken();
        if (token === null || token === undefined || token === '') {
          stopTokenRefresh();
          notifyExpired();
          return;
        }
      } catch {
        stopTokenRefresh();
        notifyExpired();
        return;
      }
      timer = setTimeout(() => void tick(), intervalMs);
    };
    timer = setTimeout(() => void tick(), intervalMs);
  }

  return { onExpired, notifyExpired, startTokenRefresh, stopTokenRefresh };
}
