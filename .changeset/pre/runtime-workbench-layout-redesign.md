---
'@mengxi-ark/runtime': minor
---

内置工作台 Layout 视觉重设计：修复 header 深色覆盖失效与默认深色折叠 trigger 漏出，接管折叠交互，布局改为视口锁定、仅内容区独立滚动；新增 `ArkRuntimeOptions.logo`（图片地址或自定义组件）、`headerActions`（头部操作区组件）、`user`（自定义用户区组件）、`userMenu`（声明式用户下拉菜单：items + onClick，保留内置头像）、`collapsible`（侧栏折叠条开关，默认 true）、`tabContextMenu`（页签右键菜单：内置 刷新/关闭左侧/右侧/其他，可 `items` 追加自定义项）品牌与工作台配置，不传行为不变；`tabService` 新增 `closeLeft` / `closeRight` / `closeOther` / `refresh`（`refreshTick` 刷新信号）方法
