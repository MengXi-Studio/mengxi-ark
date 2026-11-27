# CLI 模板能力对齐 实施方案

## 需求

用户原话：「packages/cli/templates 请你根据目前的功能，优化一下这两个模板」。
两个模板（light / platform）需反映框架当前全部能力：四包独立 style.css 引入、runtime 品牌配置（logo / headerActions / user / userMenu / collapsible）、页签右键菜单、tabService 批量关闭 / 刷新等。

## 需求分析

- 涉及包：`packages/cli`（templates 目录，模板文件非发布代码，随 cli 包构建打包进产物）。
- 影响面：
  - light 模板：`src/App.vue`（补 hooks 能力展示）、`README.md`（补样式引入与 hooks 说明）；
  - platform 模板：`src/main.ts`（展示 logo / userMenu / tabContextMenu 新配置）、`package.json`（如展示图标需新增 `@ant-design/icons-vue`）、`README.md`（补内置 Layout 配置速览）、`.trae/rules/ark-platform.md`（同步新能力速查）；
  - 模板保持薄原则：能力通过 npm 包引入，模板只做「可删除的示例」；注释引导使用者去哪改。
- 依赖边界：模板是应用层，import 上层包合法，无边界风险。
- 不涉及 changesets（cli 包为 0.x，模板内容变更不改变 API；如需可并入后续 cli changeset）。

## 伪代码设计

### platform 模板 main.ts（对齐 demo-platform/src/main.ts 活示例）

```
createArkRuntime({
  router,
  logo: CloudFilled                    // 图标组件（需 @ant-design/icons-vue）
  userMenu: { items: [个人中心, 退出登录], onClick }   // 声明式用户菜单
  tabContextMenu: { builtin: true, items: [自定义项], onClick }  // 页签右键菜单
  context: { appName, user, permissions, lovCache }
  modules: [systemModule]
  homeTab: { route: '/home', title: '首页' }
  onSessionExpired
})
```

### light 模板 App.vue

在现有两卡片基础上追加一张 useRequest 卡片（hooks 能力可见），注释标注「示例可删」。

## 疑问清单

### Q1 platform 模板是否新增 `@ant-design/icons-vue` 依赖，用于展示 logo / 菜单图标 / 用户菜单图标（与 demo-platform 一致）？不引入则 logo / userMenu.icon 以注释形式说明，不实际演示。（影响：模板依赖体积与演示完整度）

回答：引入（用户确认，2026-11-27）。

### Q2 light 模板 App.vue 是否需要追加 useRequest（hooks）演示卡片？模板保持薄 vs 能力可见性的取舍。（影响：light 模板 App.vue 内容）

回答：追加（用户确认，2026-11-27；README 能力速览已列 hooks，模板需体现）。

## 实施记录

### 方案落地形态（与伪代码差异）

- 与伪代码一致；补充两点：菜单图标也在 systemModule.ts 中落地演示（HomeOutlined / SettingOutlined）；`@ant-design/icons-vue` 版本对齐 demo-platform 的 `^7.0.1`。

### 变更文件清单

| 文件 | 变更 |
| --- | --- |
| `packages/cli/templates/platform/package.json` | 新增 `@ant-design/icons-vue@^7.0.1` 依赖 |
| `packages/cli/templates/platform/src/main.ts` | 新增 `logo: CloudFilled`、`userMenu`（个人中心/退出登录 + onClick）、`tabContextMenu`（内置项 + 自定义「固定页签」示例）、`homeTab`，全部带注释引导 |
| `packages/cli/templates/platform/src/modules/systemModule.ts` | 菜单项补 `icon` 字段演示 |
| `packages/cli/templates/platform/README.md` | 新增「内置 Layout 配置速览」表（logo/userMenu/headerActions/tabContextMenu/collapsible/homeTab）+ 页签规则段落 |
| `packages/cli/templates/platform/.trae/rules/ark-platform.md` | 新增「内置 Layout 配置」速查节（品牌 / 页签规则 / 右键菜单 / tabService 命令式方法） |
| `packages/cli/templates/light/src/App.vue` | 追加 useRequest 演示卡片（loading / error / retry），样式只用 `--mx-*` token |
| `packages/cli/templates/light/README.md` | 新增「入口样式引入（重要）」章节（theme + style.css + antd reset 完整链路） |

### 验证方式与结果

- `pnpm --filter @mengxi-ark/cli build`：通过（exit 0）；
- API 签名核对：`useRequest` 返回 `retry`、默认 `immediate: true`（对照 `packages/hooks/src/useRequest/index.ts` 与单测）；`logo / userMenu / tabContextMenu / homeTab` 字段对照 `packages/runtime/src/types.ts`；
- 运行验证：demo-platform（与模板同套 API）浏览器实测通过——logo 图标、菜单图标、页签右键内置项（刷新/关闭左侧/右侧/其他）+ 刷新无报错、用户下拉菜单、控制台零报错；
- 模板代码不含 runtime 未导出 API；模板文件随 cli 构建打包正常。

### 遗留 TODO

- cli 包 changeset 未登记（模板内容变更，参考前次模板样式修复 f3c7062 同样未单独登记）；建议下次 cli 发版时并入 Minor changeset 说明「模板补齐内置 Layout 新配置演示」。

### 追加修复（2026-11-27）：模板目录 TS 报错（找不到 vite/client、找不到模块）

- 现象 1：IDE 打开 `templates/light/tsconfig.json` 报「找不到 "vite/client" 的类型定义文件」。
  - 根因：`types: ["vite/client"]` 与 `src/vite-env.d.ts` 的 `/// <reference types="vite/client" />` 重复，且模板目录无 node_modules 无法解析。
  - 修复：两个模板移除 `compilerOptions.types: ["vite/client"]`，保留三斜线引用（Vite 官方写法）。
- 现象 2：移除后 `templates/platform/src/main.ts` 暴露大量 TS2307（vue / @ant-design/icons-vue / @mengxi-ark/runtime / ./App.vue）与 3 处 TS7006 连带报错。
  - 分析（实证）：把 import 映射到仓库已有依赖后重跑 tsc，模块全部解析、TS7006 消失 → **模板代码本身无类型错误**，报错纯粹是「目录内无依赖」。
  - 根因：`templates/*` 是含占位符的静态脚手架目录，不是 workspace 包，目录内没有 node_modules。
  - 修复（用户确认方案）：仓库根 `package.json` devDependencies 补齐模板所需依赖——`vue` / `vue-router` / `ant-design-vue` / `@ant-design/icons-vue` / `vite` / `@vitejs/plugin-vue` + 6 个 `@mengxi-ark/*`（`workspace:*`）。根为 private，不参与发布与 changesets；cli 与内部包无新增依赖边，不影响构建拓扑。
- 验证：
  - 移除 `types` 后 `tsc -p` 两模板：TS2688 消失；
  - `pnpm install --no-frozen-lockfile` 后重跑 `tsc -p`：platform 仅剩 3 处 `.vue` 单文件模块解析、light 仅剩 1 处（plain tsc 不支持 SFC，IDE 由 Volar 处理），**无其他类型错误**；
  - `tsc -p apps/demo-light/tsconfig.json` 无 vite/client 报错，消费者行为不变；
  - `pnpm --filter @mengxi-ark/cli build` 通过；`pnpm-lock.yaml` 新增 39 行。
- 记录：`packages/cli/README.md` 增加「仓库内开发模板」说明，注明根 devDependencies 用途，避免被误清理。
