import { defineComponent } from 'vue';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTabService } from '../index';

const Empty = defineComponent({ template: '<div />' });

function createTestRouter(): Router {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Empty },
      { path: '/a', component: Empty, meta: { title: '页面A' } },
      { path: '/b', component: Empty, meta: { title: '页面B' } },
      { path: '/c', component: Empty },
    ],
  });
}

/** 等待 open / close 内部 router.push / replace 的导航微任务完成 */
function flushNavigation(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('tabService', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('homeTab：初始化首页页签（closable false）', () => {
    const router = createTestRouter();
    const service = createTabService(router, { homeTab: { route: '/', title: '首页' } });

    expect(service.tabs.value).toHaveLength(1);
    expect(service.tabs.value[0]).toMatchObject({ key: '/', title: '首页', closable: false });
    expect(service.activeKey.value).toBe('/');
  });

  it('open（默认 tab 模式）：push 路由 + 新页签 + 激活，标题回退 meta.title', async () => {
    const router = createTestRouter();
    const service = createTabService(router);
    await router.push('/');

    service.open('/a');
    await flushNavigation();

    expect(service.tabs.value.map((t) => t.key)).toEqual(['/a']);
    expect(service.tabs.value[0].title).toBe('页面A');
    expect(service.activeKey.value).toBe('/a');
    expect(router.currentRoute.value.fullPath).toBe('/a');
  });

  it('open：同 fullPath 幂等合并（不重复建签，更新标题）', async () => {
    const router = createTestRouter();
    const service = createTabService(router);
    await router.push('/');
    service.open('/a');
    await flushNavigation();
    service.open('/a', { title: '自定义标题' });
    await flushNavigation();

    expect(service.tabs.value).toHaveLength(1);
    expect(service.tabs.value[0].title).toBe('自定义标题');
    expect(service.activeKey.value).toBe('/a');
  });

  it('open（current 模式）：replace 路由，当前页签原地更新且 key 不变', async () => {
    const router = createTestRouter();
    const service = createTabService(router, { homeTab: { route: '/', title: '首页' } });
    await router.push('/');

    service.open('/a', { openMode: 'current' });
    await flushNavigation();

    expect(service.tabs.value).toHaveLength(1);
    expect(service.tabs.value[0]).toMatchObject({ key: '/', title: '页面A' });
    expect(service.activeKey.value).toBe('/');
    expect(router.currentRoute.value.fullPath).toBe('/a');
  });

  it('open（dialog 模式）：DialogPayload 进弹窗栈；路由目标告警降级为 tab', async () => {
    const router = createTestRouter();
    const service = createTabService(router);
    await router.push('/');
    const FakeComponent = defineComponent({ template: '<div />' });

    service.open({ title: '编辑弹窗', component: FakeComponent, props: { id: 1 } });
    expect(service.dialogs.value).toHaveLength(1);
    expect(service.dialogs.value[0]).toMatchObject({ key: 'ark-dialog-1', title: '编辑弹窗', props: { id: 1 } });
    expect(service.tabs.value).toHaveLength(0);

    service.open('/a', { openMode: 'dialog' });
    await flushNavigation();
    expect(vi.mocked(console.warn)).toHaveBeenCalledWith(expect.stringContaining('已降级为 "tab"'));
    expect(service.dialogs.value).toHaveLength(1);
    expect(service.tabs.value.map((t) => t.key)).toEqual(['/a']);
  });

  it('closeDialog：移除指定弹窗', () => {
    const router = createTestRouter();
    const service = createTabService(router);
    const FakeComponent = defineComponent({ template: '<div />' });
    service.open({ title: 'A', component: FakeComponent });
    service.open({ title: 'B', component: FakeComponent });

    service.closeDialog('ark-dialog-1');
    expect(service.dialogs.value.map((d) => d.key)).toEqual(['ark-dialog-2']);

    service.closeDialog('no-such');
    expect(service.dialogs.value).toHaveLength(1);
  });

  it('close：关闭非激活页签不影响 activeKey', async () => {
    const router = createTestRouter();
    const service = createTabService(router, { homeTab: { route: '/', title: '首页' } });
    await router.push('/');
    service.open('/a');
    await flushNavigation();
    service.open('/b');
    await flushNavigation();

    service.close('/a');
    expect(service.tabs.value.map((t) => t.key)).toEqual(['/', '/b']);
    expect(service.activeKey.value).toBe('/b');
  });

  it('close：关闭激活页签后激活左侧相邻页签并跳转', async () => {
    const router = createTestRouter();
    const service = createTabService(router, { homeTab: { route: '/', title: '首页' } });
    await router.push('/');
    service.open('/a');
    await flushNavigation();
    service.open('/b');
    await flushNavigation();

    service.close('/b');
    await flushNavigation();
    expect(service.activeKey.value).toBe('/a');
    expect(router.currentRoute.value.fullPath).toBe('/a');
  });

  it('close：closable false 的首页页签不可关闭', () => {
    const router = createTestRouter();
    const service = createTabService(router, { homeTab: { route: '/', title: '首页' } });

    service.close('/');
    expect(service.tabs.value).toHaveLength(1);
    expect(vi.mocked(console.warn)).toHaveBeenCalledWith(expect.stringContaining('不可关闭'));
  });

  it('close：关闭最后一个页签后清空 activeKey', async () => {
    const router = createTestRouter();
    const service = createTabService(router);
    await router.push('/');
    service.open('/a');
    await flushNavigation();

    service.close('/a');
    expect(service.tabs.value).toHaveLength(0);
    expect(service.activeKey.value).toBe('');
  });

  it('activate：激活指定页签并跳转其路由', async () => {
    const router = createTestRouter();
    const service = createTabService(router, { homeTab: { route: '/', title: '首页' } });
    await router.push('/');
    service.open('/a');
    await flushNavigation();
    service.open('/b');
    await flushNavigation();

    service.activate('/');
    await flushNavigation();
    expect(service.activeKey.value).toBe('/');
    expect(router.currentRoute.value.fullPath).toBe('/');

    service.activate('no-such');
    expect(service.activeKey.value).toBe('/');
  });
});
