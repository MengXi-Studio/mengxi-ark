# registerModule Module Development

> **Prerequisites**: read [createArkRuntime & the Workbench](/en/platform/) first — this page's module registration timing hooks into its install assembly flow, and the permission merging mechanism relies on the delivery
> chain of the [Global Context](/en/platform/context).

A module package depends only on the `ModuleDefinition` **type** of `@mengxi-ark/runtime` (declarative fields), never importing runtime's internal implementation; routes, menus and permissions are assembled uniformly by
the base at registration time.

## ModuleDefinition

```ts
import type { ModuleDefinition } from '@mengxi-ark/runtime'

export const systemModule: ModuleDefinition = {
	id: 'system', // 唯一标识，重复注册抛错
	routes: [
		// 经 router.addRoute 注册
		{
			path: '/system/users',
			name: 'system-users',
			component: () => import('../views/UserManagePage.vue'),
			meta: { title: '用户管理' }
		}
	],
	menus: [
		// 汇入 menuService 菜单树（同 key 覆盖）
		{
			key: 'system',
			title: '系统管理',
			children: [{ key: 'system-users', title: '用户管理', path: '/system/users' }]
		}
	],
	permissions: ['system:user:view'], // 合并去重汇入全局上下文 permissions
	lifecycle: {
		onAppInit: () => {
			/* 模块初始化 */
		},
		onBeforeRouteChange: (to, from) => {
			/* 模块级守卫 */
		}
	}
}
```

## Menu Item Fields (MenuItem)

| Field      | Type         | Description                                                                                     |
| ---------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `key`      | `string`     | required, unique identifier (same key overrides; also used for addressing when nested via `parentKey`) |
| `title`    | `string`     | required, menu label                                                                            |
| `path`     | `string`     | the route path a leaf menu item navigates to on click (the click opens a tab via `tabService.open`) |
| `icon`     | `Component`  | the menu icon component (e.g. an icon from `@ant-design/icons-vue`)                             |
| `children` | `MenuItem[]` | submenus (rendered as group nodes when children exist)                                          |

> Route `meta.title` is linked with the tab title: the tab title fallback chain is `options.title → meta.title → fullPath`,
> configuring `meta.title` for every route makes tabs show business titles (see [Tab Rules](/en/platform/#tab-rules)).

## Registration Timing

- **At install**: `createArkRuntime({ modules: [...] })` — module routes are registered before the first navigation;
- **Late registration**: call `runtime.registerModule(module)` at any time after obtaining the instance handle — routes are `addRoute`d immediately, menus / permissions are merged immediately, and the module-level
  `onAppInit` runs immediately.

```ts
const runtime = createArkRuntime({ router, context })
app.use(runtime)

// 异步拉取远程模块声明后注册
const remote = await fetchModuleDefinition()
runtime.registerModule(remote)
```

## Permission Merging

Module `permissions` are merged (deduplicated) with the initial `context.permissions` and delivered via `MX_RUNTIME_CONTEXT_KEY`. biz-components (DocumentTable column-level permissionCode, useAuth, etc.) probe the same
permission source via inject:

- Context hit → the context wins;
- runtime not installed / probing failed → fall back to the component's same-named props (e.g. the `permissions` prop).

## Accessing Base Capabilities Inside Pages

```vue
<script setup lang="ts">
import { inject } from 'vue'
import { ARK_RUNTIME_KEY } from '@mengxi-ark/runtime'
import type { ArkRuntime } from '@mengxi-ark/runtime'

const runtime = inject(ARK_RUNTIME_KEY) as ArkRuntime | undefined

// 打开业务弹窗（openMode 'dialog'，业务组件直传）
function openPickDialog(): void {
	runtime?.tabService.open({ title: '选择负责人', component: PickOwnerDialog, width: 480 })
}
</script>
```

See `apps/demo-platform` for a complete runnable example (the systemModule / bizModule two modules + a fallback-switching demo page).

**Next**: once modules are registered, move on to [Global Context & Dual-Mode Fallback](/en/platform/context) to understand how the context reaches business components and the fallback behavior when the context is lost.
