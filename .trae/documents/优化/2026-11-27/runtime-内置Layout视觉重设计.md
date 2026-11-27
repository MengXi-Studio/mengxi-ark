# 内置工作台 Layout 视觉重设计 实施方案

## 需求

用户查看 demo-platform 实际运行效果，反馈内置 ArkWorkbenchLayout 视觉粗糙；经确认选择方向「重设计内置 Layout」：修复样式硬伤 + 提升视觉层级，全部仅用 `--mx-*` token（含暗色取值），不引入新依赖、不耦合 UI 库私有类名。

## 需求分析

- 涉及包：`packages/runtime`（layout 组件与样式）、`packages/theme`（新增反白文字 token）；
- 硬伤根因：① antd `.ant-layout .ant-layout-header` 两级选择器特异性高于单类覆盖，header 漏出默认深色 #001529；② antd Sider 默认深色折叠 trigger 未接管，左下角黑色块；③ 菜单/侧栏主题错位；④ logo / 用户区 / 页签条视觉层级弱；
- 依赖边界：runtime layout 是 UI 依赖唯一收敛点（可 import antdv），theme 只加 token 不含逻辑；无反向依赖；
- 变更类型：theme 新增 token → Minor；runtime 纯视觉（无 API / 行为变化）→ Patch。

## 伪代码设计

1. theme 新增语义 token `--mx-color-text-inverse`（基础层 `color.scss` 定义 `$mx-text-inverse` / `$mx-dark-text-inverse` → `semantic.scss` / `dark.scss` 同步输出），用于 primary 底上的反白文字（logo 方块、头像）。
2. Layout 结构微调：
   - Sider `:trigger="null"` 接管折叠，sider 底部自绘折叠条（内联 SVG chevron，hover 用 bg-hover）；
   - logo 改「primary 圆角方块（app 名首字）+ 加粗应用名」，collapsed 时居中只留方块；
   - Menu 显式 `mode="inline"`，去右侧分隔线，菜单区 `flex:1` 独立滚动，折叠按钮钉底；
   - Header 压至 48px，白底（两级选择器覆盖 antd 默认），右侧头像点 + 用户名 + 原有 `header-actions` 插槽不变；
   - Tabs 页签条贴底对齐（nav margin 归零），与 header 同一 1px split 分隔线；
   - Content padding 升为 `--mx-spacing-lg`。
3. 暗色：全部走语义 token，`dark.scss` 已有对应取值，无额外分支。

## 疑问清单

（无——改进方向已由用户确认，视觉细节属于实现决策。）

## 实施记录

- 方案落地形态：与伪代码设计一致，无差异。logo 文字标改为「primary 圆角方块（app 名首字）+ 加粗应用名」方案；折叠条自绘（内联 SVG chevron）替代 antd trigger；菜单区 flex:1 独立滚动、折叠条钉底。
- 变更文件清单：
  - `packages/theme/src/tokens/color.scss`（`$mx-text-inverse` / `$mx-dark-text-inverse`）
  - `packages/theme/src/semantic.scss`、`packages/theme/src/dark.scss`（`--mx-color-text-inverse`）
  - `packages/runtime/src/layout/ArkWorkbenchLayout.vue`（结构：logo 方块、自绘折叠条、头像、`--collapsed` 修饰类）
  - `packages/runtime/src/layout/style/index.scss`（重写；antd 默认样式覆盖统一提升为 `.ark-layout` 两级选择器）
  - `.changeset/theme-text-inverse-token.md`、`.changeset/runtime-workbench-layout-redesign.md`
- 验证方式与结果：
  1. demo-platform 浏览器实测（dev server）：header 白底 48px、无黑色 trigger 块、折叠条收起/展开交互正常（chevron 旋转、菜单单字态）、暗色切换整体生效无白底残留、控制台无 error；
  2. `pnpm turbo run typecheck test build --filter=@mengxi-ark/theme --filter=@mengxi-ark/runtime` 7 tasks 全部通过（runtime 既有单测无回归）；
  3. 暗色下 logo 方块为 primary 蓝底白字，属 theme「primary 梯度暗色保持不变」的既定设计，非缺陷；
  4. 用户反馈整页滚动不符合中台惯例 → 追加视口锁定修复（`.ark-layout` height 100vh + overflow hidden，`__content` flex:1 独立滚动），实测 window scrollY 恒 0、`__content` scrollHeight>clientHeight、滚动时侧栏与 header 位置不动；
  5. 用户询问菜单图标 → 能力本已存在（`MenuItem.icon?: Component`），demo-platform 补装 `@ant-design/icons-vue` 并为两个模块配置 SettingOutlined / AppstoreOutlined，实测展开态图标对齐、收起态仅图标居中、构建通过；
  6. 用户确认追加品牌配置 API：`ArkRuntimeOptions` 新增 `logo?: string | Component`、`headerActions?: Component`、`user?: Component`（自定义用户区，传后替换内置头像+用户名）、`userMenu?: { items: UserMenuItem[]; onClick? }`（声明式用户下拉菜单：保留内置头像+用户名，`user` 存在时忽略）、`collapsible?: boolean`（默认 true，传 false 隐藏左下折叠条并禁用收起；`ArkLayoutOptions` 经 `ARK_LAYOUT_OPTIONS_KEY` 下发），不传行为不变（Minor）；demo-platform 演示 CloudFilled 图标 logo + 声明式 userMenu（个人中心 / 分隔线 / 退出登录），实测头像保留、菜单弹出带分隔线、菜单项点击弹消息、构建通过。实现注：菜单用 antd Menu `items` 数据驱动渲染（template v-for 多子节点 key 编译报错后重构）。runtime 变更类型由 Patch 调整为 Minor。collapsible=false 分支为纯 v-if 静态配置，默认路径经 dev server 实测不变。
  7. 用户要求页签右键菜单（可自定义、封装为公共能力）：`tabService` 新增 `closeLeft` / `closeRight` / `closeOther` / `refresh` + `refreshTick` 刷新信号（Layout 以 refreshTick 作 router-view key 重挂载页面）；`ArkRuntimeOptions.tabContextMenu`（`builtin` 内置项开关 / `items` 自定义项追加 / `onClick` 回调，类型 `TabContextMenuConfig` / `TabContextMenuItem` 随包导出）；内置 Layout 页签右键弹出 Teleport 菜单（禁用规则：目标不可关或对应侧无可关闭页签）。实现踩坑：antdv4 页签无 React 版 `data-node-key` 属性 → 改为按 DOM 页签节点顺序映射 tabs 数组取 key；antd Menu 模板 v-for 多子节点 key 编译报错 → 菜单统一改 items 数据驱动。验证：新增 6 个 tabService 单测全过（26 tests），浏览器实测右键弹出、禁用态正确（homeTab 不可关属正确行为）、关闭其他/关闭左侧动作生效、刷新重挂载、控制台无 error。
- 遗留 TODO：无。
