import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import HomeBadges from './components/HomeBadges.vue';

/**
 * 自定义主题：在默认主题之上，向首页 Hero 下方注入徽章插槽。
 */
export default {
  ...DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-hero-after': () => h(HomeBadges),
    }),
} satisfies Theme;
