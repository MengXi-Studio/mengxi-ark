# docs 文档站重构（参考 unix-router）实施方案

## 需求

参考 `MengXi-Studio/unix-router` 仓库 `packages/docs` 的组织方式，重新设计 `apps/docs` 文档项目。

## 需求分析（参考仓库调研结论，已核实 raw 源码）

### unix-router/docs 结构范式

```
packages/docs/
├── .vitepress/
│   ├── config/
│   │   ├── index.ts    # defineConfig：...shared + base(DOCS_BASE 环境变量) + srcDir './src' + locales(root=zh, en)
│   │   ├── shared.ts   # title / lastUpdated / markdown 主题 / head(og/twitter) / themeConfig(logo、local 搜索+中文翻译、socialLinks、footer)
│   │   ├── zh.ts       # zh locale：description、head SEO、editLink、outlineTitle、nav、sidebar（按 '/guide/' '/api/' 路径前缀分组）
│   │   └── en.ts       # en locale 镜像
│   └── theme/
│       ├── index.ts    # extends DefaultTheme，Layout 注入 'home-hero-after' 插槽 → HomeBadges
│       └── components/HomeBadges.vue
├── src/                # srcDir：中文内容在 src 根，英文镜像在 src/en/
│   ├── guide/          # 分层：入门(介绍/安装/快速开始) → 核心功能 → 进阶 → 插件 → 精通(原理/实战/兼容性/差异/FAQ)
│   ├── api/            # 核心 API 逐函数一页 + type-*.md 逐类型一页
│   └── changelog.md    # 更新日志页
└── package.json        # 独立 name/version，vitepress dev/build/preview
```

### 我方现状（apps/docs）

- 扁平结构：guide/ packages/ platform/ dsl/ faq/ 直接放根目录（无 srcDir）；config.mts 单文件；无搜索 / footer / editLink / 自定义 theme / 首页徽章 / changelog 页；无 i18n。
- 现有页面资产：guide/getting-started、packages/{utils,theme,hooks,searchform,enhancetable,lov,documenttable}、platform/{index,module,context}、dsl/index、faq/feedback、index.md（首页）。
- 规范 §12 板块契约必须保持：快速上手（轻量模式，禁提 runtime）→ 中台进阶 → DSL；附 API 文档 / 迁移指南 / FAQ。

### 重构映射（初步）

```
apps/docs/
├── .vitepress/
│   ├── config/{index,shared,zh}.ts        # 单文件拆三（en 留 TODO，结构预留 locales 字段）
│   └── theme/{index.ts, components/HomeBadges.vue}
├── src/                                    # srcDir './src'
│   ├── index.md                           # 首页（Hero + HomeBadges + 特性卡）
│   ├── guide/getting-started.md           # 快速上手（轻量模式）
│   ├── packages/*.md                      # API 文档（沿用现 7 页，板块名对齐规范）
│   ├── platform/{index,module,context}.md # 中台进阶
│   ├── dsl/index.md                       # DSL
│   ├── faq/feedback.md                    # FAQ
│   └── changelog.md                       # 汇总 v1.0.0-beta.0 各包 CHANGELOG
└── package.json
```

新增能力：本地搜索（local provider + 中文翻译）、footer、editLink（指向本仓库对应文件）、outlineTitle、首页 HomeBadges 徽章（npm version / license / CI）。

## 伪代码设计

（无运行时 API；结构迁移 + config 拆分 + theme 注入，链接需全量改写并过 VitePress 死链检查）

## 疑问清单

### Q1 是否引入英文镜像（src/en/）（影响：工作量与维护）
方案 a（推荐）：首期只做中文，config/index.ts 预留 locales 结构（root zh），src/en 留 TODO 不建空壳；
方案 b：完整 en 镜像（需翻译全部 15+ 页，工作量大且无维护者）。
选哪个？

回答：b——完整 en 镜像，15+ 页全部翻译并持续同步。

### Q2 内容分区与侧栏组织（影响：信息架构）
方案 a（推荐）：对齐参考范式——guide/（介绍+快速上手+安装）、api/（按包逐页，替换现 packages/ 命名）、platform/、dsl/、faq/，侧栏按板块分组（入门 / 组件与 API / 中台进阶 / DSL / FAQ / 更新日志）；
方案 b：保持现有 packages/ 命名仅迁目录。
选哪个？

回答：a——guide/api 分区，侧栏按板块分组。

### Q3 首页改造（影响：index.md 与自定义 theme）
方案 a（推荐）：Hero（slogan + 行动按钮）+ HomeBadges（CI / License / npm beta 徽章）+ 特性六卡片 + 快速安装代码块；
方案 b：保持现首页文案，仅加徽章。
选哪个？

回答：a——完整 Hero 首页 + HomeBadges + 特性卡 + 快速安装。

### Q4 changelog 页形态（影响：内容同步方式）
方案 a（推荐）：`src/changelog.md` 手工汇总 v1.0.0-beta.0 各包变更要点，页脚标注「完整日志见各包 CHANGELOG.md」，不引入构建期自动聚合（避免自定义 loader 复杂度）；
方案 b：构建期脚本聚合各包 CHANGELOG.md 生成页面。
选哪个？

回答：a——手工汇总 v1.0.0-beta.0 变更要点。

### Q5 交付确认
重构范围 = 目录迁移（src/）+ config 拆分（shared/zh/index，en 预留）+ theme（HomeBadges）+ 搜索/footer/editLink + 首页改造 + changelog 页；DoD：VitePress build 死链检查通过 + 手动抽验页面渲染。确认？

回答：确认；Q1 按方案 b 做 en 完整镜像；config 拆分为 shared/zh/en/index 四文件。

## 实施记录

### 方案落地形态（与伪代码设计的差异）

- 与原映射差异：Q2 确认后 `packages/` 更名为 `api/`（原计划沿用 packages/ 命名）；Q1 选 b，en 镜像从「预留」升级为完整翻译；新增 `guide/introduction.md`（提炼自 README）与 `changelog.md`（手工汇总）。
- config 拆分为四文件 `.vitepress/config/{index,shared,zh,en}.ts`：shared 承载 title / lastUpdated / markdown 双代码主题（github-light / one-dark-pro）/ og & twitter head / local 搜索 / socialLinks（GitHub + npm 组织）/ footer；zh、en 各自持有 nav + sidebar（按 `/guide/` `/api/` `/platform/` `/dsl/` 前缀分组）+ editLink（指向 `mengxi-ark/edit/master/apps/docs/src/:path`）+ docFooter / outlineTitle / 暗色切换文案；index 承载 `srcDir './src'`、`base = process.env.DOCS_BASE || '/mengxi-ark/'`、locales（root=zh-CN link `/`，en=en-US link `/en/`）。
- theme：`.vitepress/theme/index.ts` extends DefaultTheme，`home-hero-after` 插槽注入 `components/HomeBadges.vue`（CI / License / npm utils beta / npm biz-components beta 四徽章，shields.io）。
- 内容迁移 16 页：13 页平移（guide/getting-started、api/×7、platform/×3、dsl/、faq/feedback）+ 3 页新增（Hero 首页、introduction、changelog）；全量内部链接改写 `/packages/*` → `/api/*`（4 处）；en 镜像 16 页全翻译并加 `/en` 前缀（10 处站内链接）；组件默认值中文文案（如 `'查询'`）作为代码真实默认值保留不译。
- 旧文件清理：`config.mts` 删除，根目录 14 个旧 md 与 5 个空目录（guide/packages/platform/dsl/faq）移除。

### 变更文件清单

- 新增：`.vitepress/config/{index,shared,zh,en}.ts`、`.vitepress/theme/{index.ts, components/HomeBadges.vue}`、`src/index.md`、`src/guide/introduction.md`、`src/changelog.md`、`src/en/**`（16 页镜像）
- 迁移改写：`src/guide/getting-started.md`、`src/api/{utils,theme,hooks,searchform,enhancetable,lov,documenttable}.md`、`src/platform/{index,module,context}.md`、`src/dsl/index.md`、`src/faq/feedback.md`
- 删除：`.vitepress/config.mts`、根目录旧 md 14 个与旧目录 5 个

### 验证方式与结果

1. `pnpm --filter docs build`：首轮失败——frontmatter YAML 中 `@` 开头的 title 标量非法（en/index.md），补引号修复中英两版首页 10 处后重跑，构建通过（16.65s，32 页渲染 + 死链检查通过）。
2. `vitepress preview` + 浏览器抽验（Playwright 子代理）3 项全 PASS：中文首页 Hero / 四按钮 / 四徽章渲染且控制台零报错；导航「指南」跳转 `/mengxi-ark/guide/introduction` 且侧栏「入门」分组正确；`/mengxi-ark/en/` 英文首页、英文导航与侧栏均正常。

### 遗留 TODO

- CI 徽章指向 `ci.yml` workflow，若仓库 workflow 文件名不同需同步修正（位置：`theme/components/HomeBadges.vue`）。
- en 镜像为一次性翻译，后续中文页改动需人工同步英文页（任务文档 Q1 已确认接受该维护成本）。
- 无其他遗留；无需登记 changeset（docs 为 private 应用包，不对外发布）。

