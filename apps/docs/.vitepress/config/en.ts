import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'

/**
 * English locale config: nav / sidebar / editLink.
 * Content mirrors src/en/ (full translation of the Chinese docs).
 */

const REPO_EDIT_BASE = 'https://github.com/MengXi-Studio/mengxi-ark/edit/master/apps/docs/src'

/** Guide sidebar: Getting Started → Core → Advanced → Master progressive groups (shared across /en/guide/ /en/platform/ /en/dsl/ prefixes) */
const guideSidebar: DefaultTheme.SidebarItem[] = [
	{
		text: 'Getting Started',
		items: [
			{ text: 'Introduction', link: '/en/guide/introduction' },
			{ text: 'Quick Start (Lightweight)', link: '/en/guide/getting-started' }
		]
	},
	{
		text: 'Core',
		items: [
			{ text: 'Core Concepts', link: '/en/guide/core-concepts' },
			{ text: 'Component Walkthrough', link: '/en/guide/components-guide' }
		]
	},
	{
		text: 'Advanced',
		items: [
			{ text: 'createArkRuntime & Workspace', link: '/en/platform/' },
			{ text: 'registerModule Module Dev', link: '/en/platform/module' },
			{ text: 'Global Context & Dual-mode Fallback', link: '/en/platform/context' },
			{ text: 'Schema & Three Renderers', link: '/en/dsl/' }
		]
	},
	{
		text: 'Master',
		items: [{ text: 'Migration Guide', link: '/en/guide/migration' }]
	},
	{
		text: 'Others',
		items: [{ text: 'Feedback', link: '/en/guide/feedback' }]
	}
]

export const enConfig = defineConfig({
	description: 'A Vue 3 mid-platform frontend framework — lightweight out of the box, pluggable for the platform',
	themeConfig: {
		logo: '/logo.png',
		editLink: {
			pattern: `${REPO_EDIT_BASE}/:path`,
			text: 'Edit this page on GitHub'
		},
		outlineTitle: 'On this page',
		darkModeSwitchLabel: 'Theme',
		lightModeSwitchTitle: 'Switch to light theme',
		darkModeSwitchTitle: 'Switch to dark theme',
		sidebarMenuLabel: 'Menu',
		returnToTopLabel: 'Back to top',
		docFooter: {
			prev: 'Previous',
			next: 'Next'
		},
		nav: [
			{ text: 'Guide', link: '/en/guide/introduction' },
			{
				text: 'API',
				items: [
					{ text: '@mengxi-ark/utils', link: '/en/api/utils' },
					{ text: '@mengxi-ark/theme', link: '/en/api/theme' },
					{ text: '@mengxi-ark/hooks', link: '/en/api/hooks' },
					{ text: 'SearchForm', link: '/en/api/searchform' },
					{ text: 'EnhanceTable', link: '/en/api/enhancetable' },
					{ text: 'Lov', link: '/en/api/lov' },
					{ text: 'DocumentTable', link: '/en/api/documenttable' }
				]
			},
			{ text: 'Changelog', link: '/en/changelog' },
			{
				text: 'Links',
				items: [
					{ text: 'GitHub Repository', link: 'https://github.com/MengXi-Studio/mengxi-ark' },
					{ text: 'npm Organization', link: 'https://www.npmjs.com/org/mengxi-ark' }
				]
			}
		],
		sidebar: {
			'/en/guide/': guideSidebar,
			'/en/platform/': guideSidebar,
			'/en/dsl/': guideSidebar,
			'/en/api/': [
				{
					text: 'Core Packages',
					items: [
						{ text: '@mengxi-ark/utils', link: '/en/api/utils' },
						{ text: '@mengxi-ark/theme', link: '/en/api/theme' },
						{ text: '@mengxi-ark/hooks', link: '/en/api/hooks' }
					]
				},
				{
					text: 'Components (components / biz-components)',
					items: [
						{ text: 'SearchForm Query Bar', link: '/en/api/searchform' },
						{ text: 'EnhanceTable Enhanced Table', link: '/en/api/enhancetable' },
						{ text: 'Lov Value Selector', link: '/en/api/lov' },
						{ text: 'DocumentTable Document Table', link: '/en/api/documenttable' }
					]
				}
			]
		} satisfies DefaultTheme.Sidebar
	}
})
