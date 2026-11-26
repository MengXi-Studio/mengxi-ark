import { defineConfig } from 'vitepress';
import { enConfig } from './en';
import { BASE, sharedConfig } from './shared';
import { zhConfig } from './zh';

/**
 * 文档站入口配置：shared（双语共用）+ locales（root=中文，en=英文镜像）。
 * base 支持部署子路径定制（如 GitHub Pages 项目页），通过 DOCS_BASE 环境变量注入。
 */
export default defineConfig({
  ...sharedConfig,
  srcDir: './src',
  base: BASE,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/',
      description: zhConfig.description,
      themeConfig: zhConfig.themeConfig,
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      description: enConfig.description,
      themeConfig: enConfig.themeConfig,
    },
  },
});
