/**
 * 模块注册中心（纯逻辑）：登记 ModuleDefinition 声明式字段并提供聚合查询。
 * 路由注册 / 菜单汇入 / 权限合并等副作用由 createArkRuntime 调度（规范 §9.2）。
 */
import type { ModuleDefinition, ModuleRegistry } from '../../types';

/**
 * 创建模块注册中心。
 *
 * @returns 注册中心实例；register 重复 id 抛出 Error。
 */
export function createModuleRegistry(): ModuleRegistry {
  const modules: ModuleDefinition[] = [];
  const ids = new Set<string>();

  function register(module: ModuleDefinition): void {
    if (ids.has(module.id)) {
      throw new Error(`[@mengxi-ark/runtime] 模块 id "${module.id}" 重复注册`);
    }
    ids.add(module.id);
    modules.push(module);
  }

  function collectPermissions(): string[] {
    const result: string[] = [];
    for (const module of modules) {
      for (const code of module.permissions ?? []) {
        if (!result.includes(code)) result.push(code);
      }
    }
    return result;
  }

  function collectAppInitHooks() {
    return modules.map((m) => m.lifecycle?.onAppInit).filter((hook): hook is NonNullable<typeof hook> => Boolean(hook));
  }

  function collectBeforeRouteHooks() {
    return modules.map((m) => m.lifecycle?.onBeforeRouteChange).filter((hook): hook is NonNullable<typeof hook> => Boolean(hook));
  }

  return {
    register,
    get: (id) => modules.find((m) => m.id === id),
    list: () => [...modules],
    collectRoutes: () => modules.flatMap((m) => m.routes ?? []),
    collectMenus: () => modules.flatMap((m) => m.menus ?? []),
    collectPermissions,
    collectAppInitHooks,
    collectBeforeRouteHooks,
  };
}
