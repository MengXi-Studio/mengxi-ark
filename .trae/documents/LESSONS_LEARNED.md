# LESSONS_LEARNED

## 2026-11-25 · M2 组件层

### vite-plugin-dts（unplugin-dts 1.1.2）对 .vue SFC 需显式 `processor: 'vue'`

- **现象**：构建 exit 0，但 dist 内 `Xxx/index.d.ts` 出现 `export { default } from './Xxx.vue'` 且无对应声明文件——下游消费包 TS2307（Cannot find module './Xxx.vue'）。
- **根因**：unplugin-dts 宣称自动探测 `.vue` 并启用 vue processor，但自动探测在本工程 `include: ['src']`（目录形式而非 glob）下不生效，TS 编译服务没有 Vue 语言支持，SFC 声明直接跳过。
- **修复**：`internal/build-scripts/define-lib-config.mjs` 的 dts 选项显式加 `processor: 'vue'` 与 `cleanVueFileName: true`（后者把 `Xxx.vue.d.ts` 重命名为 `Xxx.d.ts`，并把 import 路径 `./Xxx.vue` 重写为 `./Xxx`）。
- **排查要点**：dts 报错不影响 exit code，构建「成功」≠ d.ts 正确；验收必须打开 dist 里引用 `.vue` 的中间 d.ts 确认声明文件真实存在。

### 适配器边界统一契约与 h() 双向推断

- 统一 props 契约外壳（MxSize / MxSelectOption / MxPaginationState 等）与各 UI 库组件自身的 props 类型不逐字段重合（如 antdv `SizeType` 含 undefined、EP `rowKey` 仅收 string、antdv `UploadFile.uid` 必填 string）。给 `h()` 传强类型组件 + 手工映射 props 会触发双向推断的大量误报（TS2769）。
- 落地策略：惰性组件（defineAsyncComponent）显式标注为宽松 `Component`，props 按 any 渲染；类型差异全部收敛到适配器内的纯映射函数（可单测）与局部窄化变量（props 联合类型在闭包内不保留窄化，需先赋值局部常量）。

### props 驱动组件的单测要模拟 v-model

- 组件契约是 props 驱动（渲染只读 `props.modelValue`），单测仅传静态 prop 不会触发回显/新增行渲染——必须拦截 `update:modelValue` 回写（`wrapper.setProps` 或 reactive 数组 splice）模拟宿主绑定，否则测试失败疑似组件 bug。

## 2026-11-25 · M3 Lov 级联与行展开子表

### 可选 prop 的「空」语义必须与「未传」区分（cascadeSource 踩坑）

- **现象**：按伪代码把 `cascadeSource === undefined` 也视为父级为空 → 禁用，结果所有未配置级联的既有 Lov 全部被禁用，既有单测（远程模式打开弹窗）直接失败。
- **根因**：Vue 中「宿主未传 prop」与「宿主绑定了 undefined 的 ref」不可区分；可选能力开关 prop 的 undefined 必须语义化为「未启用该能力」，禁用只对显式传入的 `null` / 空数组生效。
- **推广**：凡「可选上下文/级联/依赖」类 prop，默认值 undefined 永远表示功能关闭，空态（null / []）才表示「启用但为空」。设计伪代码里的「null/undefined 视为空」需在实现时做向后兼容检查。

### antdv 与 EP 行展开实现差异收敛在适配器层

- antdv 原生支持 `expandedRowKeys` prop + `expandedRowRender` 具名槽（统一槽 `expandedRow` 需显式映射改名转发，不能直接透传 slots 对象了事）。
- EP 无展开槽概念，需适配器内部插入 `type="expand"` 的 el-table-column（列首追加）+ `expand-row-keys` 受控 + `expand-change` 回抛；EP 的 row-key 经适配器归一为字符串返回值，故 expand-row-keys 传 key 时需 `map(String)` 匹配。
- antdv 在「expandedRowRender 内嵌套 Table」会打印库自身 deprecation warning，根因是数据行的 `children` 数组字段被 antdv 当作**树形嵌套数据**（`expandType='nest'`）：一处触发「expandedRowRender should not use with nested Table」（vc-table/Table.js 检查 `record[childrenColumnName]`），另一处触发「expandIconColumnIndex is deprecated」（expandType 为 nest 时 wrapper 强制返回 0，useColumns 判 `>= 0` 即告警）。
- **修复方式**：适配器启用行展开时给 antdv Table 传哑键 `childrenColumnName: '__mx_expand_no_nesting'`——expandType 退回 'row'、告警检查落空，且避免树形缩进展开图标与受控 expandedRowKeys 双展开体系冲突。统一契约的行展开只由 expandedRowKeys 驱动，不做树形表格；EP 无此告警，无需对应实现（antdv 库内部 dev warning 的收敛属适配器层职责）。

### stub 适配器给 flatMap 返回展开内容时要包数组

- `expandedNode = cond ? h(...) : []` 直接 `...expandedNode` 展开会抛「expandedNode is not iterable」——VNode 不是可迭代对象。三元真分支必须包成 `[h(...)] : []`，保证 flatMap 回调始终返回数组。

## 2026-11-26 · M3 中台基座（runtime）

### Agent 沙箱虚拟化会把 pnpm workspace junction 指到镜像副本（模块解析假性失败）

- **现象**：runtime 内 import `@mengxi-ark/biz-components`，typecheck TS2307 / vitest「Cannot find package」，但 `packages/runtime/node_modules/@mengxi-ark/biz-components` 链接存在、目标包 dist 齐全。
- **根因**：在沙箱内执行 `pnpm install` 时，workspace 链接（Windows junction）指向了沙箱的 unified-storage 镜像路径（`C:\Users\...\sandbox-storage\...\packages\biz-components`）而非真实工作区；镜像副本内容不完整（无 package.json），junction 穿透后解析失败。用 `(Get-Item <link>).Target` 查看链接目标即可确认。
- **处理**：`pnpm install`（`--no-frozen-lockfile`）在关闭沙箱（真实文件系统）下重跑，junction 恢复指向真实包路径后一切正常。涉及 node_modules 链接/安装的命令应直接在沙箱外执行。
- **关联**：biz-components 的 package.json 曾以 `workspace:^` 落盘但锁文件记录为 `workspace:*`，frozen-lockfile 安装会直接报 OUTDATED_LOCKFILE——改过任何包 manifest 后需要 `--no-frozen-lockfile` 刷新锁文件。

### `router.resolve(homeTab)` 必须在模块路由注册之后调用

- **现象**：demo 首屏控制台出现 vue-router R0004「No match found for location with path /system/users」warning（非 error，但违反「无控制台报错」验收）。
- **根因**：`createArkRuntime` 内先 `createTabService`（首页页签经 `router.resolve(route).fullPath` 取 key）后注册模块路由——resolve 时模块路由尚未 `addRoute`，vue-router 对不可解析路径告警。
- **修复**：调整创建顺序：先 registerModule 注册全部初始模块路由，再创建 tabService。推广：凡在运行时拼装里做 `router.resolve` 的初始化逻辑，必须放在所有动态路由注册之后。

### Vue `app.use` 自身拦截重复插件，插件级防重入要直接调 install 才测得到

- 对同一 plugin `app.use(p)` 两次，Vue 打印「Plugin has already been applied to target app」且**不会**进入插件 `install`——插件内部的防重入告警（如 runtime install 的「重复调用已忽略」）通过 `app.use` 复现不了，单测需第二次直接调 `runtime.install(app)` 验证。

## 2026-11-26 · M4 DSL 渲染与 cli 脚手架

### Vue 动态组件上「显式绑定 undefined」会经 attrs 透传覆盖目标组件内部绑定

- **现象**：QueryRenderer 内 Lov（lovCode 命中基座 lovCache）下拉显示 No data；同一 Lov 直接挂载 / h() 包装均正常，单测 provide 上下文注入也全部成功。
- **根因**：QueryRenderer 模板在 `v-bind="{...}"` 之外又显式写了 `:options="item.field.options"`——Lov 字段该项为 undefined。Lov 未声明 `options` prop → 落入 attrs → Vue 对根节点动态组件做 attrs 透传 `mergeProps(root.props, attrs)`，**透传的 undefined 覆盖了 Lov 内部 `:options="staticOptions"` 数组绑定**，Select 收到空数组。
- **修复**：字段绑定统一收敛到 script 内构建的 binds 对象，undefined 值一律不下发（`if (field.options !== undefined) binds.options = ...`）；模板只保留必有值的 `:model-value` 与事件。推广：动态 `<component :is>` 上禁止显式绑定可为 undefined 的 prop，一律走 v-bind 对象并在 script 里按需赋值。
- **排查路径**：临时探针逐层打点（inject 成功 → resolveLovSource 成功 → staticOptions 正确 → Select 收到 []），才定位到「解析正确但渲染被覆盖」的透传层。

### pnpm `file:` 依赖的可用形态与嵌套临时工程隔离

- 跨盘绝对路径 `file:E:/...` 在 Windows pnpm 下被当作相对路径拼接（ENOENT），不可用；同盘相对路径 `file:../../packages/<name>` 可用。
- file: 打包副本内部仍带 `workspace:^` 依赖，脱离 monorepo 安装必挂；用临时工程 package.json 的 `pnpm.overrides` 把全部 `@mengxi-ark/*` 改写为同一 file: 路径即可闭环。
- 在 monorepo 仓库内建临时工程会被上层 pnpm-workspace.yaml 吞掉（workspace:^ 解析回 workspace 包）；临时工程根放一个自己的 `pnpm-workspace.yaml`（`packages: [.]`）即可隔离。临时工程验证完必须清理（残留 vite dev server 进程会锁住目录，需先结束监听进程再删）。

### eslint-config 全局环境按文件类型收敛

- no-undef 对 TS 文件默认关闭，但 .vue 文件走 js.configs.recommended 仍会报 console / MouseEvent 等未定义；在 `internal/eslint-config/index.js` 给 `**/*.ts` / `**/*.vue` 统一加 `globals.browser`、`packages/cli/**` 加 `globals.node` 一次性修复（cli 为 Node 包，需覆盖而非共享 browser）。

## 2026-11-26 · M5 Playwright E2E 首次落地

- **Windows 下 chromium 安装**：`playwright install chromium` 下载含 headless shell 的完整套件；中断后重跑会撞 `__dirlock` 残留，先删 `%LOCALAPPDATA%\ms-playwright\__dirlock` 再装。
- **多 demo baseURL**：`page.goto('/')` 无 `use.baseURL` 时直接报 invalid URL；多端口 demo 场景在 config 设默认 baseURL，另一端口用绝对地址。
- **antdv 选择器**：下拉选项用 `.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option` 定位（antdv dropdown 常驻 DOM 靠 hidden 类切换）；hash 路由 demo 首路由直接 `waitForURL(/#\//)` 即可，不要假设存在「首页」菜单。
- **E2E 与单测分工**：E2E 断言 console.error / pageerror 为空 + 关键路径可见性，不重复单测的 props/emit 细粒度断言；webServer 以 `pnpm --filter <demo> dev --strictPort` 自动拉起，测试完自动回收。
