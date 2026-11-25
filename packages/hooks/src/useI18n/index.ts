/**
 * useI18n —— 轻量国际化 hook（独立模式运行，不依赖任何基座）。
 *
 * createI18n 创建实例供 app.provide(MX_I18N_KEY, instance) 下发；useI18n() inject 探测，
 * 未提供时降级为模块级默认实例（t 直接返回 key）。
 */
import { getCurrentInstance, inject, ref } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/** 默认语言：zh-CN */
const DEFAULT_LOCALE = 'zh-CN';

/** 单条词条：字符串或按点路径嵌套的分组 */
export type I18nMessage = string | { [key: string]: I18nMessage };

/** 单语言词条表 */
export type I18nLocaleMessages = Record<string, I18nMessage>;

/**
 * createI18n 配置项。
 */
export interface CreateI18nOptions {
  /** 各语言词条表，键为语言标识（如 zh-CN / en-US） */
  messages: Record<string, I18nLocaleMessages>;
  /** 初始语言，默认 zh-CN */
  locale?: string;
  /** 回退语言：当前语言缺词条时回退查找 */
  fallbackLocale?: string;
}

/**
 * i18n 实例。
 */
export interface I18nInstance {
  /** 当前语言（响应式，t 随其变化即时更新） */
  locale: Ref<string>;
  /**
   * 翻译。
   * @param key - 词条键，支持点路径（如 nav.home）
   * @param params - 插值参数（{name} 形式占位）
   * @returns 翻译结果；缺失词条返回 key 本身并警告一次
   */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** 切换语言 */
  setLocale: (locale: string) => void;
}

/**
 * inject key：应用通过 app.provide(MX_I18N_KEY, instance) 下发 i18n 实例。
 */
export const MX_I18N_KEY: InjectionKey<I18nInstance> = Symbol('MX_I18N_KEY');

/**
 * 创建 i18n 实例（供 app.provide 使用）。
 *
 * @param options - 配置项（messages 必传）
 * @returns i18n 实例（locale / t / setLocale）
 *
 * @example
 * ```ts
 * const i18n = createI18n({ messages, locale: 'zh-CN', fallbackLocale: 'zh-CN' });
 * app.provide(MX_I18N_KEY, i18n);
 * ```
 */
export function createI18n(options: CreateI18nOptions): I18nInstance {
  const { messages, locale: initialLocale = DEFAULT_LOCALE, fallbackLocale } = options;
  const locale = ref(initialLocale);
  /** 已警告过的缺失 key（每个 key 仅警告一次） */
  const warnedKeys = new Set<string>();

  function lookup(localeName: string, key: string): I18nMessage | undefined {
    const bundle = messages[localeName];
    if (!bundle) return undefined;
    let current: I18nMessage | undefined = bundle;
    for (const segment of key.split('.')) {
      if (typeof current === 'string' || !current || !(segment in current)) {
        return undefined;
      }
      current = current[segment];
    }
    return current;
  }

  function warnMissing(key: string): void {
    if (warnedKeys.has(key)) return;
    warnedKeys.add(key);
    console.warn(`[mengxi-ark/useI18n] 缺少词条: "${key}"（locale: ${locale.value}）`);
  }

  function t(key: string, params?: Record<string, string | number>): string {
    let message = lookup(locale.value, key);
    if (message === undefined && fallbackLocale && fallbackLocale !== locale.value) {
      message = lookup(fallbackLocale, key);
    }
    if (typeof message !== 'string') {
      warnMissing(key);
      return key;
    }
    if (!params) return message;
    return message.replace(/\{(\w+)\}/g, (raw, name: string) => {
      const value = params[name];
      return value === undefined ? raw : String(value);
    });
  }

  return {
    locale,
    t,
    setLocale(next) {
      locale.value = next;
    },
  };
}

/** 模块级默认实例（懒创建）：useI18n 未探测到实例时的降级容器 */
let defaultI18nInstance: I18nInstance | null = null;

/**
 * i18n hook。
 *
 * 独立模式：未传入实例且 inject 探测失败时，返回模块级默认空实例（t 直接返回 key）。
 * 基座联动模式：app.provide(MX_I18N_KEY, instance) 后组件内自动复用实例。
 *
 * @param instance - 显式实例（最高优先级，可不传）
 * @returns i18n 实例
 */
export function useI18n(instance?: I18nInstance): I18nInstance {
  if (instance) return instance;
  if (getCurrentInstance()) {
    const injected = inject(MX_I18N_KEY, undefined);
    if (injected) return injected;
  }
  if (!defaultI18nInstance) {
    defaultI18nInstance = createI18n({ messages: {} });
  }
  return defaultI18nInstance;
}
