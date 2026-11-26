---
layout: home

hero:
  name: 曦舟 MengXi Ark
  text: Lightweight out of the box, pluggable for the mid-platform
  image:
    src: /logo.svg
    alt: MengXi Ark
  tagline: A Vue 3 mid-platform frontend framework — layered monorepo, foundation packages installable and usable independently, dual-mode business components, and a smooth upgrade path to the full mid-platform solution as your business grows
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/getting-started
    - theme: alt
      text: API Reference
      link: /en/api/utils
    - theme: alt
      text: Mid-Platform
      link: /en/platform/
    - theme: alt
      text: Changelog
      link: /en/changelog

features:
  - icon: 🧰
    title: "@mengxi-ark/utils Pure Utility Functions"
    details: Data formatting / data structures / browser tools / validation & encoding — no Vue dependency, no side effects, works on both Web and Node, Tree-Shaking friendly
  - icon: 🎨
    title: "@mengxi-ark/theme Design Tokens"
    details: Full set of --mx-* CSS Variables with a two-level base + semantic layer; redefine the same-named variables to re-theme, with dark mode out of the box
  - icon: 🪝
    title: "@mengxi-ark/hooks Composables"
    details: useRequest / useAuth / useSession / useI18n / useTable / useForm — automatic cleanup on unmount, ready to use right after installation
  - icon: 🧱
    title: "@mengxi-ark/components Enhanced Components"
    details: SearchForm / EnhanceTable / MxDialog and more — fully standalone, importable without any base registration; props-driven first with slot fallbacks, zero-cost on-demand adoption
  - icon: 🧩
    title: Dual-Mode Business Components
    details: Lov / DocumentTable fetch data on their own in standalone mode, link to the base automatically once installed, and degrade gracefully when context is lost; components encapsulate interaction patterns only, never hard-coded backend fields
  - icon: 🏗️
    title: "@mengxi-ark/runtime Mid-Platform Base"
    details: Five services — tab workbench / menu / module registry / session / global context — with a built-in replaceable workbench Layout, a purely additive optional dependency
  - icon: ⚡
    title: "@mengxi-ark/dsl-render Config-Driven Rendering"
    details: Strong TS Schema types + three renderers that render only and never fetch; handwritten SFC stays first-class, config-driven rendering is just an accelerator
  - icon: 🛠️
    title: "create-mengxi-ark Scaffolding"
    details: pnpm create mengxi-ark to bootstrap a project in one command, with lightweight / mid-platform templates out of the box; thin templates, all capabilities via npm packages, AI usage rules bundled with each template
---
