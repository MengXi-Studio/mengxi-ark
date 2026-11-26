# 更新日志

以下为 v1.0.0-beta.0（首个公开 Beta）发布要点，完整日志见各包 CHANGELOG.md。

## @mengxi-ark/utils

- 纯函数工具层首发：数据格式化（formatDate / formatMoney / formatNumber / formatDict）、数组（unique / groupBy / chunk）、对象（deepClone / merge / omit / pick）、树操作（forEachTree / mapTree / findTree / filterTree）、浏览器工具（download / exportCsv / getUrlParam）、校验（isPhone / isEmail / isIdCard / isEmpty）；
- 仅原生 TypeScript，无 Vue 依赖、无副作用，兼容 Web / Node 脚本导入，Tree-Shaking 友好。

## @mengxi-ark/theme

- Design Token 纯样式层首发：品牌色梯度 / 灰阶 / 语义层 / 间距 / 圆角 / 阴影 / 字体排版 / z-index 全量 `--mx-*` CSS Variables；
- 内置暗色主题（`data-theme="dark"` / `.mx-theme-dark` 作用域覆盖语义层）与 antdv / Element Plus 变量桥接；
- 业务重定义同名 `--mx-*` 变量即可换肤，无需 fork。

## @mengxi-ark/hooks

- 六个通用 hook 首发：useRequest（竞态保护 / 取消 / 重试退避 / 可选缓存）、useAuth（权限判断 + v-permission 指令）、useSession（token 持久化 / 自动刷新 / 过期回调）、useI18n（实例 provide 下发、未探测降级）、useTable（查询分页排序筛选合并）、useForm（回显 / 重置 / 校验封装）；
- 所有 hook 卸载自动清理，组件外调用不报错；权限源支持 adapter 注入 / inject 探测 / 安全默认三级降级。

## @mengxi-ark/components

- UI 适配器双库（Ant Design Vue / Element Plus）+ 九组件首发：SearchForm / EnhanceTable / EmptyState / StatusTag / ResultPage / Dialog / Drawer / Upload / TreeSelect，统一 props 契约与惰性加载；
- 统一 DataTable 契约增加受控行展开（expandedRowKeys + expandedRow 作用域槽，双库同步落地，EnhanceTable 透传）；
- 修复 AntdvDataTable 行展开启用时的 antdv 弃用告警（childrenColumnName 传哑键禁用树形嵌套语义）。

## @mengxi-ark/biz-components

- 双模式业务组件首发：`MX_RUNTIME_CONTEXT_KEY` 上下文契约 + Lov 值集选择器（静态值集 / 远程接口双模式，独立模式自请求，基座联动 inject 探测自动降级）+ DocumentTable 单据表格（行编辑 / 字段校验 / save 抛全量数据）；
- Lov 增加 cascadeSource 级联语义（父值变化清空子值 / 父空禁用触发器），DocumentTable 行展开子表透传；
- M4 增量：Lov 弹窗自定义（columns 覆盖 + bodyCell 作用域槽）；DocumentTable 单元格级粒度权限（列级 permissionCode some 语义 + editable 函数化行级粒度 + 无权限单元格渲染只读文本并跳过必填校验防死锁）。

## @mengxi-ark/runtime

- 中台基座落地：createArkRuntime（Vue 插件 + 实例句柄二合一），install 装配上下文 provide / 模块路由 / beforeEach 守卫包装 / Layout 挂载 / onAppInit 队列；
- 五 service：tabService（三种 openMode：新页签 / 当前页 / 业务弹窗）、menuService、moduleRegistryService、sessionService（过期广播 + token 刷新调度）、contextService（MX_RUNTIME_CONTEXT_KEY 下发 + 权限合并）；
- 内置可替换工作台 Layout（ArkWorkbenchLayout），UI 依赖收敛于 layout/。

## @mengxi-ark/dsl-render

- DSL 配置渲染引擎落地：QuerySchema / FormSchema / TableSchema 强 TS 类型（kind 判别 + 函数式 visible / rules 联动校验）、validateSchema 结构校验（带路径错误清单）；
- 组件映射注册表默认 13 项（适配器原子 + 跨组件实体），业务可同 key 覆盖；
- QueryRenderer / FormRenderer / TableRenderer 三渲染器：只渲染不请求，search / submit / save 事件抛上层，FormRenderer 暴露 validate()，TableRenderer 透传 toolbar / bodyCell / expandedRow 槽。

## @mengxi-ark/cli

- `create-mengxi-ark` 脚手架落地（@clack/prompts 交互：模板选择 / 目录名 / 非空目录确认）；
- templates/light 轻量模板（基础包直装直用，无 runtime）与 templates/platform 中台基座模板（createArkRuntime + systemModule 示例 + 工作台 Layout）；
- 模板随包发布并内置分档 `.trae/rules/` 用法速查（ark-light.md / ark-platform.md），占位符注入保证框架包版本与 cli 版本绑定对齐。
