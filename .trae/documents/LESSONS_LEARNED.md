# LESSONS_LEARNED

## 2026-11-25 · M2 组件层

### vite-plugin-dts（unplugin-dts 1.1.2）对 .vue SFC 需显式 `processor: 'vue'`

- **现象**：构建 exit 0，但 dist 内 `Xxx/index.d.ts` 出现 `export { default } from './Xxx.vue'` 且无对应声明文件——下游消费包 TS2307（Cannot find module './Xxx.vue'）。
- **根因**：unplugin-dts 宣称自动探测 `.vue` 并启用 vue processor，但自动探测在本工程 `include: ['src']`（目录形式而非 glob）下不生效，TS 编译服务没有 Vue 语言支持，SFC 声明直接跳过。
- **修复**：`internal/build-scripts/define-lib-config.mjs` 的 dts 选项显式加 `processor: 'vue'` 与 `cleanVueFileName: true`（后者把 `Xxx.vue.d.ts` 重命名为 `Xxx.d.ts`，并把 import 路径 `./Xxx.vue` 重写为 `./Xxx`）。
- **排查要点**：dts 报错不影响 exit code，构建「成功」≠ d.ts 正确；验收必须打开 dist 里引用 `.vue` 的中间 d.ts 确认声明文件真实存在。

### 适配器边界统一契约与 h() 双向推断

- 统一 props 契约外壳（MxSize / MxSelectOption / MxPaginationState 等）与各 UI 库组件自身的 props 类型不逐字段重合（如 antdv `SizeType` 含 undefined、EP `rowKey` 仅收 string、antdv `UploadFile.uid` 必填 string）。给 `h()` 传强类型组件 + 手工映射 props 会触发双向推断的大量误报（TS2769）。
- 落地策略：惰性组件（defineAsyncComponent）显式标注为宽松 `Component`，props 按 any 渲染；类型差异全部收敛到适配器内的纯映射函数（可单测）与局部窄化变量（props 联合类型在闭包内不保留窄化，需先赋值局部常量）。

### props 驱动组件的单测要模拟 v-model

- 组件契约是 props 驱动（渲染只读 `props.modelValue`），单测仅传静态 prop 不会触发回显/新增行渲染——必须拦截 `update:modelValue` 回写（`wrapper.setProps` 或 reactive 数组 splice）模拟宿主绑定，否则测试失败疑似组件 bug。

## 2026-11-25 · M3 Lov 级联与行展开子表

### 可选 prop 的「空」语义必须与「未传」区分（cascadeSource 踩坑）

- **现象**：按伪代码把 `cascadeSource === undefined` 也视为父级为空 → 禁用，结果所有未配置级联的既有 Lov 全部被禁用，既有单测（远程模式打开弹窗）直接失败。
- **根因**：Vue 中「宿主未传 prop」与「宿主绑定了 undefined 的 ref」不可区分；可选能力开关 prop 的 undefined 必须语义化为「未启用该能力」，禁用只对显式传入的 `null` / 空数组生效。
- **推广**：凡「可选上下文/级联/依赖」类 prop，默认值 undefined 永远表示功能关闭，空态（null / []）才表示「启用但为空」。设计伪代码里的「null/undefined 视为空」需在实现时做向后兼容检查。

### antdv 与 EP 行展开实现差异收敛在适配器层

- antdv 原生支持 `expandedRowKeys` prop + `expandedRowRender` 具名槽（统一槽 `expandedRow` 需显式映射改名转发，不能直接透传 slots 对象了事）。
- EP 无展开槽概念，需适配器内部插入 `type="expand"` 的 el-table-column（列首追加）+ `expand-row-keys` 受控 + `expand-change` 回抛；EP 的 row-key 经适配器归一为字符串返回值，故 expand-row-keys 传 key 时需 `map(String)` 匹配。
- antdv 在「expandedRowRender 内嵌套 Table」会打印库自身 deprecation warning，根因是数据行的 `children` 数组字段被 antdv 当作**树形嵌套数据**（`expandType='nest'`）：一处触发「expandedRowRender should not use with nested Table」（vc-table/Table.js 检查 `record[childrenColumnName]`），另一处触发「expandIconColumnIndex is deprecated」（expandType 为 nest 时 wrapper 强制返回 0，useColumns 判 `>= 0` 即告警）。
- **修复方式**：适配器启用行展开时给 antdv Table 传哑键 `childrenColumnName: '__mx_expand_no_nesting'`——expandType 退回 'row'、告警检查落空，且避免树形缩进展开图标与受控 expandedRowKeys 双展开体系冲突。统一契约的行展开只由 expandedRowKeys 驱动，不做树形表格；EP 无此告警，无需对应实现（antdv 库内部 dev warning 的收敛属适配器层职责）。

### stub 适配器给 flatMap 返回展开内容时要包数组

- `expandedNode = cond ? h(...) : []` 直接 `...expandedNode` 展开会抛「expandedNode is not iterable」——VNode 不是可迭代对象。三元真分支必须包成 `[h(...)] : []`，保证 flatMap 回调始终返回数组。
