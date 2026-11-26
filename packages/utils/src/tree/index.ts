/**
 * 树操作可选配置。
 */
export interface TreeOptions {
	/** 子节点字段名，默认 'children' */
	childrenField?: string
}

const DEFAULT_CHILDREN_FIELD = 'children'

function getChildren<T extends object>(node: T, childrenField: string): T[] | null {
	const children = (node as Record<string, unknown>)[childrenField]
	return Array.isArray(children) ? (children as T[]) : null
}

/**
 * 深度优先（前序）遍历树，对每个节点执行回调。
 *
 * @param tree 树根数组
 * @param callback 回调，入参为 (当前节点, 父节点)；根节点的 parent 为 null
 * @param options 可选配置：childrenField（默认 'children'）
 * @returns 无
 *
 * @example
 * forEachTree(menus, (node, parent) => {
 *   console.log(node.id, parent?.id ?? null);
 * });
 */
export function forEachTree<T extends object>(tree: T[], callback: (node: T, parent: T | null) => void, options?: TreeOptions): void {
	const childrenField = options?.childrenField ?? DEFAULT_CHILDREN_FIELD
	const walk = (nodes: T[], parent: T | null): void => {
		for (const node of nodes) {
			callback(node, parent)
			const children = getChildren(node, childrenField)
			if (children) walk(children, node)
		}
	}
	walk(tree, null)
}

/**
 * 映射树：对每个节点调用 mapper 生成新节点，返回全新的一棵树。
 *
 * 纯函数不改入参；若原节点存在子节点数组，新节点同名字段的子树由本函数递归重建
 * （mapper 返回对象中携带的子节点字段会被递归结果覆盖）。
 *
 * @param tree 树根数组
 * @param mapper 节点映射函数，返回新节点对象
 * @param options 可选配置：childrenField（默认 'children'）
 * @returns 映射后的新树
 *
 * @example
 * const tagged = mapTree(menus, (node) => ({ ...node, label: node.name }));
 */
export function mapTree<T extends object, U extends object>(tree: T[], mapper: (node: T) => U, options?: TreeOptions): U[] {
	const childrenField = options?.childrenField ?? DEFAULT_CHILDREN_FIELD
	return tree.map(node => {
		const mapped: U = { ...mapper(node) }
		const children = getChildren(node, childrenField)
		if (children) {
			;(mapped as Record<string, unknown>)[childrenField] = mapTree(children, mapper, options)
		}
		return mapped
	})
}

/**
 * 在树中查找第一个满足条件的节点（深度优先前序）。
 *
 * @param tree 树根数组
 * @param predicate 节点匹配函数
 * @param options 可选配置：childrenField（默认 'children'）
 * @returns 第一个命中的节点；未命中返回 null
 *
 * @example
 * const target = findTree(menus, (node) => node.id === 121);
 */
export function findTree<T extends object>(tree: T[], predicate: (node: T) => boolean, options?: TreeOptions): T | null {
	const childrenField = options?.childrenField ?? DEFAULT_CHILDREN_FIELD
	for (const node of tree) {
		if (predicate(node)) return node
		const children = getChildren(node, childrenField)
		if (children) {
			const found = findTree(children, predicate, options)
			if (found) return found
		}
	}
	return null
}

/**
 * 过滤树：保留 predicate 命中的节点，以及「存在命中后代」的祖先节点。
 *
 * 纯函数不改入参，返回新树；所有保留节点的子树均为过滤后的结果
 * （命中节点的未命中子节点同样会被剔除）。
 *
 * @param tree 树根数组
 * @param predicate 节点匹配函数
 * @param options 可选配置：childrenField（默认 'children'）
 * @returns 过滤后的新树；全部未命中时返回 []
 *
 * @example
 * // 菜单按关键词过滤：命中「菜单」的节点及其祖先链被保留
 * const matched = filterTree(menus, (node) => node.name.includes('菜单'));
 */
export function filterTree<T extends object>(tree: T[], predicate: (node: T) => boolean, options?: TreeOptions): T[] {
	const childrenField = options?.childrenField ?? DEFAULT_CHILDREN_FIELD
	const result: T[] = []
	for (const node of tree) {
		const children = getChildren(node, childrenField)
		const filteredChildren = children ? filterTree(children, predicate, options) : []
		if (predicate(node) || filteredChildren.length > 0) {
			const cloned = { ...node }
			if (children) {
				;(cloned as Record<string, unknown>)[childrenField] = filteredChildren
			}
			result.push(cloned)
		}
	}
	return result
}
