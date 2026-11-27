---
'@mengxi-ark/utils': patch
'@mengxi-ark/theme': patch
'@mengxi-ark/hooks': patch
'@mengxi-ark/components': patch
'@mengxi-ark/biz-components': patch
'@mengxi-ark/runtime': patch
'@mengxi-ark/dsl-render': patch
'@mengxi-ark/cli': patch
---

修复预发布包缺失构建产物：beta.0 发布时未执行构建，tarball 仅含 package.json 与 LICENSE；发布流程补充 pnpm build 后以 beta.1 重新发布完整产物
