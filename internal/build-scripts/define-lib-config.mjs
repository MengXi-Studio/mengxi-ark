import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';

/**
 * 构建库配置生成器（Vite lib mode + vite-plugin-dts）。
 *
 * 所有 @mengxi-ark/* 包的 vite.config.ts 统一通过本函数收敛构建配置：
 * 产物为 dist/index.js（ESM）+ dist/index.cjs（CJS）+ 完整 .d.ts 类型声明。
 *
 * @param {object} options
 * @param {string} options.name 包名短横线形式（如 "utils"）
 * @param {boolean} [options.sourcemap=false] 是否产出 sourcemap
 * @param {Array<string|RegExp>} [options.externals=[]] 额外外部化说明符（如 optional peer 的 UI 库）
 * @param {string} [options.cssFileName] lib 模式 CSS 抽离产物文件名（默认 Vite 内置 style.css）
 * @returns {import('vite').UserConfig} Vite 用户配置
 */
export function defineLibConfig(options) {
  const { name, sourcemap = false, externals = [], cssFileName } = options;

  return defineConfig({
    plugins: [
      vue(),
      dts({
        include: ['src'],
        entryRoot: 'src',
        // SFC 声明支持：显式指定 vue processor（自动探测在本工程 include 形式下不生效，
        // 缺失时 dist 中 `./Xxx.vue` 引用无对应 .d.ts，下游 TS2307）
        processor: 'vue',
        cleanVueFileName: true,
      }),
    ],
    build: {
      lib: {
        entry: 'src/index.ts',
        formats: ['es', 'cjs'],
        fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
        name,
        ...(cssFileName ? { cssFileName } : {}),
      },
      rollupOptions: {
        external: [
          /^vue($|\/)/,
          /^pinia($|\/)/,
          /^vue-router($|\/)/,
          /^@vue\//,
          /^@mengxi-ark\//,
          ...externals,
        ],
      },
      target: 'es2022',
      emptyOutDir: true,
      sourcemap,
    },
  });
}
