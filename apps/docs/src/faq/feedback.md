# 反馈渠道

曦舟采用「Issue 收问题、Discussions 聊方案」的双轨反馈机制，欢迎在公测期（`1.0.0-beta.x`）积极反馈。

## Issue（问题与需求）

请按模板提交，便于快速定位与响应：

| 模板 | 适用场景 |
| --- | --- |
| [Bug 报告](https://github.com/MengXi-Studio/mengxi-ark/issues/new?template=bug_report.md) | 组件 / hooks / 基座行为不符合文档或报错 |
| [功能请求](https://github.com/MengXi-Studio/mengxi-ark/issues/new?template=feature_request.md) | 新组件、新 hook、新能力建议 |
| [文档反馈](https://github.com/MengXi-Studio/mengxi-ark/issues/new?template=docs_feedback.md) | 文档错漏、示例不可运行 |

提交 Bug 时请附：框架包版本（`pnpm list @mengxi-ark/utils`）、Vue / UI 库版本、最小复现代码或截图。

## Discussions（讨论与公告）

- **版本公告**：每个 Release 的变更与迁移要点会在 [Discussions](https://github.com/MengXi-Studio/mengxi-ark/discussions) 发布；
- **使用交流**：集成方案、双模式选型、基座扩展等开放讨论；
- **Roadmap 讨论**：里程碑规划的意见征集。

## 贡献修复

欢迎直接提 PR：fork → `fix/*` 或 `feature/*` 分支 → 关联 Issue → CI 全绿后由维护者 review 合并，流程见 [CONTRIBUTING](https://github.com/MengXi-Studio/mengxi-ark/blob/master/CONTRIBUTING.md)。

## 升级须知

- Beta 版本（`1.0.0-beta.x`）经 npm `beta` dist-tag 分发：`pnpm add @mengxi-ark/utils@beta`；
- Beta 期间允许 API 微调，正式 v1.0.0 发布前会在公告中列明全部 breaking 变更与迁移方式。
