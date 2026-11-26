/**
 * 菜单服务（纯逻辑）：聚合各模块 menus 与手动 addMenu，输出响应式树供 Layout 渲染。
 * 同 key 覆盖（后注册替换先注册），支持 parentKey 嵌套挂载。
 */
import { ref } from 'vue';
import type { MenuItem, MenuService } from '../../types';

/**
 * 在菜单树中按 key 深度查找节点。
 *
 * @param items 菜单树
 * @param key 菜单 key
 * @returns 命中的节点；未命中返回 undefined
 */
export function findMenuItem(items: MenuItem[], key: string): MenuItem | undefined {
  for (const item of items) {
    if (item.key === key) return item;
    const hit = item.children ? findMenuItem(item.children, key) : undefined;
    if (hit) return hit;
  }
  return undefined;
}

/**
 * 将菜单树拍平（深度优先），供按 path 反查高亮 / 按 key 跳转等场景。
 */
export function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];
  for (const item of items) {
    result.push(item);
    if (item.children?.length) result.push(...flattenMenuItems(item.children));
  }
  return result;
}

/**
 * 创建菜单服务。
 */
export function createMenuService(): MenuService {
  const menus = ref<MenuItem[]>([]);

  function upsert(list: MenuItem[], item: MenuItem): void {
    const index = list.findIndex((existing) => existing.key === item.key);
    if (index >= 0) list.splice(index, 1, item);
    else list.push(item);
  }

  function addMenu(input: MenuItem | MenuItem[], options?: { parentKey?: string }): void {
    const items = Array.isArray(input) ? input : [input];
    const parentKey = options?.parentKey;
    if (!parentKey) {
      for (const item of items) upsert(menus.value, item);
      return;
    }
    const parent = findMenuItem(menus.value, parentKey);
    if (!parent) {
      // 依赖方传错 key 属集成期错误：告警不静默吞掉，但不中断应用启动
      console.warn(`[@mengxi-ark/runtime] addMenu 未找到父菜单 key "${parentKey}"，已忽略`);
      return;
    }
    parent.children ??= [];
    for (const item of items) upsert(parent.children, item);
  }

  function removeFromList(list: MenuItem[], key: string): boolean {
    const index = list.findIndex((item) => item.key === key);
    if (index >= 0) {
      list.splice(index, 1);
      return true;
    }
    return list.some((item) => item.children ? removeFromList(item.children, key) : false);
  }

  function removeMenu(key: string): void {
    removeFromList(menus.value, key);
  }

  return { menus, addMenu, removeMenu };
}
