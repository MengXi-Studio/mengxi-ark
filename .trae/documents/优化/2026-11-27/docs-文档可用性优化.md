# 文档可用性优化 实施方案

## 需求

用户原话：「apps/docs 文档也需要好好优化一下，我看文档都搞不明白具体怎么使用的，还得问你才清楚」。
文档站要自解释：api 结构、配置规则、代码示例对齐实际可运行代码，用户不看源码 / 不问 AI 也能跑通。

## 需求分析

- 涉及：`apps/docs`（VitePress，中文站为主，en 站镜像不在本次范围——结构变更后 en 站如有死链风险需同步核验）。
- 现状缺口盘点（对照框架当前能力）：
  1. `guide/getting-started.md`：安装只列 utils / theme / hooks，用组件需补装 components / biz-components / ant-design-vue 及其 style.css 引入链路缺失；缺「样式引入规则」总表；
  2. `platform/index.md`：缺三大新板块——品牌配置（logo / headerActions / user / userMenu / collapsible）、页签规则（key = fullPath、标题回退链、homeTab、三种 openMode）、页签右键菜单（内置项 / 自定义项 / 禁用规则）；tabService 新方法 closeLeft / closeRight / closeOther / refresh 未收录；createArkRuntime 示例未含 logo / userMenu（与 demo-platform/src/main.ts 不一致）；
  3. `platform/module.md`：MenuItem 字段（key / title / path / icon / children）无字段表；
  4. `guide/components-guide.md`：质量已达标（样式引入 callout + 五步渐进），不动。
- 示例对齐原则：文档代码示例必须与 demo-light / demo-platform 可运行代码一致（复制即可跑）。

## 伪代码设计（文档结构级）

### getting-started.md 追加

```
## 安装（按需分层）
基础三件套 → 组件包（可选）→ 对应 ant-design-vue

## 样式引入规则（表）
| 包 | 引入方式 |
| theme | import '@mengxi-ark/theme' |
| components / biz-components / runtime / dsl-render | import '<pkg>/style.css' |
| ant-design-vue | reset.css 基线（控件样式 CSS-in-JS 注入）|

## 使用组件（可选）
安装命令 + 最小示例（与 demo-light App.vue 对齐）
```

### platform/index.md 追加 / 修订

```
## 品牌配置（内置 Layout）
ArkLayoutOptions 字段表：logo / headerActions / user / userMenu / collapsible
示例对齐 demo-platform main.ts（logo: CloudFilled + userMenu 声明式菜单）

## 页签规则（表）
key 规则 / 标题回退链 / homeTab / openMode 三策略

## 页签右键菜单
内置项（刷新 / 关闭左侧 / 右侧 / 其他，自动禁用）+ tabContextMenu 自定义项
tabService 批量方法补入「Tab 工作台」小节
```

### platform/module.md 追加

```
## 菜单项字段（表）
MenuItem: key / title / path / icon / children
```

## 疑问清单

### Q1 文档优化的深度：只在现有页面内补齐缺口（方案 A，改动小、结构不变），还是同时重组 getting-started 为「从零到跑起来」完整链路（方案 B，页面更完整但改动大）？（影响：getting-started 结构）

回答：方案 B，重组链路（用户确认，2026-11-27）。

## 实施记录

### 方案落地形态（与伪代码差异）

- 与伪代码一致，另按方案 B 将 getting-started 重组为「第 1 步安装（分层表）→ 第 2 步样式引入（一条规则 + 规则表 + main.ts 完整样板）→ 第 3 步 utils 与 hooks → 第 4 步使用组件 → 暗色 → 主题覆盖 → 下一步」；
- en 镜像三页（getting-started / platform/index / platform/module）由子代理同步重写：章节标题英译，代码块与中文页逐字一致（脚本比对 7 + 8 + 3 块全部相同），内部链接指向 en 站真实页面与英文锚点（如 `/en/platform/#tab-rules`）。

### 变更文件清单

| 文件 | 变更 |
| --- | --- |
| `apps/docs/src/guide/getting-started.md` | 重写为完整链路：分层安装表（何时装什么包）、样式引入一条规则 + 规则表、main.ts 完整样板（对齐 demo-light）、SearchForm/EnhanceTable 最简示例、下一步补组件实战与中台进阶入口 |
| `apps/docs/src/platform/index.md` | createArkRuntime 示例对齐 demo-platform（logo / userMenu / icons / message）；新增「页签规则」表、「页签右键菜单」（内置项 + 禁用规则 + tabContextMenu 配置）、「内置 Layout 品牌配置」表（7 项）与 headerActions / user 自定义组件示例；tabService 补 closeLeft / closeRight / closeOther / refresh |
| `apps/docs/src/platform/module.md` | 新增「菜单项字段（MenuItem）」字段表（key/title/path/icon/children）+ `meta.title` 页签标题联动说明（锚点链接到页签规则） |
| `apps/docs/src/en/guide/getting-started.md` | en 镜像同步重写 |
| `apps/docs/src/en/platform/index.md` | en 镜像同步重写（含全部新增板块） |
| `apps/docs/src/en/platform/module.md` | en 镜像同步重写（含 MenuItem 字段表） |

### 验证方式与结果

- `pnpm --filter docs build`：通过（exit 0，VitePress 1.6.4，死链检查通过）；
- en/zh 代码块逐字一致性：子代理脚本比对 18 块全部一致；
- 全站锚点引用核查：无其他页面引用三个页面旧锚点（grep 确认）；
- 文档示例与可运行代码对齐：main.ts 样板 = demo-light/src/main.ts；platform 示例 = demo-platform/src/main.ts；组件示例 = demo-light ComponentsDemo / components-guide 第 1 步。

### 遗留 TODO

- 其余 en 镜像页（api / dsl / guide 其余页面）与中文页的既有内容差异未在本任务范围内重核（本次仅同步了改动的三页）。
