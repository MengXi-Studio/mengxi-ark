# @mengxi-ark/utils

Pure utility function library: native TypeScript only — no Vue dependency, no UI, no side effects, compatible with Web and Node script imports, Tree-Shaking friendly (import a single function on demand).

```bash
pnpm add @mengxi-ark/utils
```

```ts
import { formatMoney, unique } from '@mengxi-ark/utils';

formatMoney(1234567.891); // '¥1,234,567.89'
unique([1, 2, 2, 3]); // [1, 2, 3]
```

## Data Formatting (format)

| Function | Signature | Description |
| --- | --- | --- |
| formatDate | `(input: number \| Date \| string, pattern?: string) => string` | Formats a date; placeholders YYYY/MM/DD/HH/mm/ss/SSS/S, default `'YYYY-MM-DD HH:mm:ss'`; returns `''` when unparseable |
| formatMoney | `(value: number \| string, options?: FormatMoneyOptions) => string` | Currency symbol + thousands separators + fixed decimals; `precision` defaults to 2, `symbol` to `'¥'`, `separator` to true |
| formatNumber | `(value: number \| string, options?: FormatNumberOptions) => string` | Thousands separators + optional fixed decimals; `thousandSeparator` defaults to `','`; keeps the original decimals when precision is unspecified |
| formatDict | `(value: string \| number, dictMap: Record<string \| number, string>, fallback?: string) => string` | Translates a dictionary value into text; keys are compared as strings; returns `fallback` (default `'-'`) on miss |

## Arrays (array)

| Function | Signature | Description |
| --- | --- | --- |
| unique | `<T>(arr: T[], keyField?: string) => T[]` | Deduplicates an array; without keyField it compares raw values (Set), with keyField it keeps the first occurrence per object field |
| groupBy | `<T>(arr: T[], keyFn: (item: T, index: number) => string \| number) => Record<string, T[]>` | Groups by the key returned from keyFn (keys are normalized to strings) |
| chunk | `<T>(arr: T[], size: number) => T[][]` | Splits into chunks of the given length; returns `[]` for non-positive size; the last chunk may be shorter than size |

## Objects (object)

| Function | Signature | Description |
| --- | --- | --- |
| deepClone | `<T>(value: T) => T` | Deep clone: prefers `structuredClone`, falls back to JSON when unsupported (Dates don't degrade into strings) |
| merge | `<T extends object>(target: T, ...sources) => T` | Deep merge (pure function returning a new object); arrays and Dates are overwritten directly, undefined fields are skipped |
| omit | `<T extends object, K extends keyof T>(obj: T, keys: K[]) => Omit<T, K>` | Removes the given keys and returns a new object |
| pick | `<T extends object, K extends keyof T>(obj: T, keys: K[]) => Pick<T, K>` | Picks the given keys; only keys that actually exist are copied |

## Tree Operations (tree)

`TreeOptions`: `childrenField` (name of the child-node field, default `'children'`).

| Function | Signature | Description |
| --- | --- | --- |
| forEachTree | `<T extends object>(tree: T[], callback: (node: T, parent: T \| null) => void, options?: TreeOptions) => void` | Depth-first (pre-order) traversal; the root node's parent is null |
| mapTree | `<T extends object, U extends object>(tree: T[], mapper: (node: T) => U, options?: TreeOptions) => U[]` | Maps into a brand-new tree without mutating the input |
| findTree | `<T extends object>(tree: T[], predicate: (node: T) => boolean, options?: TreeOptions) => T \| null` | Finds the first node matching the predicate; returns null on miss |
| filterTree | `<T extends object>(tree: T[], predicate: (node: T) => boolean, options?: TreeOptions) => T[]` | Keeps matched nodes with their ancestor chains and returns a new tree; returns `[]` when nothing matches |

## Browser Tools (browser)

| Function | Signature | Description |
| --- | --- | --- |
| download | `(source: Blob \| string, filename: string) => boolean` | Triggers a browser download; degrades safely in Node by silently returning `false` |
| exportCsv | `(rows: Record<string, unknown>[], filename: string, options?: ExportCsvOptions) => boolean` | Exports CSV (leading BOM prevents garbled Chinese in Excel, with escaping); `headers` customizes the header row |
| getUrlParam | `(name: string, url?: string) => string \| null` | Reads a URL query parameter (auto-decoded); uses the current address when url is omitted, returns null when the parameter is absent |

## Validation (validate)

| Function | Signature | Description |
| --- | --- | --- |
| isPhone | `(value: string) => boolean` | Mainland China mobile number (starts with 1, second digit 3-9, 11 digits total) |
| isEmail | `(value: string) => boolean` | Lenient email format (must contain @ and a dotted domain) |
| isIdCard | `(value: string) => boolean` | 18-digit ID card (format + GB 11643-1999 checksum algorithm; last digit supports X/x) |
| isEmpty | `(value: unknown) => boolean` | Empty check: null / undefined / empty string / empty array / empty object (0, false and NaN are not empty) |

## Runnable Example

```ts
import { chunk, filterTree, formatDict, formatMoney, isPhone } from '@mengxi-ark/utils';

formatMoney(1234567.891); // '¥1,234,567.89'
formatMoney(-1234.5, { precision: 1 }); // '-¥1,234.5'
formatDict(1, { 1: '启用', 0: '禁用' }); // '启用'
isPhone('13812345678'); // true
chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]

const menus = [
  { id: 1, name: '系统管理', children: [{ id: 11, name: '用户管理' }] },
  { id: 2, name: '订单中心', children: [] },
];
filterTree(menus, (node) => node.name.includes('用户'));
// [{ id: 1, name: '系统管理', children: [{ id: 11, name: '用户管理' }] }]
```
