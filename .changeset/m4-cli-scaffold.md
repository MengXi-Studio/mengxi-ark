---
'@mengxi-ark/cli': minor
---

M4 脚手架：create-mengxi-ark 命令落地（@clack/prompts 交互：模板选择 / 目录名 / 非空目录确认）——templates/light 轻量模板（utils / theme / hooks / components / biz-components 直装直用，无 runtime）与 templates/platform 中台基座模板（createArkRuntime + systemModule 示例 + 工作台 Layout），模板随包发布并内置分档 .trae/rules/ 用法速查（ark-light.md / ark-platform.md）；占位符 __PROJECT_NAME__ / __ARK_VERSION__ 注入，框架包版本与 cli 自身版本绑定对齐；附拷贝 / 渲染 / 版本读取纯函数单测。
