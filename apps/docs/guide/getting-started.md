# 快速上手（轻量模式）

轻量模式不依赖任何基座：安装三个基础包即可在任意 Vue 3 项目中独立使用。本文所有示例与 `apps/demo-light` 工程保持一致，复制即可运行。

## 安装

```bash
pnpm add @mengxi-ark/utils @mengxi-ark/theme @mengxi-ark/hooks
```

## 引入主题样式

在应用入口引入一次即可，全部样式为 `--mx-*` CSS Variables：

```ts
import '@mengxi-ark/theme';
```

> `@mengxi-ark/theme` 的 exports 将 `.` 指向 `./dist/index.css`，直接引入包名即可，不要写子路径。

## 最小示例

`src/main.ts`：

```ts
import { createApp } from 'vue';
import { MX_I18N_KEY, createI18n, vPermission } from '@mengxi-ark/hooks';
import '@mengxi-ark/theme/dist/index.css';
import App from './App.vue';

// i18n 实例经 provide 下发，组件内 useI18n() 会自动复用
const i18n = createI18n({
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': { demo: { greeting: '你好，{name}！' } },
    'en-US': { demo: { greeting: 'Hello, {name}!' } },
  },
});

const app = createApp(App);

app.provide(MX_I18N_KEY, i18n);
app.directive('permission', vPermission);
app.mount('#app');
```

组件内使用 utils 与 hooks：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { formatMoney } from '@mengxi-ark/utils';
import { useRequest } from '@mengxi-ark/hooks';

const price = ref('1234567.891');

function fetchUser(): Promise<{ name: string }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ name: '曦舟' }), 500);
  });
}

const { data, loading, error, retry } = useRequest(fetchUser);
</script>

<template>
  <p>
    金额：{{ formatMoney(price) }}
  </p>
  <p v-if="loading">
    加载中…
  </p>
  <p v-else-if="error">
    加载失败，可调用 retry() 重试
  </p>
  <p v-else-if="data">
    用户：{{ data.name }}
  </p>
</template>
```

## 暗色模式

宿主根节点挂 `data-theme="dark"` 即可整体切换暗色，无需重新加载样式：

```ts
document.documentElement.dataset.theme = 'dark'; // 传 '' 恢复亮色
```

也可以挂 `.mx-theme-dark` 类，两种方式等价。

## 业务覆盖主题

在自有样式表中重定义同名 `--mx-*` 变量即可（CSS Variables 运行时生效），无需 fork theme：

```css
:root {
  --mx-color-primary: #0958d9;
  --mx-radius-base: 4px;
}
```

## 下一步

- [@mengxi-ark/utils API](/packages/utils)
- [@mengxi-ark/theme API](/packages/theme)
- [@mengxi-ark/hooks API](/packages/hooks)
