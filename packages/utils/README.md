# @mengxi-ark/utils

> 纯函数工具层：数据格式化 / 数据结构 / 浏览器工具 / 校验编码，四类归档、单一文件单一分类。

[![npm version](https://img.shields.io/npm/v/@mengxi-ark/utils?style=flat-square)](https://www.npmjs.com/package/@mengxi-ark/utils)
[![license](https://img.shields.io/npm/l/@mengxi-ark/utils?style=flat-square)](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)

[MengXi Ark｜曦舟](https://github.com/MengXi-Studio/mengxi-ark) 的底层工具包：仅原生 TypeScript，**无 Vue 依赖、无 UI、无副作用、无全局状态**，Web 与 Node 脚本均可导入；ESM 产物，Tree-Shaking 友好。

## 安装

```bash
pnpm add @mengxi-ark/utils
```

## 使用示例

```ts
import { formatDate, formatMoney, formatDict } from '@mengxi-ark/utils'
import { unique, groupBy, chunk } from '@mengxi-ark/utils'
import { deepClone, merge, pick, omit } from '@mengxi-ark/utils'
import { findTree, filterTree, mapTree } from '@mengxi-ark/utils'
import { exportCsv, isPhone, isEmail } from '@mengxi-ark/utils'

formatDate(Date.now(), 'YYYY-MM-DD') // '2026-11-27'
formatMoney(12345.6, { symbol: '¥' }) // '¥12,345.60'
formatDict('1', { 1: '启用' }) // '启用'

groupBy([{ t: 'a' }, { t: 'b' }], item => item.t) // { a: [...], b: [...] }
isPhone('13800138000') // true
```

## 能力清单

| 分类     | 函数                                                         |
| -------- | ------------------------------------------------------------ |
| 数据格式化 | `formatDate` `formatDict` `formatMoney` `formatNumber`       |
| 数据结构 | `unique` `groupBy` `chunk` `deepClone` `merge` `omit` `pick` `forEachTree` `mapTree` `findTree` `filterTree` |
| 浏览器工具 | `download` `exportCsv` `getUrlParam`                         |
| 校验     | `isPhone` `isEmail` `isIdCard` `isEmpty`                     |

## 文档

- 完整文档：<https://mengxi-studio.github.io/mengxi-ark/>
- API 参考：<https://mengxi-studio.github.io/mengxi-ark/api/utils.html>

## 协议

[MIT](https://github.com/MengXi-Studio/mengxi-ark/blob/master/LICENSE)
