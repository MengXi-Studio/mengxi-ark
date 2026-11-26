# @mengxi-ark/utils

纯函数工具库：仅原生 TypeScript，无 Vue 依赖、无 UI、无副作用，兼容 Web 与 Node 脚本导入，Tree-Shaking 友好（按需导入单一函数即可）。

## 适用场景

**何时用**：金额 / 日期 / 字典值的展示格式化，树形数据（菜单 / 组织）的遍历过滤映射，深拷贝与对象合并，手机号 / 邮箱 / 身份证的本地轻量校验，CSV 导出与 URL 参数读取——这些与 Vue 无关的纯逻辑都应收敛到 utils，保证可在 Web
/ Node / 单测中复用。

**何时不用**：需要响应式状态的请求 / 表格 / 权限逻辑（交给 [hooks](/api/hooks)）；带 UI 形态的能力（交给 components）；依赖浏览器 DOM 副作用的复杂场景（utils 的 browser 类仅做轻量封装，Node 环境安全降级）。

```bash
pnpm add @mengxi-ark/utils
```

```ts
import { formatMoney, unique } from '@mengxi-ark/utils'

formatMoney(1234567.891) // '¥1,234,567.89'
unique([1, 2, 2, 3]) // [1, 2, 3]
```

## 数据格式化（format）

| 函数         | 签名                                                                                                | 说明                                                                                           |
| ------------ | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| formatDate   | `(input: number \| Date \| string, pattern?: string) => string`                                     | 格式化日期，占位符 YYYY/MM/DD/HH/mm/ss/SSS/S，默认 `'YYYY-MM-DD HH:mm:ss'`，无法解析返回 `''`  |
| formatMoney  | `(value: number \| string, options?: FormatMoneyOptions) => string`                                 | 货币符号 + 千分位 + 固定小数位；`precision` 默认 2、`symbol` 默认 `'¥'`、`separator` 默认 true |
| formatNumber | `(value: number \| string, options?: FormatNumberOptions) => string`                                | 千分位分隔 + 可选固定小数位；`thousandSeparator` 默认 `','`，不指定 precision 时保留原值小数   |
| formatDict   | `(value: string \| number, dictMap: Record<string \| number, string>, fallback?: string) => string` | 字典值翻译为文案，键按字符串比较，未命中返回 `fallback`（默认 `'-'`）                          |

## 数组（array）

| 函数    | 签名                                                                                        | 说明                                                                      |
| ------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| unique  | `<T>(arr: T[], keyField?: string) => T[]`                                                   | 数组去重；不传 keyField 按原始值（Set），传入则按对象字段保留首个出现元素 |
| groupBy | `<T>(arr: T[], keyFn: (item: T, index: number) => string \| number) => Record<string, T[]>` | 按 keyFn 返回键分组（键统一转字符串）                                     |
| chunk   | `<T>(arr: T[], size: number) => T[][]`                                                      | 按指定长度分块；size 非正数返回 `[]`，末块可短于 size                     |

## 对象（object）

| 函数      | 签名                                                                     | 说明                                                                          |
| --------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| deepClone | `<T>(value: T) => T`                                                     | 深拷贝：优先 `structuredClone`，环境不支持时 JSON 兜底（Date 不退化为字符串） |
| merge     | `<T extends object>(target: T, ...sources) => T`                         | 深合并（纯函数返回新对象）；数组与 Date 直接覆盖，undefined 字段跳过          |
| omit      | `<T extends object, K extends keyof T>(obj: T, keys: K[]) => Omit<T, K>` | 剔除指定键，返回新对象                                                        |
| pick      | `<T extends object, K extends keyof T>(obj: T, keys: K[]) => Pick<T, K>` | 挑选指定键，仅拷贝实际存在的键                                                |

## 树操作（tree）

`TreeOptions`：`childrenField`（子节点字段名，默认 `'children'`）。

| 函数        | 签名                                                                                                           | 说明                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| forEachTree | `<T extends object>(tree: T[], callback: (node: T, parent: T \| null) => void, options?: TreeOptions) => void` | 深度优先（前序）遍历，根节点 parent 为 null           |
| mapTree     | `<T extends object, U extends object>(tree: T[], mapper: (node: T) => U, options?: TreeOptions) => U[]`        | 映射为全新的一棵树，不改入参                          |
| findTree    | `<T extends object>(tree: T[], predicate: (node: T) => boolean, options?: TreeOptions) => T \| null`           | 查找第一个满足条件的节点，未命中返回 null             |
| filterTree  | `<T extends object>(tree: T[], predicate: (node: T) => boolean, options?: TreeOptions) => T[]`                 | 保留命中节点及其祖先链，返回新树；全部未命中返回 `[]` |

## 浏览器工具（browser）

| 函数        | 签名                                                                                         | 说明                                                                      |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| download    | `(source: Blob \| string, filename: string) => boolean`                                      | 触发浏览器下载；Node 环境安全降级静默返回 `false`                         |
| exportCsv   | `(rows: Record<string, unknown>[], filename: string, options?: ExportCsvOptions) => boolean` | 导出 CSV（前置 BOM 防 Excel 中文乱码，含转义）；`headers` 自定义表头      |
| getUrlParam | `(name: string, url?: string) => string \| null`                                             | 读取 URL 查询参数（自动解码）；不传 url 时取当前地址，参数不存在返回 null |

## 校验（validate）

| 函数     | 签名                          | 说明                                                                        |
| -------- | ----------------------------- | --------------------------------------------------------------------------- |
| isPhone  | `(value: string) => boolean`  | 中国大陆手机号（1 开头、第二位 3-9、共 11 位）                              |
| isEmail  | `(value: string) => boolean`  | 宽松邮箱格式（必须含 @ 且域名带点）                                         |
| isIdCard | `(value: string) => boolean`  | 18 位身份证（格式 + GB 11643-1999 校验位算法，末位支持 X/x）                |
| isEmpty  | `(value: unknown) => boolean` | 空值判断：null / undefined / 空串 / 空数组 / 空对象（0、false、NaN 不算空） |

## 可运行示例

```ts
import { chunk, filterTree, formatDict, formatMoney, isPhone } from '@mengxi-ark/utils'

formatMoney(1234567.891) // '¥1,234,567.89'
formatMoney(-1234.5, { precision: 1 }) // '-¥1,234.5'
formatDict(1, { 1: '启用', 0: '禁用' }) // '启用'
isPhone('13812345678') // true
chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]

const menus = [
	{ id: 1, name: '系统管理', children: [{ id: 11, name: '用户管理' }] },
	{ id: 2, name: '订单中心', children: [] }
]
filterTree(menus, node => node.name.includes('用户'))
// [{ id: 1, name: '系统管理', children: [{ id: 11, name: '用户管理' }] }]
```

## 相关教程

- [核心概念](/guide/core-concepts)：utils 在分层架构中的定位（最底层纯函数层，不依赖任何上层包）；
- [快速上手](/guide/getting-started)：三个基础包的最小可运行组合。
