---
layout: home

hero:
  name: 曦舟 MengXi Ark
  text: 轻量可开箱，中台可插拔
  image:
    src: /logo.svg
    alt: 曦舟 MengXi Ark
  tagline: Vue 3 中台前端框架 —— 分层 monorepo，基础包按需安装独立使用，业务组件双模式，业务长大后平滑升级到完整中台方案
  actions:
    - theme: brand
      text: 快速上手
      link: /guide/getting-started
    - theme: alt
      text: API 文档
      link: /api/utils
    - theme: alt
      text: 中台进阶
      link: /platform/
    - theme: alt
      text: 更新日志
      link: /changelog

features:
  - icon: 🧰
    title: "@mengxi-ark/utils 纯函数工具"
    details: 数据格式化 / 数据结构 / 浏览器工具 / 校验编码，无 Vue 依赖、无副作用，兼容 Web 与 Node，Tree-Shaking 友好
  - icon: 🎨
    title: "@mengxi-ark/theme 设计令牌"
    details: 全量 --mx-* CSS Variables，基础层 + 语义层两级；业务覆盖同名变量即可换肤，开箱支持暗色模式
  - icon: 🪝
    title: "@mengxi-ark/hooks 组合式函数"
    details: useRequest / useAuth / useSession / useI18n / useTable / useForm，卸载自动清理，安装即用
  - icon: 🧩
    title: 双模式业务组件
    details: components / biz-components props 驱动优先、插槽兜底；Lov / DocumentTable 独立模式自请求，装了基座自动联动，上下文丢失自动降级
  - icon: 🏗️
    title: "@mengxi-ark/runtime 中台基座"
    details: Tab 工作台 / 菜单 / 模块注册 / 会话 / 全局上下文五 service，内置可替换工作台 Layout，纯增量依赖可选安装
  - icon: ⚡
    title: "@mengxi-ark/dsl-render 配置渲染加速"
    details: Schema 强 TS 类型 + 三渲染器，只渲染不请求；手写 SFC 一等公民，配置渲染只是加速方案
---
