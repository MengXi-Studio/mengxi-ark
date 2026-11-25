import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'zh-CN',
  title: '曦舟 MengXi Ark',
  description: '轻量可开箱，中台可插拔的 Vue3 中台前端框架',
  themeConfig: {
    nav: [
      { text: '快速上手', link: '/guide/getting-started' },
      {
        text: 'API 文档',
        items: [
          { text: '@mengxi-ark/utils', link: '/packages/utils' },
          { text: '@mengxi-ark/theme', link: '/packages/theme' },
          { text: '@mengxi-ark/hooks', link: '/packages/hooks' },
        ],
      },
    ],
    sidebar: [
      {
        text: '快速上手（轻量模式）',
        items: [
          { text: '指南', link: '/guide/getting-started' },
          { text: '@mengxi-ark/utils', link: '/packages/utils' },
          { text: '@mengxi-ark/theme', link: '/packages/theme' },
          { text: '@mengxi-ark/hooks', link: '/packages/hooks' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/MengXi-Studio/mengxi-ark' },
    ],
  },
});
