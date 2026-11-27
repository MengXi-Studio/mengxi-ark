<template>
	<a-layout v-if="rt" class="ark-layout" :class="{ 'ark-layout--collapsed': collapsed }">
		<a-layout-sider v-model:collapsed="collapsed" class="ark-layout__sider" :collapsible="collapsible" :trigger="null" :width="224" :collapsed-width="64">
			<div class="ark-layout__logo">
				<img v-if="typeof layoutOptions.logo === 'string'" class="ark-layout__logo-img" :src="layoutOptions.logo" alt="logo" />
				<component :is="layoutOptions.logo" v-else-if="layoutOptions.logo" class="ark-layout__logo-comp" />
				<span v-else class="ark-layout__logo-mark" aria-hidden="true">{{ appName.charAt(0) }}</span>
				<span class="ark-layout__logo-text">{{ appName }}</span>
			</div>
			<a-menu class="ark-layout__menu" mode="inline" :items="menuItems" :selected-keys="selectedKeys" @click="onMenuClick" />
			<div v-if="collapsible" class="ark-layout__sider-footer" role="button" :title="collapsed ? '展开菜单' : '收起菜单'" @click="collapsed = !collapsed">
				<svg class="ark-layout__collapse-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
					<path d="M10 3.5 5.5 8l4.5 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
				</svg>
			</div>
		</a-layout-sider>
		<a-layout class="ark-layout__body">
			<a-layout-header class="ark-layout__header">
				<component :is="layoutOptions.headerActions" v-if="layoutOptions.headerActions" />
				<component :is="layoutOptions.user" v-if="layoutOptions.user" />
				<a-dropdown v-else-if="userMenuItems.length" :trigger="['click']">
					<span class="ark-layout__user-trigger">
						<span class="ark-layout__avatar" aria-hidden="true">{{ userName.charAt(0) }}</span>
						<span class="ark-layout__user">{{ userName }}</span>
					</span>
					<template #overlay>
						<a-menu :items="userMenuAntItems" @click="onUserMenuClick" />
					</template>
				</a-dropdown>
				<template v-else>
					<span class="ark-layout__avatar" aria-hidden="true">{{ userName.charAt(0) }}</span>
					<span class="ark-layout__user">{{ userName }}</span>
				</template>
				<slot name="header-actions" />
			</a-layout-header>
			<div class="ark-layout__tabs" @contextmenu="onTabsContextMenu">
				<a-tabs v-model:active-key="activeTabKey" type="editable-card" hide-add @edit="onTabEdit">
					<a-tab-pane v-for="tab in tabs" :key="tab.key" :tab="tab.title" :closable="tab.closable !== false" />
				</a-tabs>
			</div>
			<a-layout-content class="ark-layout__content">
				<router-view :key="tabRefreshTick" />
			</a-layout-content>
		</a-layout>
		<!-- 页签右键菜单：内置项（刷新 / 关闭左侧 / 右侧 / 其他）+ tabContextMenu.items 自定义项 -->
		<Teleport to="body">
			<div v-if="tabMenu" class="ark-tab-context-backdrop" @click="closeTabMenu" @contextmenu.prevent="closeTabMenu" />
			<div v-if="tabMenu" class="ark-tab-context" :style="{ left: `${tabMenu.x}px`, top: `${tabMenu.y}px` }">
				<template v-for="item in tabMenuItems" :key="item.key">
					<div v-if="item.divided" class="ark-tab-context__divider" />
					<div class="ark-tab-context__item" :class="{ 'ark-tab-context__item--disabled': item.disabled }" @click="onTabMenuItemClick(item)">
						<component :is="item.icon" v-if="item.icon" class="ark-tab-context__icon" />
						<span>{{ item.label }}</span>
					</div>
				</template>
			</div>
		</Teleport>
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
import { Dropdown, Layout, Menu, Tabs } from 'ant-design-vue'
import type { MenuProps } from 'ant-design-vue'
import { MxDialog } from '@mengxi-ark/components'
import { ARK_LAYOUT_OPTIONS_KEY, ARK_RUNTIME_KEY } from '../key'
import { findMenuItem, flattenMenuItems } from '../services/menuService'
import type { ArkLayoutOptions, MenuItem, TabContextMenuItem } from '../types'

const ALayout = Layout
const ALayoutSider = Layout.Sider
const ALayoutHeader = Layout.Header
const ALayoutContent = Layout.Content
const AMenu = Menu
const ATabs = Tabs
const ATabPane = Tabs.TabPane
const ADropdown = Dropdown

const rt = inject(ARK_RUNTIME_KEY, undefined)
const layoutOptions = inject(ARK_LAYOUT_OPTIONS_KEY, {} as ArkLayoutOptions)
/** 侧栏折叠开关：options.collapsible 控制，默认显示折叠条（false 隐藏折叠条并禁用收起） */
const collapsible = computed(() => layoutOptions.collapsible !== false)
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

// —— 页签右键菜单（options.tabContextMenu：内置项 + 自定义项追加） ——
const tabMenu = ref<{ x: number; y: number; tabKey: string } | null>(null)

/** 刷新信号：refreshTick 递增作为 router-view key 触发页面重挂载 */
const tabRefreshTick = computed(() => rt?.tabService.refreshTick.value ?? 0)

function onTabsContextMenu(event: MouseEvent): void {
	if (!rt) return
	const tabEl = (event.target as HTMLElement).closest('.ant-tabs-tab')
	if (!tabEl) return
	// antdv4 页签节点无 key 标识属性（data-node-key 为 React 版特有），
	// 按 DOM 中页签节点顺序映射 tabs 数组取 key（渲染顺序与数组一致）
	const tabNodes = (event.currentTarget as HTMLElement).querySelectorAll('.ant-tabs-tab')
	const index = Array.prototype.indexOf.call(tabNodes, tabEl)
	const tab = rt.tabService.tabs.value[index]
	if (index < 0 || !tab) return
	event.preventDefault()
	// 菜单视口边界保护：靠近右/下边缘时向内收
	tabMenu.value = {
		x: Math.min(event.clientX, window.innerWidth - 170),
		y: Math.min(event.clientY, window.innerHeight - 190),
		tabKey: tab.key
	}
}

function closeTabMenu(): void {
	tabMenu.value = null
}

const tabMenuItems = computed<TabContextMenuItem[]>(() => {
	const config = layoutOptions.tabContextMenu
	const tabKey = tabMenu.value?.tabKey ?? ''
	const items: TabContextMenuItem[] = []
	if (config?.builtin !== false) {
		const list = rt?.tabService.tabs.value ?? []
		const index = list.findIndex(tab => tab.key === tabKey)
		const target = list[index]
		const targetClosable = target != null && target.closable !== false
		const hasClosableLeft = list.slice(0, index).some(tab => tab.closable !== false)
		const hasClosableRight = list.slice(index + 1).some(tab => tab.closable !== false)
		const hasClosableOther = list.some((tab, i) => i !== index && tab.closable !== false)
		items.push(
			{ key: 'ark-builtin-refresh', label: '刷新' },
			{ key: 'ark-builtin-close-left', label: '关闭左侧', divided: true, disabled: !targetClosable || !hasClosableLeft },
			{ key: 'ark-builtin-close-right', label: '关闭右侧', disabled: !targetClosable || !hasClosableRight },
			{ key: 'ark-builtin-close-other', label: '关闭其他', disabled: !targetClosable || !hasClosableOther }
		)
	}
	if (config?.items?.length) {
		const [first, ...rest] = config.items
		const needDivider = config.builtin !== false
		items.push(...(needDivider ? [{ ...first, divided: true }, ...rest] : config.items))
	}
	return items
})

function onTabMenuItemClick(item: TabContextMenuItem): void {
	if (item.disabled || !tabMenu.value || !rt) return
	const tabKey = tabMenu.value.tabKey
	closeTabMenu()
	if (item.key === 'ark-builtin-refresh') rt.tabService.refresh(tabKey)
	else if (item.key === 'ark-builtin-close-left') rt.tabService.closeLeft(tabKey)
	else if (item.key === 'ark-builtin-close-right') rt.tabService.closeRight(tabKey)
	else if (item.key === 'ark-builtin-close-other') rt.tabService.closeOther(tabKey)
	else layoutOptions.tabContextMenu?.onClick?.(item.key, tabKey)
}

function onDialogDismiss(key: string): void {
	rt?.tabService.closeDialog(key)
}

const userName = computed(() => rt?.context.user?.name ?? '未登录')
const appName = computed(() => rt?.context.appName ?? '曦舟中台')

/** 声明式用户菜单（options.userMenu）：保留内置头像渲染，仅接管下拉菜单 */
const userMenuItems = computed(() => layoutOptions.userMenu?.items ?? [])

/** 转为 antd Menu items 数据（divided 项展开为分隔线节点，规避 template v-for 多子节点 key 编译错误） */
const userMenuAntItems = computed<MenuProps['items']>(() => {
	const nodes: NonNullable<MenuProps['items']> = []
	for (const item of userMenuItems.value) {
		if (item.divided) nodes.push({ type: 'divider', key: `${item.key}-divider` })
		nodes.push({ key: item.key, label: item.label, icon: item.icon ? h(item.icon) : undefined })
	}
	return nodes
})

function onUserMenuClick(info: { key: string | number }): void {
	layoutOptions.userMenu?.onClick?.(String(info.key))
}
</script>

<style lang="scss" src="./style/index.scss" scoped></style>
