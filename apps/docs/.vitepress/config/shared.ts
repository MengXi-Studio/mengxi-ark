import { defineConfig } from 'vitepress';

/**
 * 站点共享配置（双语共用）：标题 / Markdown / SEO head / 搜索 / 社交 / 页脚。
 * 拆分范式参考 unix-router packages/docs。
 */

/** 站点标题 */
const TITLE = '曦舟 MengXi Ark';
/** 站点描述（SEO 与分享卡） */
const DESCRIPTION = '轻量可开箱，中台可插拔的 Vue3 中台前端框架';

export const sharedConfig = defineConfig({
  title: TITLE,
  /** 显示「最后更新时间」 */
  lastUpdated: true,
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'one-dark-pro',
    },
  },
  head: [
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: TITLE }],
    ['meta', { property: 'og:title', content: TITLE }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: TITLE }],
  ],
  themeConfig: {
    /** 本地搜索（无外部依赖，支持中文分词有限但够用） */
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/MengXi-Studio/mengxi-ark' },
      { icon: 'npm', link: 'https://www.npmjs.com/org/mengxi-ark' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present 梦曦工作室',
    },
  },
  /** 站点描述注入 */
  description: DESCRIPTION,
});
