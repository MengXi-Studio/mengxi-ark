# @mengxi-ark/dsl-render

## 1.0.0-beta.0

### Major Changes

- v1.0.0-beta 公测首发：M0–M4 全量落地。utils（四类纯函数）/ theme（--mx-* Design Token + 暗色）/ hooks（useRequest / useTable / useForm 等）/ components（适配器 + 九组件）/ biz-components（Lov / DocumentTable 双模式）/ runtime（createArkRuntime + 五 service + 内置工作台 Layout）/ dsl-render（Schema 三件套 + validateSchema + 三渲染器 + 13 项映射表）/ cli（create-mengxi-ark 双模板 + 分档 .trae/rules）。

### Minor Changes

- b7253ed: M4 DSL 配置渲染引擎：从占位壳落地为真实实现——QuerySchema / FormSchema / TableSchema 强 TS 类型（kind 判别 + 函数式 visible / rules 联动校验）、validateSchema 结构校验（带路径错误清单）、组件映射注册表（默认 13 项：适配器原子 + Lov / SearchForm / EnhanceTable / DocumentTable / MxDialog 等，业务可同 key 覆盖）、QueryRenderer / FormRenderer / TableRenderer 三渲染器（只渲染不请求：search / submit / save 事件抛上层，FormRenderer 暴露 validate，TableRenderer 透传 toolbar / bodyCell / expandedRow 槽），双模式由 biz-components 自身 inject 探测继承；附 37 项单测、demo-light / demo-platform DSL 演示页与 VitePress「DSL 配置渲染」板块。

### Patch Changes

- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies [dc251b9]
- Updated dependencies
  - @mengxi-ark/components@1.0.0-beta.0
  - @mengxi-ark/biz-components@1.0.0-beta.0
