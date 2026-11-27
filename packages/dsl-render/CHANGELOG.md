# @mengxi-ark/dsl-render

## 1.0.0-beta.1

### Patch Changes

- 4d48d24: 修复预发布包缺失构建产物：beta.0 发布时未执行构建，tarball 仅含 package.json 与 LICENSE；发布流程补充 pnpm build 后以 beta.1 重新发布完整产物
- Updated dependencies [4d48d24]
  - @mengxi-ark/components@1.0.0-beta.1
  - @mengxi-ark/biz-components@1.0.0-beta.1

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- Schema 三件套：QuerySchema / FormSchema / TableSchema 强 TS 类型（kind 判别 + 函数式 visible / rules 联动校验），validateSchema 结构校验（带路径错误清单）。
- 组件映射注册表：默认 13 项（适配器原子 + Lov / SearchForm / EnhanceTable / DocumentTable / MxDialog 等），业务可同 key 覆盖。
- 三渲染器（QueryRenderer / FormRenderer / TableRenderer）：只渲染不请求，search / submit / save 事件抛上层，FormRenderer 暴露 validate，TableRenderer 透传 toolbar / bodyCell /
  expandedRow 槽；双模式由 biz-components 自身 inject 探测继承。
