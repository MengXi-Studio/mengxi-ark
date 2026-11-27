# @mengxi-ark/hooks

> 通用组合式函数：useRequest / useAuth / useSession / useI18n / useTable / useForm，独立模式运行，不依赖基座。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/hooks?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/hooks)
[![license](https://img.shields.io/npm/l/@mengxi-ark/hooks?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的 hooks 包：仅依赖 Vue 生态（peer `vue ^3.5.0`），不 import runtime / 组件包，不劫持路由原生 API；所有 hooks 卸载自动清理、配置可覆盖、默认行为可关闭。

## 安装

```bash
pnpm add @mengxi-ark/hooks
```

## 使用示例

```ts
import { useRequest } from '@mengxi-ark/hooks'

// 内置竞态保护 / 取消 / 重试 / 刷新，卸载自动清理
const { data, loading, error, run, cancel, refresh, retry } = useRequest(fetchUser, {
	immediate: true
})
```

```vue
<script setup lang="ts">
import { useTable } from '@mengxi-ark/hooks'

// 查询 / 分页 / 排序 / 筛选状态集合，reset 回默认查询
const { dataSource, loading, pagination, search, reset } = useTable(fetchPage)
</script>
```

## 能力清单

| hook         | 职责                                               |
| ------------ | -------------------------------------------------- |
| `useRequest` | 请求、loading、错误、取消、重试、刷新               |
| `useAuth`    | 权限判断 `hasPermission(code | code[], mode)` + `v-permission` 指令 |
| `useSession` | token 存取、自动刷新、持久化、登出回调             |
| `useI18n`    | 国际化读取与切换（配合导出的 `createI18n` 实例）   |
| `useTable`   | 查询参数合并、分页、排序、筛选、重置               |
| `useForm`    | 表单回显、重置、提交校验封装                       |

> 权限源、会话介质、请求实例均可注入降级：传了用注入值，没传按 `inject` 探测，都失败则降级到安全默认。

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- API 参考：<https://mengxi-studio.github.io/mengxi-ark/api/hooks.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
