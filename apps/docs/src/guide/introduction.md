# 介绍

**曦舟 MengXi Ark** 是梦曦工作室（MengXi-Studio）出品的渐进式中台前端框架：**轻量可开箱，中台可插拔**——基座可选、组件可独立、业务组件双模式。基于 Vue 3 + TypeScript 全量构建，MIT 协议免费商用。

## 为什么是曦舟

- **基座可选**：不想用工作台，就只使用组件和 hooks；
- **业务组件双模式**：独立使用 / 中台基座联动，未安装基座自动降级，不抛致命异常；
- **全 TS，单向依赖**：TypeScript strict + 完整 `.d.ts` 类型声明，分层 monorepo 可维护性优先；
- **手写 SFC 优先**：DSL 配置渲染只是加速方案，不是替代方案；
- **UI 库解耦**：适配 Ant Design Vue / Element Plus，UI 差异收敛在适配层，业务用法完全一致；
- **MIT 协议**，免费商用。

## 分层架构

曦舟是 pnpm + Turborepo 管理的分层 monorepo，依赖严格单向流动，禁止反向 / 循环引用：

```
@mengxi-ark/cli（脚手架 create-mengxi-ark）
        ↓
应用层（业务项目 / demo 工程）
        ↓
【可选】@mengxi-ark/runtime　【可选】@mengxi-ark/dsl-render
        ↓
@mengxi-ark/biz-components（双模式业务组件）
        ↓
@mengxi-ark/components（通用增强组件）
        ↓
@mengxi-ark/hooks（通用组合式函数）
        ↓
@mengxi-ark/theme（Design Token 纯样式层）
        ↓
@mengxi-ark/utils（纯函数工具层）
```

**越靠下层越稳定**：utils / theme 谨慎发版（低频稳定），hooks / components / biz-components 持续新增（Minor），runtime / dsl-render 严格控制破坏性变更（Major 必附迁移文档）。

下层包不知道上层包的存在——biz-components 与 runtime 之间只共享 `MX_RUNTIME_CONTEXT_KEY` 契约类型，通过 `inject` 探测联动，**零 import 耦合**：装了基座自动联动，没装自动降级独立模式。

## 双模式业务组件

以 Lov 值集选择器为例：

| 模式 | 触发条件 | 数据来源 |
| --- | --- | --- |
| 独立模式（默认降级） | 传 `lovApi` / `lovOptions` 等 props | 组件内部自行请求，不需要任何基座 |
| 基座联动模式 | `inject` 探测到 runtime 上下文 | 自动复用基座的值集缓存 / 列表接口 / 权限 |

解析优先级恒为「上下文 → props → 独立空态」：上下文丢失字段自动回退同名 props，全部缺失渲染空态并警告一次，**不抛致命异常**。runtime 是纯增量依赖，未安装时一切组件照常工作。

## 包清单

| 包名 | 定位 | 说明 |
| --- | --- | --- |
| `@mengxi-ark/utils` | 纯函数工具层 | 数据格式化 / 数据结构 / 浏览器工具 / 校验编码，无 Vue 依赖，兼容 Web / Node |
| `@mengxi-ark/theme` | Design Token 纯样式层 | 全量 `--mx-*` CSS Variables，业务覆盖同名变量即可换肤，开箱支持暗色 |
| `@mengxi-ark/hooks` | 通用组合式函数 | useRequest / useAuth / useSession / useI18n / useTable / useForm |
| `@mengxi-ark/components` | 通用增强组件 | SearchForm / EnhanceTable / Dialog 等，props 驱动优先、插槽兜底 |
| `@mengxi-ark/biz-components` | 双模式业务语义组件 | Lov 值集选择器 / DocumentTable 单据表格等，独立与基座联动自动切换 |
| `@mengxi-ark/runtime` | 中台基座（可选） | Tab 工作台 / 菜单 / 模块注册 / 会话 / 全局上下文 |
| `@mengxi-ark/dsl-render` | DSL 配置渲染引擎（可选） | Schema 强类型 + 三渲染器，只渲染不请求，手写 SFC 一等公民 |
| `@mengxi-ark/cli` | 脚手架 | `pnpm create mengxi-ark`，轻量 / 中台双模板 |

## 对比参考

- **vs vue-element-admin**：不是复制样板代码，框架能力以 npm 包交付，统一升级；
- **vs Vben Admin**：增加单据业务组件、可选中台基座、DSL 配置渲染；
- **vs HZERO C7N**：组件不强制绑定 runtime，可独立跨项目使用。

## 下一步

- [快速上手](/guide/getting-started)：三个基础包在任意 Vue 3 项目中开箱使用。
