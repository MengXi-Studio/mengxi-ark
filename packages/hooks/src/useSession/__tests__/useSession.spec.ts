import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from '../index';

const STORAGE_KEY = 'mx_session_token';

/** 清除 happy-dom 中的测试 cookie */
function clearTestCookie(): void {
  document.cookie = `${STORAGE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

function readTestCookie(): string | null {
  for (const entry of document.cookie.split('; ')) {
    const eq = entry.indexOf('=');
    if (eq > 0 && entry.slice(0, eq) === STORAGE_KEY) {
      return entry.slice(eq + 1);
    }
  }
  return null;
}

beforeEach(() => {
  window.localStorage.clear();
  clearTestCookie();
});

describe('useSession', () => {
  it('localStorage 存取与清除', () => {
    const session = useSession();
    expect(session.token.value).toBe(null);
    session.setToken('abc');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('abc');
    expect(session.getToken()).toBe('abc');
    // 新实例从存储介质恢复
    const another = useSession();
    expect(another.token.value).toBe('abc');
    another.clearToken();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(null);
    expect(another.getToken()).toBe(null);
  });

  it('cookie 介质存取与清除', () => {
    const session = useSession({ storage: 'cookie' });
    session.setToken('ck');
    expect(readTestCookie()).toBe('ck');
    expect(session.getToken()).toBe('ck');
    session.clearToken();
    expect(session.getToken()).toBe(null);
    expect(readTestCookie()).toBe(null);
  });

  it('自动刷新成功后回写新 token', async () => {
    vi.useFakeTimers();
    try {
      let n = 0;
      const refreshFn = vi.fn(async () => `t${(n += 1)}`);
      const onExpired = vi.fn();
      const session = useSession({ autoRefreshInterval: 10, refreshFn, onSessionExpired: onExpired });
      await vi.advanceTimersByTimeAsync(25);
      expect(session.getToken()).toBe('t2');
      expect(refreshFn).toHaveBeenCalledTimes(2);
      expect(onExpired).not.toHaveBeenCalled();
      session.stopAutoRefresh();
      await vi.advanceTimersByTimeAsync(50);
      expect(refreshFn).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('自动刷新失败触发 onSessionExpired 并停止刷新（不跳转路由）', async () => {
    vi.useFakeTimers();
    try {
      const refreshFn = vi.fn(async () => {
        throw new Error('refresh failed');
      });
      const onExpired = vi.fn();
      const session = useSession({ autoRefreshInterval: 10, refreshFn, onSessionExpired: onExpired });
      session.setToken('old');
      await vi.advanceTimersByTimeAsync(15);
      expect(refreshFn).toHaveBeenCalledTimes(1);
      expect(onExpired).toHaveBeenCalledTimes(1);
      expect(onExpired).toHaveBeenCalledWith(expect.any(Error));
      // 失败后停止自动刷新，不再重试
      await vi.advanceTimersByTimeAsync(100);
      expect(refreshFn).toHaveBeenCalledTimes(1);
      expect(onExpired).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('刷新返回空 token 视为会话过期并清除本地 token', async () => {
    vi.useFakeTimers();
    try {
      const onExpired = vi.fn();
      const session = useSession({ autoRefreshInterval: 10, refreshFn: async () => '', onSessionExpired: onExpired });
      session.setToken('old');
      await vi.advanceTimersByTimeAsync(15);
      expect(onExpired).toHaveBeenCalledTimes(1);
      expect(session.getToken()).toBe(null);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe(null);
    } finally {
      vi.useRealTimers();
    }
  });

  it('startAutoRefresh：未配置 refreshFn 时警告且不启动', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const session = useSession();
    session.startAutoRefresh(10);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    session.stopAutoRefresh();
    warnSpy.mockRestore();
  });

  it('startAutoRefresh：间隔非法时警告且不启动', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const refreshFn = vi.fn(async () => 't');
    const session = useSession({ refreshFn });
    session.startAutoRefresh(0);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    session.startAutoRefresh();
    expect(warnSpy).toHaveBeenCalledTimes(2);
    session.stopAutoRefresh();
    expect(refreshFn).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
