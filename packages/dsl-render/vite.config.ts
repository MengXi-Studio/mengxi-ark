import { defineLibConfig } from '@mengxi-ark-internal/build-scripts/define-lib-config';

// UI 库为 optional peer：动态 import 原样保留为外部依赖，未安装的库不参与打包
export default defineLibConfig({
  name: 'dsl-render',
  externals: [/^ant-design-vue($|\/)/, /^element-plus($|\/)/],
  cssFileName: 'index',
});
