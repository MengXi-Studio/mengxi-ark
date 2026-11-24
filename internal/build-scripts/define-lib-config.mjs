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
 * @returns {import('vite').UserConfig} Vite 用户配置
 */
export function defineLibConfig(options) {
  const { name, sourcemap = false } = options;

  return defineConfig({
    plugins: [
      vue(),
      dts({
        include: ['src'],
        entryRoot: 'src',
      }),
    ],
    build: {
      lib: {
        entry: 'src/index.ts',
        formats: ['es', 'cjs'],
        fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
        name,
      },
      rollupOptions: {
        external: [
          /^vue($|\/)/,
          /^pinia($|\/)/,
          /^vue-router($|\/)/,
          /^@vue\//,
          /^@mengxi-ark\//,
        ],
      },
      target: 'es2022',
      emptyOutDir: true,
      sourcemap,
    },
  });
}
