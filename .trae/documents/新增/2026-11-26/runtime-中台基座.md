# runtime 中台基座 + demo-platform 实施方案

## 需求

启动实施方案（`.trae/documents/渐进式中台前端框架实施方案.md` §3.6 / 里程碑 M3）的**中台基座阶段**：

1. `packages/runtime`：Tab 工作台管理器、全局上下文下发、模块注册中心、全局路由守卫、会话监听、内置工作台 Layout（可替换），内部按 tabService / menuService / moduleRegistryService / sessionService /
   contextService 五个 service 拆分。
2. `apps/demo-platform`：中台示例项目（runtime + 模块注册 + Tab 工作台 + inject 探测与降级切换验证）。
3. 配套：VitePress「中台进阶（Runtime 基座）」板块、单测、changesets 登记（runtime 首次发布 minor）。

本阶段**不做**：dsl-render / cli（方案 M4 阶段）；多标签页持久化到 localStorage 等增强（可列遗留 TODO）。

## 需求分析

- **涉及包**：`packages/runtime`（从占位壳落地为真实实现）；`apps/demo-platform`（新建，含 vue-router）；`apps/docs`（中台进阶板块 + 侧栏）；changeset。
- **依赖边界**：runtime 位于依赖链上层，可 import hooks / components / biz-components；`services/` 保持纯逻辑（不 import UI 库、不写 Vue 组件渲染），UI 依赖只收敛在 `layout/`；不修改 Vue / Router 原型，路由守卫用
  `router.beforeEach` 包装注册。
- **上下文契约衔接**：biz-components 已定义探测键 `MX_RUNTIME_CONTEXT_KEY` 与 `MxRuntimeContext` 类型（user / tenant / org / permissions / lovListApi /
  lovCache）——runtime 的 RuntimeContext 扩展该类型（上层 import 下层类型合法），`contextService` 用**同一个键** provide 下发（demo-light 的 BaseMockProvider 即该契约的 mock 版）。
- **biz-components 降级验证**：demo-platform 必须演示「inject 探测命中（基座联动）/ 移除包裹降级（独立模式）」双态切换，M2 起的探测契约在真实基座下回归验证。
- **现有基础**：runtime package.json / vite.config / tsconfig 骨架已在 M0 建好（dist 为占位产物）；hooks 已有 useSession / useAuth 可被 runtime 调度；components 有 MxDialog（Tab 弹窗策略可复用）；适配器契约 DataTable /
  Modal 等已就绪。

## 伪代码设计

### 1. 入口与 install（`src/index.ts`）

```ts
// createArkRuntime：工厂 + Vue 插件二合一
export interface ArkRuntimeOptions {
	router: Router // 必传：Tab 工作台基于路由
	context: RuntimeContext // 全局上下文（下发给 biz-components 探测）
	modules?: ModuleDefinition[] // 初始模块（也可后续 registerModule）
	layout?: Component // 替换内置 Layout（不传用内置）
	onSessionExpired?: () => void // 快捷钩子（等价 sessionService 回调）
}
export interface ArkRuntime {
	registerModule(module: ModuleDefinition): void
	onAppInit(hook: () => void | Promise<void>): void
	onBeforeRouteChange(hook: (to, from) => boolean | void | Promise<boolean | void>): void
	onSessionExpired(hook: () => void): void
	tabService: TabService // 暴露 tab 状态给 Layout
	menuService: MenuService // 暴露菜单树给 Layout
	context: RuntimeContext // 只读引用
}
export function createArkRuntime(options: ArkRuntimeOptions): ArkRuntime & { install(app: App): void }
// install(app)：① contextService.provide(app) ② 注册模块路由 ③ router.beforeEach 守卫包装 ④ 挂 Layout ⑤ onAppInit 按序执行
```

### 2. services/（纯逻辑，无 UI）

```ts
// moduleRegistryService：注册中心（声明式字段，模块包不 import runtime 内部实现，只依赖类型）
interface ModuleDefinition {
  id: string;
  routes?: RouteRecordRaw[];            // 经 router.addRoute 注册
  menus?: MenuItem[];                   // 汇入 menuService
  permissions?: string[];               // 汇入 context（合并去重）
  lifecycle?: { onAppInit?: ...; onBeforeRouteChange?: ... };  // 模块级钩子并入全局队列
}

// menuService：菜单树 = 各模块 menus 聚合 + 手动 addMenu；输出响应式树供 Layout 渲染

// tabService：Tab 工作台
interface TabItem { key: string; route: RouteLocationRaw; title: string; cached?: boolean; closable?: boolean }
interface TabService {
  tabs: Ref<TabItem[]>; activeKey: Ref<string>;
  open(route, options?: { openMode?: 'tab' | 'dialog' | 'current'; title?: string }): void;
  close(key: string): void;             // 关闭后激活相邻 Tab；首页 Tab 不可关
  activate(key: string): void;
}
// openMode: 'current' → router.replace；'tab' → push + 加入 tabs；'dialog' → 弹窗承载（见 Q2）

// sessionService：会话监听 / 单点登出回调 / token 刷新调度
interface SessionService {
  onExpired(hook): void;                // onSessionExpired 交给业务或 runtime 决定登出，hook 自己不跳转路由
  notifyExpired(): void;                // 业务探测到过期时手动触发（广播给全部 hook）
  startTokenRefresh(getToken, intervalMs?): void;  // 简单调度器（详见 Q4 范围）
  stopTokenRefresh(): void;
}

// contextService：provide(MX_RUNTIME_CONTEXT_KEY, reactive(context))；permissions 合并模块声明
```

### 3. 路由守卫（不劫持原生 API）

```ts
// install 内：router.beforeEach 包装 onBeforeRouteChange 队列
router.beforeEach(async (to, from) => {
	for (const hook of beforeRouteHooks) {
		// 按注册顺序执行
		const result = await hook(to, from)
		if (result === false) return false // 任一返回 false 阻断
	}
})
```

### 4. 内置 Layout（`src/layout/`，唯一 UI 落点）

```
layout/ArkWorkbenchLayout.vue：Sider 菜单（menuService 树渲染）+ Header（用户/登出）+ Tabs 条（tabService 渲染与关闭）
  + <router-view>（openMode 'current' 的页面承载）；弹窗策略容器见 Q2
```

UI 依赖收敛于此目录（详见 Q3 的实现选型）。

### 5. demo-platform（`apps/demo-platform`）

```
main.ts：createApp → createArkRuntime({ router, context: mock, modules: [systemModule, bizModule] }) → app.use()
两个示例模块：systemModule（用户管理页，演示 Lov 基座联动取上下文值集）+ bizModule（单据页，演示 DocumentTable + permissions 权限源）
降级切换演示页：开关控制是否包 context（模拟探测命中 / 独立降级）
```

### 6. 测试与文档

- 单测：moduleRegistryService（注册/路由/权限合并）、tabService（open/close/激活/openMode）、sessionService（expired 广播 / 刷新调度）、守卫队列（返回 false 阻断 / 按序执行）——services 纯逻辑可全覆盖。
- docs：新板块「中台进阶（Runtime 基座）」：安装与 createArkRuntime、registerModule 模块开发、生命周期钩子、双模式降级说明。
- changeset：runtime（新包 minor）+ demo-platform 无需发布。

## 疑问清单

### Q1 install API 形态（影响：业务接入方式）

推荐 `createArkRuntime(options)` 返回 **Vue 插件 + 实例句柄二合一**：`app.use(runtime)` 完成装配，同时持有 `runtime.registerModule(...)` 等命令式 API（模块包延迟注册场景）。是否认可？
回答：认可。

### Q2 Tab 打开策略 openMode 的首期深度（影响：tabService / Layout 复杂度）

方案 a（推荐）：三种都实现——'dialog' 在内置 Layout 内用 MxDialog 承载目标页面组件（非路由挂载，业务组件直传）；
方案 b：首期只做 'tab' / 'current'，'dialog' 留遗留 TODO。
选哪个？
回答：方案a。

### Q3 内置 Layout 的 UI 实现选型（影响：适配器契约是否扩展）

适配器原子能力目前没有 Menu / Tabs / Sider。方案：

- a（推荐）：`layout/` 内**直接 import ant-design-vue** 的 Layout / Menu / Tabs（规范允许 UI 引用收敛在 layout/；内置 Layout 本就是「可替换的默认实现」，替换者自带 UI，不污染适配器通用契约）；
- b：扩展适配器增加 Menu / Tabs / Layout 原子能力（两库同步落地，工作量大且这些能力偏「工作台专用」而非通用原子）。
  选哪个？
  回答：方案a。

### Q4 sessionService 首期范围（影响：token 自动刷新实现深度）

方案 a（推荐）：首期做「onSessionExpired 回调广播（业务探测到过期手动 notifyExpired）+ 轻量 token 定时刷新调度器（startTokenRefresh(getToken, interval)，失败即广播 expired）」；
方案 b：首期只做 expired 广播，刷新调度留 TODO。
选哪个？
回答：方案a。

### Q5 交付范围确认（影响：工作量边界）

runtime 五 service + 内置 Layout + demo-platform 两模块一演示页 + docs 中台进阶板块 + services 全量单测 + changeset（runtime minor），确认？降级切换演示是否需要（推荐需要：真实基座下回归 M2 探测契约）？
回答：确认，需要降级切换演示页。

## 实施记录

### 方案落地形态（与伪代码差异说明）

1. **createArkRuntime**（Q1）：按伪代码实现「插件 + 句柄二合一」。补充细节：install 后注册的 `onAppInit` / 延迟 `registerModule` 的模块级 `onAppInit`
   立即执行（非排队），异常经 console.error 兜底不阻断应用；install 防重入（Vue `app.use` 自身会拦截重复插件，防重入对直接调用 `install(app)` 生效）。
2. **tabService**（Q2）：三种 openMode 全部落地。实现细化——`'current'` 语义为「当前页签内跳转」：`router.replace` 且当前页签原地更新 route/title（key 不变，页签栏稳定），无激活页签时降级为 `'tab'`；`'dialog'` 须传
   `DialogPayload`（业务组件直传），误传路由目标时告警并降级 `'tab'`；`'tab'` 同 fullPath 幂等合并；close 关闭激活页签优先激活左侧相邻。无激活页签时 `'current'` 降级为 `'tab'`。
3. **内置 Layout**（Q3）：`layout/ArkWorkbenchLayout.vue` 直接 import antdv（Layout/Menu/Tabs），经 `ARK_RUNTIME_KEY` inject 获取 services；菜单渲染用 antdv v4 Menu `items`
   prop（免手写递归组件）；弹窗栈以 MxDialog（`footer=false`）承载 `tabService.dialogs`；菜单高亮按 `flattenMenuItems` 的 `path === route.path` 匹配。样式仅引用 `--mx-*` token。
4. **sessionService**（Q4）：`onExpired` 广播 + `startTokenRefresh(getToken, { intervalMs })`
   调度器（默认 5 分钟；返回空 token 或抛错 → 停止调度并广播 expired；重复调用覆盖旧调度器）。未引入 useSession（保持 service 纯逻辑，不耦合 storage）。
5. **RuntimeContext**：`interface RuntimeContext extends MxRuntimeContext { appName?: string }`（扩展 biz-components 探测契约），contextService 以同一 `MX_RUNTIME_CONTEXT_KEY` provide reactive 上下文。
6. **交付范围**（Q5）：全量落地；另交付 `homeTab`（首页不可关闭页签）配置项、`ARK_LAYOUT_COMPONENT_NAME` 全局组件挂载、VitePress 三页板块（createArkRuntime / registerModule / 双模式降级）。
7. **demo-platform**：hash 路由；systemModule（Lov 基座联动 + openMode 'dialog' 演示）+ bizModule（DocumentTable 基座权限源：数量列命中 `biz:order:edit` 可编辑、备注列 `biz:order:admin` 只读）+
   ContextFallbackDemo（子树 provide 空上下文模拟探测丢失，验证降级与 props 兜底）。

### 变更文件清单

- `packages/runtime/src/`：`types.ts`（全部契约类型）、`key.ts`（ARK_RUNTIME_KEY /
  ARK_LAYOUT_COMPONENT_NAME）、`index.ts`（createArkRuntime + 全部导出）、`services/{moduleRegistry,menu,tab,session,context}Service/index.ts`、`layout/ArkWorkbenchLayout.vue` + `layout/style/index.scss` +
  `layout/index.ts`、5 个 spec（39 用例）
- `packages/runtime/`：`package.json`（deps: biz-components/components workspace:^；peers: vue/vue-router + antdv optional；vue-tsc typecheck；`./style.css` exports）、`tsconfig.spec.json`、`vite.config.ts`（antdv
  external + cssFileName）
- `apps/demo-platform/`（新建）：package.json / index.html / vite.config.ts / main.ts / App.vue /
  router、`modules/{systemModule,bizModule}.ts`、`views/{UserManagePage,PickOwnerDialog,OrderListPage,ContextFallbackDemo}.vue`、`mock-api.ts`
- `apps/docs/`：`platform/{index,module,context}.md`（新板块三页）、`.vitepress/config.mts`（nav + sidebar）
- `.changeset/m3-runtime-workbench.md`（runtime minor）

### 验证方式与结果

- `pnpm turbo run typecheck build test`：25 任务全绿（runtime 39 用例全过，ESM/CJS + 完整 .d.ts 产物）；
- `pnpm deps:check` / `pnpm peer:check`：99 文件通过（无反向依赖、peer 声明对齐）；
- `pnpm --filter docs build`：VitePress 构建通过（无死链）；
- `pnpm --filter demo-platform build`：通过（仅 chunk 体积提示）；
- 浏览器验证（demo-platform）：两轮子代理共 6 项全 PASS——工作台渲染（菜单/Header 用户/页签）、菜单点击新增页签、Lov 基座联动取上下文值集缓存并选中回显、openMode
  'dialog' 业务组件直传弹窗开合且不新增页签、降级切换演示（子树空上下文 → 独立模式提示 + props 兜底正常）、修复后复验控制台仅 2 条 vite debug（无 error / 无路由 no-match warning）。

### 遗留 TODO

1. `packages/runtime/src/services/tabService/index.ts`：浏览器直接深链刷新（非 homeTab 路径）时无对应页签，后续可加「afterEach 同步路由 → upsert 页签」开关；
2. 多页签状态持久化（localStorage）与页签右键菜单（关闭其他 / 关闭右侧）未实现（本阶段明确不做）；
3. 内置 Layout Header 登出按钮未内置（由业务经 `header-actions` 插槽 + onSessionExpired 组合）；
4. `pnpm-lock.yaml` 本次恢复同步（biz-components 依赖形态 workspace:^ 与历史锁文件不一致，`--no-frozen-lockfile` 更新）。

### 经验沉淀

见 `.trae/documents/LESSONS_LEARNED.md`「2026-11-26 · M3 中台基座」：沙箱虚拟化导致 pnpm workspace junction 指向镜像副本的排查与处理；`router.resolve(homeTab)` 须在模块路由注册后调用（R0004）；Vue `app.use`
会拦截重复插件，防重入逻辑需直接调用 install 验证。
