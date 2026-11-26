# Global Context & Dual-Mode Fallback

> **Prerequisites**: this page is the base-side expansion of the "dual-mode business component contract" from [Core Concepts](/en/guide/core-concepts); finish [createArkRuntime & the Workbench](/en/platform/) and [registerModule Module Development](/en/platform/module) first.

runtime delivers the global context via `provide(MX_RUNTIME_CONTEXT_KEY, reactive(context))`; biz-components probe the same key via `inject` (`MX_RUNTIME_CONTEXT_KEY`, with **zero import coupling** to runtime — only contract types are shared). This contract supports both runtime forms at once:

## Context Fields & Props Fallback Mapping

| Context Field | Component Props Fallback | Description |
| --- | --- | --- |
| `user` / `tenant` / `org` | — | Readable directly by the business via `useRuntimeContext()` |
| `permissions` | `permissions` (DocumentTable) | Permission source; a context hit wins, missing fields fall back to props |
| `lovListApi` | `lovApi` (Lov) | Value-set list API |
| `lovCache` | `lovCache` (Lov) | Static value-set cache (keyed by value-set code) |

## Three-Level Data Source Resolution

Using Lov as an example (the DocumentTable permission source follows the same rules):

1. **Base-linked**: `lovCode` hits `context.lovCache` → reuse the static value set directly;
2. **Base API linked**: cache miss → reuse `context.lovListApi` (debounced search + pagination);
3. **Standalone fallback**: context field missing → fall back to the same-named props (`lovApi` / `lovOptions` / `lovCache`); everything missing → empty data source with an empty state, **no fatal exceptions**.

Inside a component, `useRuntimeContext()` returns `undefined` when probing fails, letting the business detect the current runtime form.

## Verifying Fallback Switching

The "fallback switching demo" page in `apps/demo-platform` regresses this contract under a real base: a switch controls a subtree's `provide(MX_RUNTIME_CONTEXT_KEY, {})` (simulating context loss). Observe that:

- A Lov without props fallback inside the subtree → no data source (standalone-mode empty state);
- A Lov with the `lovApi` prop inside the subtree → automatically switches to standalone mode and fetches on its own;
- Lovs outside the subtree → unaffected, still base-linked.

## Contract Stability

- The probe key `MX_RUNTIME_CONTEXT_KEY` and its field set (`MxRuntimeContext`) are defined by biz-components and extended by runtime (`RuntimeContext` adds base fields such as `appName`);
- Adding or removing context fields is treated as a **Major** breaking change and must ship with a migration guide;
- Without runtime installed, all components work in standalone mode — runtime is a purely additive dependency.

**Next**: once base linking works, bring in [DSL Config Rendering](/en/dsl/) as needed to speed up standard CRUD pages (dual-mode probing supported as well); or read the [Migration Guide](/en/guide/migration) to plan the rollout for existing projects.
