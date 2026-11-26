# Core Concepts

After finishing [Get Started](/en/guide/getting-started), this chapter builds the mental model you need to understand every capability of MengXi Ark: the layered architecture, the dual-mode business component contract, the theme system, the UI adapter layer, and the common hooks conventions. Once you have these five concepts, you can predict the behavior of any `@mengxi-ark/*` package.

## Layered Architecture

MengXi Ark is a layered monorepo managed by pnpm + Turborepo. Dependencies flow **strictly one way**, and each layer only knows about the layer directly beneath it:

```
@mengxi-ark/cli            scaffold create-mengxi-ark: bootstraps the lightweight / mid-platform dual templates
        ↓
Application layer          business projects / demo apps: the only place that assembles every package
        ↓
[Optional] @mengxi-ark/runtime        mid-platform base: tab workbench / menu / module registry / session / global context
[Optional] @mengxi-ark/dsl-render     DSL config rendering: strongly-typed Schemas + three renderers; renders only, never fetches
        ↓
@mengxi-ark/biz-components dual-mode business components: Lov / DocumentTable etc.; standalone on their own, auto-linking once the base is installed
        ↓
@mengxi-ark/components     general enhanced components: SearchForm / EnhanceTable etc.; props-driven first, slots as fallback
        ↓
@mengxi-ark/hooks          general composables: useRequest / useTable / useAuth etc.; bound to no backend or UI library
        ↓
@mengxi-ark/theme          pure Design Token style layer: the full --mx-* CSS Variables set, no JS logic
        ↓
@mengxi-ark/utils          pure utility functions: no Vue dependency, no side effects, works on Web / Node
```

**Red line: lower packages never import upper ones.** utils doesn't know Vue exists, theme doesn't know components exist, and biz-components and runtime have **zero import coupling** — they only share the `MX_RUNTIME_CONTEXT_KEY` contract types and link via `inject` probing. CI dependency-chain checks enforce this red line, and it is also the technical premise for runtime / dsl-render being "optional packages": without the base installed, lower packages never miss a dependency.

**Change frequency is also isolated by layer**: the lower the layer, the more stable — utils / theme release cautiously; hooks / components / biz-components keep growing (Minor); runtime / dsl-render strictly control breaking changes (Major must ship with a migration guide).

## The Dual-Mode Business Component Contract

Every biz-components component (Lov, DocumentTable) follows the same dual-mode contract, centered on three data-source forms:

| Form | Trigger | Data Source |
| --- | --- | --- |
| **Standalone mode (default fallback)** | Props such as `api` / `params` / `permissions` are passed | The component fetches data itself via `useRequest`; no base required |
| **Base-linked mode** | `inject` probing finds the `MX_RUNTIME_CONTEXT_KEY` context | Automatically reuses the base's value-set cache / list API / permission source |
| **Standalone empty state** | Neither the context nor props provide a data source | Renders an empty state with a single `console.warn`, **never throwing a fatal exception** |

### The fallback chain: context → props → standalone empty state

The data-source resolution priority never changes. Taking Lov as an example:

1. **Context hit**: `lovCode` hits the base's value-set cache, or the context's `lovListApi` is reused;
2. **Props fallback**: when the context lacks a field, it falls back to the same-named prop (`lovApi` / `lovCache` / `lovOptions`) — field names map one to one;
3. **Standalone empty state**: when everything is missing, an empty data source renders; after one warning the component degrades silently and the app keeps running.

The takeaway: **with the base installed they link automatically; without it (or when a context field is lost) they degrade automatically — without changing a single line of business code**. The base is a purely additive dependency — exactly what "progressive" means: introduce the base as the business grows, and existing components immediately gain its capabilities.

### Contract stability

The probe key `MX_RUNTIME_CONTEXT_KEY` and the field set `MxRuntimeContext` (user / tenant / org / permissions / lovListApi / lovCache) are defined by biz-components and extended and delivered by runtime; adding or removing context fields is a **Major** breaking change and must ship with a migration guide.

## The Theme System

`@mengxi-ark/theme` is a pure style layer: no Vue components, no JS logic — every capability is output as CSS Variables.

### Two token levels: base layer → semantic layer

| Level | Contents | Examples |
| --- | --- | --- |
| Base layer (`tokens/`) | Color ramps / spacing / radius / shadows / typography / z-index | `--mx-color-primary-1..10`, `--mx-spacing-md`, `--mx-radius-base` |
| Semantic layer (`semantic.scss`) | Functional colors / text / backgrounds / borders — **must reference base-layer variables** | `--mx-color-text-primary`, `--mx-color-bg-container`, `--mx-color-border-split` |

Business and component styles may only consume semantic-layer `var(--mx-*)`; hardcoding color values is forbidden. Derived states (hover / active / disabled) are defined as dedicated tokens in theme — components never compute colors themselves.

### Dark Mode & Business Re-Theming

- **Dark mode**: attach `data-theme="dark"` to the host root node (or the `.mx-theme-dark` class); dark styles only override semantic-layer variables and shadows while the palette stays unchanged — no style reload needed;
- **Re-theming**: redefine the same-named `--mx-*` variables in your own stylesheet; CSS Variables overrides take effect live — **no need to fork theme**:

```css
:root {
  --mx-color-primary: #0958d9;
  --mx-radius-base: 4px;
}
```

### UI-Library Variable Bridging

`theme/src/adapters/antdv.scss` and `element-plus.scss` map the main `--ant-*` / `--el-*` variables onto `--mx-*` tokens, keeping framework components visually consistent across both UI libraries; unmapped UI-library variables must not be consumed directly in components. See the [theme API](/en/api/theme) for details.

## The UI Adapter Layer

The same business code must run on both Ant Design Vue and Element Plus, so the differences must converge into one place — the UI adapter layer:

- The unified `UiAdapter` contract defines atomic capabilities (Input / Select / RangePicker / Button / DataTable / Modal / Drawer / Upload / TreeSelect) and unified prop semantics (controlled `modelValue`, `sm | md | lg` sizes);
- Components always obtain the adapter via `inject(UI_ADAPTER_KEY)`; when nothing is injected, the default Ant Design Vue adapter applies. **Component files must not import any UI library directly** (the adapter directory is the only exception);
- The business or the base can switch the UI library wholesale with `app.provide(UI_ADAPTER_KEY, adapter)`;
- When a new component needs a new atomic capability, extend the `UiAdapter` interface first, then land it in **both** the antdv and element-plus implementations — changing only one counts as unfinished.

Direct benefit for business code: unified types such as `MxColumn` / `MxPaginationState` / `MxRowSelection` are identical under both UI libraries — switching UI libraries never changes component usage.

## Common hooks Conventions

Every hook follows the same set of signature and behavior conventions — learn one and you have learned them all:

1. **Signature `(source, options?)`**: the first parameter is the business-injected data source / configuration (request instance, table data); `options` is always an object with all-optional fields; positional boolean parameters are forbidden;
2. **Reactive return values**: state (refs / reactive) and side-effect methods (`run` / `cancel` / `reset`) are returned side by side — never a bare promise;
3. **Automatic cleanup on unmount**: `onUnmounted` cancels in-flight requests, clears timers and unbinds listeners; calling outside a component (no component instance) merely skips cleanup without throwing;
4. **Default behaviors can be switched off**: every default behavior has a matching switch in `options` — e.g. `immediate: false` on useRequest / useTable disables the automatic first query, and `silentWarn: true` on useAuth disables the fallback warning; defaults are constants documented in JSDoc;
5. **Three-level permission-source fallback** (useAuth / v-permission): explicit adapter → `inject` probing `MX_AUTH_ADAPTER_KEY` → a module-level source registered via `setAuthAdapter` → safe default (`hasPermission` always false) with a single warning;
6. **Bound to no backend**: hooks never hardcode business dictionaries or API endpoints, and never hijack native router APIs — route guards are registered by the business or the base.

## Next Steps

With the concepts in place, move on to the [Component Walkthrough](/en/guide/components-guide): bring SearchForm / EnhanceTable / Lov / DocumentTable to life through five progressive steps.
