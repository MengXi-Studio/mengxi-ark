# @mengxi-ark/cli

## 1.0.0-beta.0

### Major Changes

- v1.0.0-beta 公测首发：M0–M4 全量落地。utils（四类纯函数）/ theme（--mx-* Design Token + 暗色）/ hooks（useRequest / useTable / useForm 等）/ components（适配器 + 九组件）/ biz-components（Lov / DocumentTable 双模式）/ runtime（createArkRuntime + 五 service + 内置工作台 Layout）/ dsl-render（Schema 三件套 + validateSchema + 三渲染器 + 13 项映射表）/ cli（create-mengxi-ark 双模板 + 分档 .trae/rules）。

### Minor Changes

- b7253ed: M4 脚手架：create-mengxi-ark 命令落地（@clack/prompts 交互：模板选择 / 目录名 / 非空目录确认）——templates/light 轻量模板（utils / theme / hooks / components / biz-components 直装直用，无 runtime）与 templates/platform 中台基座模板（createArkRuntime + systemModule 示例 + 工作台 Layout），模板随包发布并内置分档 .trae/rules/ 用法速查（ark-light.md / ark-platform.md）；占位符 **PROJECT_NAME** / **ARK_VERSION** 注入，框架包版本与 cli 自身版本绑定对齐；附拷贝 / 渲染 / 版本读取纯函数单测。
