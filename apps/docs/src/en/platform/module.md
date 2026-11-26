# registerModule Module Development

A module package depends only on the `ModuleDefinition` **type** of `@mengxi-ark/runtime` (declarative fields), never importing runtime's internal implementation; routes, menus and permissions are assembled uniformly by the base at registration time.

## ModuleDefinition

```ts
import type { ModuleDefinition } from '@mengxi-ark/runtime';

export const systemModule: ModuleDefinition = {
  id: 'system',                    // unique identifier; duplicate registration throws
  routes: [                        // registered via router.addRoute
    {
      path: '/system/users',
      name: 'system-users',
      component: () => import('../views/UserManagePage.vue'),
      meta: { title: '用户管理' },
    },
  ],
  menus: [                         // merged into the menuService menu tree (same-key override)
    {
      key: 'system',
      title: '系统管理',
      children: [{ key: 'system-users', title: '用户管理', path: '/system/users' }],
    },
  ],
  permissions: ['system:user:view'],  // merged (deduplicated) into the global context permissions
  lifecycle: {
    onAppInit: () => { /* module initialization */ },
    onBeforeRouteChange: (to, from) => { /* module-level guard */ },
  },
};
```

## Registration Timing

- **At install**: `createArkRuntime({ modules: [...] })` — module routes are registered before the first navigation;
- **Late registration**: call `runtime.registerModule(module)` at any time after obtaining the instance handle — routes are `addRoute`d immediately, menus / permissions are merged immediately, and the module-level `onAppInit` runs immediately.

```ts
const runtime = createArkRuntime({ router, context });
app.use(runtime);

// fetch the remote module definition asynchronously, then register it
const remote = await fetchModuleDefinition();
runtime.registerModule(remote);
```

## Permission Merging

Module `permissions` are merged (deduplicated) with the initial `context.permissions` and delivered via `MX_RUNTIME_CONTEXT_KEY`. biz-components (DocumentTable column-level permissionCode, useAuth, etc.) probe the same permission source via inject:

- Context hit → the context wins;
- runtime not installed / probing failed → fall back to the component's same-named props (e.g. the `permissions` prop).

## Accessing Base Capabilities Inside Pages

```vue
<script setup lang="ts">
import { inject } from 'vue';
import { ARK_RUNTIME_KEY } from '@mengxi-ark/runtime';
import type { ArkRuntime } from '@mengxi-ark/runtime';

const runtime = inject(ARK_RUNTIME_KEY) as ArkRuntime | undefined;

// open a business dialog (openMode 'dialog', direct business component)
function openPickDialog(): void {
  runtime?.tabService.open({ title: '选择负责人', component: PickOwnerDialog, width: 480 });
}
</script>
```

See `apps/demo-platform` for a complete runnable example (systemModule / bizModule, two modules + a fallback-switching demo page).
