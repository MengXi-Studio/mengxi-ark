# registerModule 模块开发

> **前置知识**：请先阅读 [createArkRuntime 与工作台](/platform/)——本页的模块注册时机会挂接在其 install 装配流程上；权限合并机制依赖[全局上下文](/platform/context)的下发链路。

模块包只依赖 `@mengxi-ark/runtime` 的 `ModuleDefinition` **类型**（声明式字段），不 import runtime 内部实现；路由、菜单、权限由基座在注册时统一装配。

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

## 注册时机

- **安装时**：`createArkRuntime({ modules: [...] })`，模块路由在首次导航前完成注册；
- **延迟注册**：拿到实例句柄后任意时机调用 `runtime.registerModule(module)`——路由立即 `addRoute`、菜单 / 权限立即并入、模块级 `onAppInit` 立即执行。

```ts
const runtime = createArkRuntime({ router, context })
app.use(runtime)

// 异步拉取远程模块声明后注册
const remote = await fetchModuleDefinition()
runtime.registerModule(remote)
```

## 权限合并

模块 `permissions` 与初始 `context.permissions` 合并去重后经 `MX_RUNTIME_CONTEXT_KEY` 下发。biz-components（DocumentTable 列级 permissionCode、useAuth 等）inject 探测同一权限源：

- 上下文命中 → 以上下文为准；
- 未安装 runtime / 探测失败 → 回退组件同名 props（如 `permissions` props）。

## 页面内访问基座能力

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

完整可运行示例见 `apps/demo-platform`（systemModule / bizModule 两模块 + 降级切换演示页）。

**下一步**：模块注册完成后，进入 [全局上下文与双模式降级](/platform/context)理解上下文如何下发给业务组件、以及上下文丢失时的降级行为。
