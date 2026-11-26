import { defineConfig } from 'vitepress';
import type { DefaultTheme } from 'vitepress';

/**
 * 简体中文 locale 配置（站点根语言）：nav / sidebar / editLink / 本地搜索翻译。
 * 拆分范式参考 unix-router packages/docs。
 */

/** 仓库内编辑链接基址（本仓库默认分支为 master，内容位于 apps/docs/src） */
const REPO_EDIT_BASE = 'https://github.com/MengXi-Studio/mengxi-ark/edit/master/apps/docs/src';

export const zhConfig = defineConfig({
  description: '轻量可开箱，中台可插拔的 Vue3 中台前端框架',
  themeConfig: {
    editLink: {
      pattern: `${REPO_EDIT_BASE}/:path`,
      text: '在 GitHub 上编辑此页',
    },
    outlineTitle: '本页内容',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到亮色模式',
    darkModeSwitchTitle: '切换到暗色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '回到顶部',
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
    nav: [
      { text: '指南', link: '/guide/introduction' },
      {
        text: 'API',
        items: [
          { text: '@mengxi-ark/utils', link: '/api/utils' },
          { text: '@mengxi-ark/theme', link: '/api/theme' },
          { text: '@mengxi-ark/hooks', link: '/api/hooks' },
          { text: 'SearchForm', link: '/api/searchform' },
          { text: 'EnhanceTable', link: '/api/enhancetable' },
          { text: 'Lov', link: '/api/lov' },
          { text: 'DocumentTable', link: '/api/documenttable' },
        ],
      },
      { text: '中台进阶', link: '/platform/' },
      { text: 'DSL 配置渲染', link: '/dsl/' },
      { text: '更新日志', link: '/changelog' },
      {
        text: '相关链接',
        items: [
          { text: 'GitHub 仓库', link: 'https://github.com/MengXi-Studio/mengxi-ark' },
          { text: 'npm 组织', link: 'https://www.npmjs.com/org/mengxi-ark' },
          { text: '问题反馈', link: '/faq/feedback' },
        ],
      },
    ],
    sidebar: {
      '/guide/': [
        {
          text: '入门',
          items: [
            { text: '介绍', link: '/guide/introduction' },
            { text: '快速上手（轻量模式）', link: '/guide/getting-started' },
          ],
        },
      ],
      '/api/': [
        {
          text: '通用包',
          items: [
            { text: '@mengxi-ark/utils', link: '/api/utils' },
            { text: '@mengxi-ark/theme', link: '/api/theme' },
            { text: '@mengxi-ark/hooks', link: '/api/hooks' },
          ],
        },
        {
          text: '组件库（components / biz-components）',
          items: [
            { text: 'SearchForm 高级查询区', link: '/api/searchform' },
            { text: 'EnhanceTable 增强表格', link: '/api/enhancetable' },
            { text: 'Lov 值集选择器', link: '/api/lov' },
            { text: 'DocumentTable 单据表格', link: '/api/documenttable' },
          ],
        },
      ],
      '/platform/': [
        {
          text: '中台进阶（Runtime 基座）',
          items: [
            { text: 'createArkRuntime 与工作台', link: '/platform/' },
            { text: 'registerModule 模块开发', link: '/platform/module' },
            { text: '全局上下文与双模式降级', link: '/platform/context' },
          ],
        },
      ],
      '/dsl/': [
        {
          text: 'DSL 配置渲染（加速方案）',
          items: [{ text: 'Schema 与三渲染器', link: '/dsl/' }],
        },
      ],
      '/': [
        {
          text: '其他',
          items: [
            { text: '更新日志', link: '/changelog' },
            { text: '反馈渠道', link: '/faq/feedback' },
          ],
        },
      ],
    } satisfies DefaultTheme.Sidebar,
  },
} satisfies DefaultTheme.Config);
