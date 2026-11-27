# @mengxi-ark/cli

## 1.0.0-beta.1

### Patch Changes

- 4d48d24: 修复预发布包缺失构建产物：beta.0 发布时未执行构建，tarball 仅含 package.json 与 LICENSE；发布流程补充 pnpm build 后以 beta.1 重新发布完整产物

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- create-mengxi-ark 脚手架（@clack/prompts 交互：模板选择 / 目录名 / 非空目录确认）。
- 双模板：templates/light 轻量模板（utils / theme / hooks / components / biz-components 直装直用，无 runtime）与 templates/platform 中台基座模板（createArkRuntime + systemModule 示例 + 工作台 Layout）。
- 模板随包发布并内置分档 `.trae/rules/` 用法速查（ark-light.md / ark-platform.md）；占位符注入框架包版本，与 cli 版本绑定对齐。
