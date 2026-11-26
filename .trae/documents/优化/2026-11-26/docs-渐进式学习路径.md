# docs 渐进式学习路径重构（入门到精通）实施方案

## 需求

用户要求：`apps/docs` 文档内容及格式需要优化，要体现从入门到精通的渐进过程。

## 需求分析（现状盘点）

### 现有结构（上一轮重构后）

```
src/
├── index.md                    # Hero 首页
├── guide/                      # 介绍 / 快速上手 / 反馈渠道（3 页）
├── api/                        # 7 个包的参考手册（utils/theme/hooks/4 组件页）
├── platform/                   # 中台进阶 3 页（createArkRuntime / registerModule / 上下文）
├── dsl/                        # DSL 1 页
├── changelog.md                # 自动聚合
└── en/                         # 英文镜像（结构同步）
```

### 痛点（对照「渐进学习路径」）

1. **缺少中间梯度**：现有页面两极分布——guide 只有介绍 + 快速上手（入门），api 是参考手册（查阅），没有「核心概念 → 组件实战 → 进阶技巧」的教程层，新手学完快速上手后不知道下一步学什么；
2. **规范 §12 要求的「迁移指南」板块缺失**；
3. **侧栏分组命名平铺**（入门 / 中台进阶 / DSL / 通用包 / 组件库），未体现学习阶段递进；
4. 首页 / 介绍页没有「学习路径」导引。

### 目标结构（草案，待疑问澄清后定稿）

```
src/guide/
├── introduction.md      # 入门：介绍（补「学习路径」导引小节）
├── getting-started.md   # 入门：快速上手（已有）
├── core-concepts.md     # 核心：框架核心概念（分层架构 / 双模式契约 / token 换肤 / UI 适配器）
├── components-guide.md  # 核心：组件实战（SearchForm→EnhanceTable→Lov→DocumentTable 渐进示例）
├── migration.md         # 精通：迁移指南（规范 §12 要求，对齐 antdv / Element Plus 语义）
└── feedback.md          # 反馈渠道
```

侧栏渐进分组（guideSidebar 改造，中英同步）：

```
入门：介绍 / 快速上手
核心：核心概念 / 组件实战
进阶：中台进阶（Runtime 基座 3 页）/ DSL 配置渲染
精通：迁移指南
其他：反馈渠道 / 更新日志
```

- `api/` 保持参考手册定位不动（从教程侧栏可跳转）；
- 规范红线：快速上手（入门层）仍禁提 runtime；platform/dsl 文件位置不动（仅侧栏归组到「进阶」）。

## 伪代码设计

（纯文档任务：新增 3 页教程 md + 既有页增补「学习路径」小节 + zh/en 侧栏分组重命名 + en 镜像同步翻译；新增页面示例代码须与 demo-light 可运行代码对齐，样式只引用 --mx-* token。）

## 疑问清单

### Q1 新增教程页的范围（影响：工作量与内容深度）

方案 a（推荐）：新增 3 页——core-concepts（核心概念）、components-guide（组件实战）、migration（迁移指南，规范要求）；
方案 b：只新增 migration；
方案 c：全部保持现有页面，仅重组侧栏命名。
选哪个？

回答：a——新增 3 页。

### Q2 既有页面的内容增强（影响：改动面）

方案 a（推荐）：introduction 增补「学习路径」导引小节；getting-started 末尾补「下一步」链到核心概念页；其余 api 参考页不动；
方案 b：所有页面（含 api）都重写增强。
选哪个？

回答：b——所有页面（含 api 参考页）都重写增强（示例须与各包 types.ts 导出核对一致）。

### Q3 组件实战页的示例口径（影响：内容质量）

方案 a（推荐）：按「渐进示例」写——从 props 驱动最简用法起步，逐步叠加插槽自定义 / 双模式切换 / 基座联动，示例代码与 demo-light 对齐可复制运行；
方案 b：按组件逐个平铺 API 用法（与 api/ 参考页重复）。
选哪个？

回答：a——渐进叠加。

## 实施记录

### 方案落地形态（与伪代码设计的差异）

- 与草案一致：新增 guide/core-concepts（核心概念）/ components-guide（组件实战五步渐进）/ migration（迁移指南）3 页；侧栏 guideSidebar 改为「入门 / 核心 / 进阶 / 精通 / 其他」五组（进阶组收纳 platform 3 页 +
  Schema 与三渲染器，zh/en config 同步）。
- Q2 用户选「全部重写」：api/ 7 页各补「适用场景」小节 + 页尾「相关教程」链，props/events/slots 表格与各包 types.ts 核对（修正 2 处不一致：enhancetable 缺 expandedRowKeys / update:expandedRowKeys /
  expandedRow 三条目；documenttable permissionCode 行多余默认值列）；platform/
  3 页补前置知识 + 下一步串联；dsl 页补前置知识 + 手写 SFC 强调；introduction 增学习路径四阶段表；getting-started 下一步链 core-concepts；首页增「渐进式学习路径」feature 卡。
- 顺带修正 1 处 SSR 编译错误（正文行内代码含 `{{ }}` 被 Vue 编译，已改写）。

### 变更文件清单

- 新增：src/guide/{core-concepts,components-guide,migration}.md + src/en/guide/ 同名 3 页
- 重写增强：src/index.md、src/guide/{introduction,getting-started}.md、src/api/ 7 页、src/platform/ 3 页、src/dsl/index.md 及 en 镜像对应 14 页
- 配置：.vitepress/config/{zh,en}.ts guideSidebar 渐进五组
- 任务文档：本文件；发布检查清单无涉

### 验证方式与结果

1. `pnpm --filter docs build` 两轮：首轮 en/index.md frontmatter details 值含冒号未加引号致 YAML 解析失败（zh 同问题一并加引号），修复后构建通过（16.21s，死链检查通过，含 3 个新页 HTML 产物）。
2. preview + 浏览器抽验 4 项全 PASS：首页「渐进式学习路径」feature 卡渲染且控制台零报错；introduction 页侧栏五组齐全（精通组含迁移指南、进阶组含 platform 三页 + Schema）；core-concepts /
   migration 页正常渲染且页尾有下一步 / 相关教程链。
3. 红线自检：introduction / getting-started（中英）无 runtime 字样（case-insensitive grep）。

### 遗留 TODO

- 组件实战页示例与 demo-light 当前版本对齐；后续组件 API 变更时需同步两处（api 参考页 + 实战页）。
- 无其他遗留；docs 为 private 应用包，无需登记 changeset。
