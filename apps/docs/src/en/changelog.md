# Changelog

Below are the release highlights of v1.0.0-beta.0 (the first public Beta). See each package's CHANGELOG.md for the full log.

## @mengxi-ark/utils

- First release of the pure utility layer: data formatting (formatDate / formatMoney / formatNumber / formatDict), arrays (unique / groupBy / chunk), objects (deepClone / merge / omit / pick), tree operations (forEachTree / mapTree / findTree / filterTree), browser tools (download / exportCsv / getUrlParam), validation (isPhone / isEmail / isIdCard / isEmpty);
- Pure TypeScript only — no Vue dependency, no side effects, compatible with Web / Node script imports, Tree-Shaking friendly.

## @mengxi-ark/theme

- First release of the pure Design Token style layer: brand color ramp / gray scale / semantic layer / spacing / radius / shadow / typography / z-index, as the full set of `--mx-*` CSS Variables;
- Built-in dark theme (`data-theme="dark"` / `.mx-theme-dark` scoped semantic-layer overrides) and antdv / Element Plus variable bridging;
- Redefining the same-named `--mx-*` variables is all it takes to re-theme — no fork needed.

## @mengxi-ark/hooks

- First release of six general hooks: useRequest (race protection / cancel / retry with backoff / optional caching), useAuth (permission checks + the v-permission directive), useSession (token persistence / auto refresh / expiry callback), useI18n (instance delivered via provide, degrades when not detected), useTable (merging of query, pagination, sorting and filters), useForm (echo / reset / validation wrapper);
- All hooks clean up automatically on unmount and never throw when called outside components; the permission source supports a three-level fallback: adapter injection / inject probing / safe default.

## @mengxi-ark/components

- Dual-library UI adapters (Ant Design Vue / Element Plus) + first release of nine components: SearchForm / EnhanceTable / EmptyState / StatusTag / ResultPage / Dialog / Drawer / Upload / TreeSelect, with a unified props contract and lazy loading;
- The unified DataTable contract adds controlled row expansion (expandedRowKeys + the expandedRow scoped slot, implemented in both UI libraries and passed through by EnhanceTable);
- Fixed the antdv deprecation warning when row expansion is enabled in AntdvDataTable (childrenColumnName passes a dummy key to disable nested-tree semantics).

## @mengxi-ark/biz-components

- First release of dual-mode business components: the `MX_RUNTIME_CONTEXT_KEY` context contract + the Lov value-set selector (static value set / remote API dual mode — standalone mode fetches on its own, base-linked mode probes via inject and degrades automatically) + the DocumentTable document table (row editing / field validation / save emits the full data set);
- Lov adds cascadeSource cascade semantics (parent changes clear the child value / empty parent disables the trigger), and DocumentTable passes through row-expansion child tables;
- M4 increments: Lov popup customization (columns override + bodyCell scoped slot); DocumentTable cell-level permission granularity (column-level permissionCode with "some" semantics + functional editable for row-level granularity + unauthorized cells rendering read-only text and skipping required validation to prevent deadlocks).

## @mengxi-ark/runtime

- Mid-platform base landed: createArkRuntime (Vue plugin + instance handle in one); install assembles context provide / module routes / beforeEach guard wrapping / Layout mounting / the onAppInit queue;
- Five services: tabService (three openMode values: new tab / current tab / business dialog), menuService, moduleRegistryService, sessionService (expiry broadcast + token refresh scheduling), contextService (MX_RUNTIME_CONTEXT_KEY delivery + permission merging);
- Built-in replaceable workbench Layout (ArkWorkbenchLayout), with UI dependencies confined to layout/.

## @mengxi-ark/dsl-render

- DSL config rendering engine landed: QuerySchema / FormSchema / TableSchema with strong TS types (kind discriminator + functional visible / rules linkage validation), validateSchema structural validation (error list with paths);
- The component mapping registry defaults to 13 entries (adapter primitives + cross-component entities); businesses can override entries under the same key;
- Three renderers — QueryRenderer / FormRenderer / TableRenderer: render only, never fetch; search / submit / save events are thrown to the caller; FormRenderer exposes validate(); TableRenderer passes through the toolbar / bodyCell / expandedRow slots.

## @mengxi-ark/cli

- The `create-mengxi-ark` scaffold landed (@clack/prompts interaction: template selection / directory name / non-empty directory confirmation);
- templates/light lightweight template (foundation packages installed and used directly, no runtime) and templates/platform mid-platform base template (createArkRuntime + systemModule example + workbench Layout);
- Templates ship with the package and embed tiered `.trae/rules/` quick references (ark-light.md / ark-platform.md); placeholder injection keeps framework package versions aligned with the cli version.
