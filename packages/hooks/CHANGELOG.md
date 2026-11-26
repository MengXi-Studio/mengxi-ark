# @mengxi-ark/hooks

## 1.0.0-beta.0

- v1.0.0-beta 公测首发（M0–M4 全量落地，npm dist-tag `beta`）。
- 六个通用 hook：useRequest（竞态保护 / 取消 / 重试退避 / 可选缓存）、useAuth（权限判断 +
  v-permission 指令）、useSession（token 持久化 / 自动刷新 / 过期回调）、useI18n（实例 provide 下发）、useTable（查询 / 分页 / 排序 / 筛选合并）、useForm（回显 / 重置 / 校验封装）。
- 所有 hook 卸载自动清理，组件外调用不报错；权限源支持 adapter 注入 / inject 探测 / 安全默认三级降级。
