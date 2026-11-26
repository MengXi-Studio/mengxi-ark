# @mengxi-ark/utils

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- 四类纯函数工具层：数据格式化（formatDate / formatMoney / formatNumber / formatDict）、数据结构（数组 unique / groupBy / chunk，对象 deepClone / merge / omit / pick，树 forEachTree / mapTree / findTree /
  filterTree）、浏览器工具（download / exportCsv / getUrlParam）、校验编码（isPhone / isEmail / isIdCard / isEmpty）。
- 仅原生 TypeScript，无 Vue 依赖、无副作用，兼容 Web / Node 脚本导入，Tree-Shaking 友好。
