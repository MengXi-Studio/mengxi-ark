import { defineLibConfig } from '@mengxi-ark-internal/build-scripts/define-lib-config'

// 内置 Layout 直接引用 ant-design-vue（UI 依赖唯一收敛点）：外部化保留为运行时依赖
export default defineLibConfig({
	name: 'runtime',
	externals: [/^ant-design-vue($|\/)/],
	cssFileName: 'index'
})
