# @mengxi-ark/theme

Pure style-layer Design Token package: no Vue components, no JS logic — everything is output as `--mx-*` CSS Variables, and business projects only need to import a single entry file.

## Use Cases

**When to use**: site-wide unified color / spacing / radius / shadow / z-index conventions; dark mode out of the box; brand re-theming without forking the source (override the same-named variables); component and page
styles that must stay visually consistent with the UI library (with the adapters bridging).

**When not to use**: single-point style tweaks where you don't want the full variable system (just write your project's own CSS); dynamic theming driven from JS (theme ships no JS API — re-theming always goes through CSS
Variables overrides).

```bash
pnpm add @mengxi-ark/theme
```

## Importing

Import once at the application entry (the ESM output is the CSS file itself):

```ts
import '@mengxi-ark/theme'
```

## Token Categories

| Category       | Source File              | Contents                                                                                                                                                                                                      |
| -------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color palette  | `tokens/color.scss`      | Brand color ramp `--mx-color-primary-1..10` (seed `#1677ff`), gray scale `--mx-gray-1..14`, functional color base values                                                                                      |
| Semantic layer | `semantic.scss`          | Functional colors `--mx-color-success / warning / danger / info`, brand derivatives `--mx-color-primary-hover / active`, text `--mx-color-text-*`, background `--mx-color-bg-*`, border `--mx-color-border-*` |
| Spacing        | `tokens/spacing.scss`    | `--mx-spacing-xs(4px) / sm(8px) / md(12px) / lg(16px) / xl(24px)`                                                                                                                                             |
| Radius         | `tokens/radius.scss`     | `--mx-radius-sm(4px) / base(6px) / lg(8px) / round(9999px)`                                                                                                                                                   |
| Shadow         | `tokens/shadow.scss`     | `--mx-shadow-sm / base / lg` (automatically deepened in dark mode)                                                                                                                                            |
| Typography     | `tokens/typography.scss` | Font sizes `--mx-font-size-xs..xl`, line heights `--mx-line-height-*`, font weights `--mx-font-weight-*`, font families `--mx-font-family-base / code`                                                        |
| Z-index        | `tokens/z-index.scss`    | `--mx-z-base / sticky / dropdown / drawer / modal / message` (baselines 0/100/1000/1200/2000/3000)                                                                                                            |
| Base styles    | `base.scss`              | reset, typography, the `.mx-empty` empty state, the `.mx-loading` loading pattern                                                                                                                             |

Layering convention: two levels — the base layer (palette / ramps) and the semantic layer. Semantic-layer variables reference the base layer, and writing raw color values directly is forbidden; component styles may only
consume `var(--mx-*)`.

## Dark Mode

Attach `data-theme="dark"` to the host root node (or `.mx-theme-dark`); dark mode only overrides semantic-layer variables and shadows while the palette stays unchanged:

```ts
document.documentElement.dataset.theme = 'dark' // pass '' to restore light mode
```

```html
<body data-theme="dark">
	<!-- or <body class="mx-theme-dark"> -->
</body>
```

## Business Overrides

Redefine the same-named `--mx-*` variables in your own stylesheet; CSS Variables take effect at runtime — no need to fork theme:

```css
:root {
	--mx-color-primary: #0958d9;
	--mx-color-success: #00b42a;
	--mx-radius-base: 4px;
}
```

Overrides only affect semantic-layer values, not the ramp definitions; if you need consistent derivatives (hover / active), override the corresponding tokens as well.

## Usage Example

```html
<div class="card">曦舟 MengXi Ark</div>
```

```css
.card {
	padding: var(--mx-spacing-lg);
	background-color: var(--mx-color-bg-container);
	border: 1px solid var(--mx-color-border-split);
	border-radius: var(--mx-radius-lg);
	box-shadow: var(--mx-shadow-sm);
	color: var(--mx-color-text-primary);
	font-size: var(--mx-font-size-md);
}
```

Component and page styles all reference tokens this way; hardcoding color / font-size / spacing literals is forbidden.

## Related Tutorials

- [Core Concepts](/en/guide/core-concepts): the two-level token system (base layer → semantic layer), dark-mode switching and UI-library variable bridging;
- [Migration Guide](/en/guide/migration): the mapping between `--mx-*` and `--ant-*` / `--el-*`, and where to replace legacy styles.
