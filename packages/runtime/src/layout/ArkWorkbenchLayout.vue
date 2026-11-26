<template>
	<a-layout v-if="rt" class="ark-layout">
		<a-layout-sider v-model:collapsed="collapsed" collapsible class="ark-layout__sider">
			<div class="ark-layout__logo">{{ rt.context.appName ?? '曦舟中台' }}</div>
			<a-menu :items="menuItems" :selected-keys="selectedKeys" @click="onMenuClick" />
		</a-layout-sider>
		<a-layout class="ark-layout__body">
			<a-layout-header class="ark-layout__header">
				<span class="ark-layout__user">{{ userName }}</span>
				<slot name="header-actions" />
			</a-layout-header>
			<div class="ark-layout__tabs">
				<a-tabs type="editable-card" hide-add v-model:active-key="activeTabKey" @edit="onTabEdit">
					<a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.title" :closable="tab.closable !== false" />
				</a-tabs>
			</div>
			<a-layout-content class="ark-layout__content">
				<router-view />
			</a-layout-content>
		</a-layout>
		<!-- openMode 'dialog'：业务组件直传，非路由挂载（任务文档 Q2） -->
		<MxDialog v-for="dialog in dialogs" :key="dialog.key" :open="true" :title="dialog.title" :width="dialog.width" :footer="false" @update:open="onDialogDismiss(dialog.key)">
			<component :is="dialog.component" v-bind="dialog.props" />
		</MxDialog>
	</a-layout>
	<div v-else class="ark-layout ark-layout--missing">未探测到 ArkRuntime：请先执行 createArkRuntime(...).install(app)</div>
</template>

<script setup lang="ts">
/**
 * 内置工作台 Layout（可替换的默认实现）：Sider 菜单 + Header 用户区 + Tabs 页签条 + router-view。
 * UI 依赖（ant-design-vue）唯一允许收敛点（规范 §9.1，任务文档 Q3）；
 * 经 ARK_RUNTIME_KEY inject 获取 tabService / menuService / context，业务可传 options.layout 整体替换。
 */
import { computed, h, inject, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Layout, Menu, Tabs } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'
import { MxDialog } from '@mengxi-ark/components'
import { ARK_RUNTIME_KEY } from '../key'
import { findMenuItem, flattenMenuItems } from '../services/menuService'
import type { MenuItem } from '../types'

const ALayout = Layout
const ALayoutSider = Layout.Sider
const ALayoutHeader = Layout.Header
const ALayoutContent = Layout.Content
const AMenu = Menu
const ATabs = Tabs
const ATabPane = Tabs.TabPane

const rt = inject(ARK_RUNTIME_KEY, undefined)
if (!rt) {
	console.warn('[@mengxi-ark/runtime] ArkWorkbenchLayout 未探测到 ARK_RUNTIME_KEY，需在 createArkRuntime(...).install(app) 之后使用')
}

const collapsed = ref(false)
const route = useRoute()

function toMenuItems(items: MenuItem[]): MenuProps['items'] {
	return items.map(item => ({
		key: item.key,
		label: item.title,
		icon: item.icon ? h(item.icon) : undefined,
		children: item.children?.length ? toMenuItems(item.children) : undefined
	}))
}

const menuItems = computed<MenuProps['items']>(() => toMenuItems(rt?.menuService.menus.value ?? []))

/** 高亮与当前路由 path 匹配的叶子菜单 */
const selectedKeys = computed<string[]>(() =>
	flattenMenuItems(rt?.menuService.menus.value ?? [])
		.filter(item => item.path && item.path === route.path)
		.map(item => item.key)
)

function onMenuClick(info: { key: string | number }): void {
	if (!rt) return
	const item = findMenuItem(rt.menuService.menus.value, String(info.key))
	if (item?.path) rt.tabService.open(item.path, { title: item.title })
}

const tabs = computed(() => rt?.tabService.tabs.value ?? [])
const dialogs = computed(() => rt?.tabService.dialogs.value ?? [])

const activeTabKey = computed<string>({
	get: () => rt?.tabService.activeKey.value ?? '',
	set: key => rt?.tabService.activate(key)
})

function onTabEdit(key: string | number | MouseEvent | KeyboardEvent, action: 'add' | 'remove'): void {
	if (!rt || action !== 'remove') return
	if (typeof key === 'string' || typeof key === 'number') rt.tabService.close(String(key))
}

function onDialogDismiss(key: string): void {
	rt?.tabService.closeDialog(key)
}

const userName = computed(() => rt?.context.user?.name ?? '未登录')
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
