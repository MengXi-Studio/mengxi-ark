# 实施日志索引

> 每完成一个任务（`workflow.md` 第四步），在此追加一行：日期 · 任务文档相对链接 · 一句话结果。

- 2026-11-24 · [新增/2026-11-24/repo-M0-monorepo基建.md](./新增/2026-11-24/repo-M0-monorepo基建.md) · M0 monorepo 基建完成：8 包壳 + internal 三件套 +
  CI/Release 工作流，install/deps:check/peer:check/lint/typecheck/test/build 全部通过。
- 2026-11-25 · [新增/2026-11-24/M1-底层基础包.md](./新增/2026-11-24/M1-底层基础包.md) · M1 底层基础包完成：utils 22 函数 + theme token 体系 + hooks 六 hook（115 用例）+
  demo-light/docs，全部门禁与浏览器运行验证通过，changeset 已登记。
- 2026-11-25 · [新增/2026-11-25/M2-组件层.md](./新增/2026-11-25/M2-组件层.md) · M2 组件层完成：UI 适配器双库统一契约 + components 九组件 + biz-components（Lov 双模式 / DocumentTable）+
  demo-light 六面板（含基座 mock 降级切换）+ docs 四组件页，typecheck/build/单测（45 用例）/门禁/浏览器运行验证全过，changeset 已登记（双包 minor）。
- 2026-11-25 · [新增/2026-11-25/M3-Lov级联与行展开子表.md](./新增/2026-11-25/M3-Lov级联与行展开子表.md) · M3 完成：适配器统一契约扩展受控行展开（antdv/EP/stub 三实现）+ EnhanceTable/DocumentTable 透传 + Lov
  cascadeSource 级联（父变清空/父空禁用，undefined 视为未启用级联）+ demo 两处演示 + docs 两节，单测 54 用例/门禁/浏览器验证全过，changeset 双包 minor 已登记。
- 2026-11-25 · [新增/2026-11-25/M3-Lov级联与行展开子表.md](./新增/2026-11-25/M3-Lov级联与行展开子表.md) · 追加修复：AntdvDataTable 启用行展开时传哑键 childrenColumnName 禁用树形嵌套语义，消除 antdv「nested
  Table」/「expandIconColumnIndex deprecated」两条控制台告警（components patch changeset），浏览器实测 console 干净、展开功能正常。
- 2026-11-26 · [新增/2026-11-26/M4-Lov弹窗自定义与单元格级权限.md](./新增/2026-11-26/M4-Lov弹窗自定义与单元格级权限.md) · M4 完成（遗留 TODO 全闭环）：Lov 弹窗自定义（columns 覆盖 + bodyCell 槽）+
  DocumentTable 单元格级权限（permissionCode / editable 函数化 / permissions 兜底 / 无权限跳过必填校验），单测 37 用例、门禁/构建/docs 全过、浏览器验证 PASS，changeset（biz-components minor）已登记。
- 2026-11-26 · [新增/2026-11-26/runtime-中台基座.md](./新增/2026-11-26/runtime-中台基座.md) · M3 中台基座完成：runtime 落地 createArkRuntime（插件+句柄二合一）+ 五 service（tab 三种 openMode / menu / registry / session /
  context）+ 内置可替换 Layout，单测 39 用例、全门禁全绿，新建 demo-platform（两模块 + Lov 基座联动 / dialog 弹窗 / 降级切换演示）与 docs 中台进阶板块，浏览器验证 6 项全 PASS 控制台干净，changeset（runtime
  minor）已登记。

- 2026-11-26 · [新增/2026-11-26/M4-dsl渲染与cli脚手架.md](./新增/2026-11-26/M4-dsl渲染与cli脚手架.md) · M4 完成（实施方案收官）：dsl-render 落地 Schema 三件套 + validateSchema +
  13 项映射表 + 三渲染器（函数式联动 / 表单校验 / document 单据模式 / 槽透传），cli 落地 create-mengxi-ark（@clack/prompts + 双模板 + 分档 .trae/rules + 版本绑定），demo 双端 DSL 演示页 + docs
  DSL 板块，单测 46 用例、全仓 25 门禁任务全绿、浏览器三页验证 PASS（修复 v-bind undefined 透传覆盖与模板导出名两处问题），changeset 双包 minor 已登记。
- 2026-11-26 · [新增/2026-11-26/repo-M5-Beta公测与v1发布.md](./新增/2026-11-26/repo-M5-Beta公测与v1发布.md) · M5 完成：changesets pre beta 全包 1.0.0-beta.0 +
  CHANGELOG 生成，README/Roadmap 更新，发布检查清单（含 Discussions 公告模板），docs 反馈渠道页，Playwright E2E 冒烟落地（双 demo 2/2 通过、零报错断言）；npm publish 留维护者按清单执行，正式 v1.0.0 待 pre exit。
- 2026-11-26 · [优化/2026-11-26/docs-文档站重构.md](./优化/2026-11-26/docs-文档站重构.md) · docs 文档站重构完成（参考 unix-router 范式）：config 拆分四文件（shared/zh/en/index + DOCS_BASE base + local 搜索 + footer +
  editLink）+ theme 注入 home-hero-after HomeBadges 徽章 + 内容迁入 src/（13 页平移 + Hero 首页 / introduction / changelog 新增 + /packages→/api 链接改写）+ src/en 16 页完整英文镜像，构建死链检查通过（修复 frontmatter
  @ 开头标量需引号），preview 浏览器抽验中英双站 3 项 PASS 零报错。
- 2026-11-26 · [优化/2026-11-26/docs-渐进式学习路径.md](./优化/2026-11-26/docs-渐进式学习路径.md) · docs 渐进式学习路径重构完成：新增核心概念 / 组件实战（五步渐进示例对齐 demo-light）/ 迁移指南 3 页（中英同步），api
  7 页补适用场景并与 types.ts 核对修正 2 处不一致，platform/dsl 页补前置知识与下一步串联，首页增学习路径卡，侧栏改「入门/核心/进阶/精通/其他」五组；构建死链检查通过（修复 frontmatter 冒号值加引号），浏览器抽验 4 项 PASS 零报错，轻量模式红线（introduction/getting-started 无 runtime）自检通过。
