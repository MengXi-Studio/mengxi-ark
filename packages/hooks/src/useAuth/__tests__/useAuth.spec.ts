import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { MX_AUTH_ADAPTER_KEY, setAuthAdapter, useAuth, vPermission } from '../index';
import type { AuthAdapter } from '../index';

/** 依据权限码列表实现 some / every 语义的参考适配器 */
function makeAdapter(codes: string[]): AuthAdapter {
  return {
    hasPermission(code, mode = 'some') {
      const list = Array.isArray(code) ? code : [code];
      return mode === 'every' ? list.every((c) => codes.includes(c)) : list.some((c) => codes.includes(c));
    },
  };
}

afterEach(() => {
  setAuthAdapter(undefined);
});

describe('useAuth', () => {
  it('显式 adapter：some / every 判断与 mode 透传', () => {
    const spy = vi.fn(makeAdapter(['admin', 'editor']).hasPermission);
    const auth = useAuth({ hasPermission: spy });
    expect(auth.hasPermission('admin')).toBe(true);
    expect(auth.hasPermission('nope')).toBe(false);
    expect(auth.hasPermission(['admin', 'nope'])).toBe(true);
    expect(auth.hasPermission(['admin', 'nope'], 'every')).toBe(false);
    expect(auth.hasPermission(['admin', 'editor'], 'every')).toBe(true);
    expect(spy).toHaveBeenLastCalledWith(['admin', 'editor'], 'every');
  });

  it('inject 探测：app.provide 的适配器被使用且不警告', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const Comp = defineComponent({
      setup() {
        const { hasPermission } = useAuth();
        return () => h('div', hasPermission('admin') ? 'granted' : 'denied');
      },
    });
    const wrapper = mount(Comp, {
      global: {
        provide: { [MX_AUTH_ADAPTER_KEY]: makeAdapter(['admin']) },
      },
    });
    expect(wrapper.text()).toBe('granted');
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('降级链：无权限源时 hasPermission 恒为 false 并警告一次', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const auth = useAuth();
    expect(auth.hasPermission('admin')).toBe(false);
    expect(auth.hasPermission(['admin', 'nope'], 'every')).toBe(false);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('降级链：setAuthAdapter 注册的模块级权限源被复用', () => {
    setAuthAdapter(makeAdapter(['admin']));
    const auth = useAuth(undefined, { silentWarn: true });
    expect(auth.hasPermission('admin')).toBe(true);
    expect(auth.hasPermission('nope')).toBe(false);
  });

  it('silentWarn: true 关闭降级警告', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    useAuth(undefined, { silentWarn: true });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('v-permission 指令', () => {
  const mountWithDirective = (template: string) =>
    mount(
      defineComponent({
        template,
      }),
      { global: { directives: { permission: vPermission } } },
    );

  it('无权限移除元素，权限恢复后插回原位', async () => {
    const codes: string[] = [];
    setAuthAdapter({
      hasPermission: (code) => (Array.isArray(code) ? code : [code]).every((c) => codes.includes(c)),
    });
    const wrapper = mountWithDirective(`<div><button v-permission="'admin'">删除</button></div>`);
    expect(wrapper.find('button').exists()).toBe(false);

    codes.push('admin');
    wrapper.vm.$forceUpdate();
    await Promise.resolve();
    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.find('button').text()).toBe('删除');
  });

  it('v-permission.disabled：无权限置灰不移除', () => {
    setAuthAdapter({ hasPermission: () => false });
    const wrapper = mountWithDirective(`<div><button v-permission.disabled="'admin'">停用</button></div>`);
    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('disabled')).toBeDefined();
  });

  it('v-permission.disabled：权限恢复后移除 disabled 属性', async () => {
    const granted = { value: false };
    setAuthAdapter({ hasPermission: () => granted.value });
    const wrapper = mountWithDirective(`<div><button v-permission.disabled="'admin'">停用</button></div>`);
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();

    granted.value = true;
    wrapper.vm.$forceUpdate();
    await Promise.resolve();
    expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
  });
});
