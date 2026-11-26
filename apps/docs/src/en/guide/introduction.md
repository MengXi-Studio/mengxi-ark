# Introduction

**曦舟 MengXi Ark** is a progressive mid-platform frontend framework built by MengXi-Studio: **lightweight out of the box, pluggable for the mid-platform** — the base is optional, components work standalone, and business
components are dual-mode. Built entirely on Vue 3 + TypeScript, free for commercial use under the MIT license.

## Why MengXi Ark

- **Optional base**: if you don't want the workbench, just use the components and hooks;
- **Dual-mode business components**: use standalone or linked with the mid-platform base — degrade automatically when the base isn't installed, no fatal exceptions;
- **Full TypeScript, one-way dependencies**: TypeScript strict + complete `.d.ts` type declarations, layered monorepo with maintainability first;
- **Handwritten SFC first**: DSL config-driven rendering is an accelerator, not a replacement;
- **Decoupled from UI libraries**: adapts to Ant Design Vue / Element Plus, with UI differences converged in the adapter layer so business usage stays identical;
- **MIT license**, free for commercial use.

## Layered Architecture

MengXi Ark is a layered monorepo managed by pnpm + Turborepo. Dependencies flow strictly one way; reverse / circular references are forbidden:

```
@mengxi-ark/cli (scaffold: create-mengxi-ark)
        ↓
Application layer (business projects / demo apps)
        ↓
[Optional] mid-platform base　[Optional] @mengxi-ark/dsl-render
        ↓
@mengxi-ark/biz-components (dual-mode business components)
        ↓
@mengxi-ark/components (general enhanced components)
        ↓
@mengxi-ark/hooks (general composables)
        ↓
@mengxi-ark/theme (pure Design Token layer)
        ↓
@mengxi-ark/utils (pure utility functions)
```

**The lower a package sits, the more stable it is**: utils / theme release cautiously (low frequency, stable), hooks / components / biz-components keep growing (Minor), and the mid-platform base and dsl-render strictly
control breaking changes (Major must ship with a migration guide).

Lower packages know nothing about upper ones — biz-components and the optional base share only the context contract types, linked via `inject` probing with **zero import coupling**: with the base installed they link
automatically; without it they degrade to standalone mode.

## Dual-Mode Business Components

Take the Lov value-set selector as an example:

| Mode                               | Trigger                                          | Data Source                                                              |
| ---------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------ |
| Standalone mode (default fallback) | Props such as `lovApi` / `lovOptions` are passed | The component fetches data itself; no base required                      |
| Base-linked mode                   | `inject` probing finds the base context          | Automatically reuses the base's value-set cache / list API / permissions |

Resolution priority is always "context → props → standalone empty state": missing context fields fall back to the same-named props; when everything is missing, an empty state renders with a single warning — **no fatal
exceptions**. The base is a purely additive dependency; without it, every component keeps working as usual.

## Package List

| Package                      | Positioning                            | Description                                                                                                           |
| ---------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@mengxi-ark/utils`          | Pure utility functions                 | Data formatting / data structures / browser tools / validation & encoding; no Vue dependency, works on Web / Node     |
| `@mengxi-ark/theme`          | Pure Design Token layer                | Full set of `--mx-*` CSS Variables; redefine the same-named variables to re-theme, dark mode out of the box           |
| `@mengxi-ark/hooks`          | General composables                    | useRequest / useAuth / useSession / useI18n / useTable / useForm                                                      |
| `@mengxi-ark/components`     | General enhanced components            | SearchForm / EnhanceTable / Dialog etc.; props-driven first, slots as fallback                                        |
| `@mengxi-ark/biz-components` | Dual-mode business components          | Lov value-set selector / DocumentTable document table etc.; switches between standalone and base-linked automatically |
| `@mengxi-ark/dsl-render`     | DSL config rendering engine (optional) | Strong-typed Schemas + three renderers; renders only, never fetches; handwritten SFC stays first-class                |
| `@mengxi-ark/cli`            | Scaffold                               | `pnpm create mengxi-ark`, light / mid-platform dual templates                                                         |

There is also an optional **mid-platform base package** (Tab workbench / menu / session / global context) — an advanced capability covered in the [Mid-Platform](/en/platform/) section; you can ignore it entirely during
lightweight usage.

## Comparisons

- **vs vue-element-admin**: no boilerplate copying — framework capabilities ship as npm packages and upgrade uniformly;
- **vs Vben Admin**: adds document business components, an optional mid-platform base, and DSL config rendering;
- **vs HZERO C7N**: components are not forced to bind to the base and can be used standalone across projects.

## Learning Path

Follow the four progressive stages "Beginner → Core → Advanced → Mastery"; by the end of each stage you can independently complete one class of work:

| Stage        | Pages                                                                                                | What You Can Do After                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Beginner** | [Introduction](/en/guide/introduction) · [Get Started (Lightweight Mode)](/en/guide/getting-started) | Install the three foundation packages in any Vue 3 project and run utils / theme / hooks end to end                                    |
| **Core**     | [Core Concepts](/en/guide/core-concepts) · [Component Walkthrough](/en/guide/components-guide)       | Understand the layering and the dual-mode contract; run SearchForm / EnhanceTable / Lov / DocumentTable through five progressive steps |
| **Advanced** | [Mid-Platform](/en/platform/) · [DSL Config Rendering](/en/dsl/)                                     | Assemble the Tab workbench and business modules; accelerate standard CRUD pages with Schemas                                           |
| **Mastery**  | [Migration Guide](/en/guide/migration) · [API Reference](/en/api/utils)                              | Migrate existing antdv / Element Plus projects smoothly; verify the exported APIs one by one                                           |

## Next Steps

- [Get Started](/en/guide/getting-started): the three foundation packages work out of the box in any Vue 3 project.
