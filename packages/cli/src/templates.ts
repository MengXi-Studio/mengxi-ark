/**
 * 模板元数据与目录解析（模板为仓库内静态目录，随包发布 templates/）。
 */
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** 模板名 */
export type TemplateName = 'light' | 'platform'

/** 模板元数据 */
export interface TemplateMeta {
	name: TemplateName
	label: string
	description: string
}

/** 可选模板清单（轻量模板不含 runtime / 中台内容，规则随模板分档） */
export const TEMPLATES: TemplateMeta[] = [
	{
		name: 'light',
		label: '轻量模板（无基座）',
		description: 'utils / theme / hooks / components / biz-components 三包直装直用'
	},
	{
		name: 'platform',
		label: '中台基座模板',
		description: '轻量能力 + runtime 基座（createArkRuntime / registerModule / 工作台）'
	}
]

/**
 * 解析模板目录绝对路径（随包发布：dist 相对 templates/ 目录）。
 *
 * @param name - 模板名
 * @returns 模板目录绝对路径
 * @throws 模板目录不存在时抛出
 */
export function resolveTemplateDir(name: TemplateName): string {
	// src/templates.ts → ../templates/<name>；dist/templates.js 同理，两种产物形态均落在 cli 包根
	const dir = fileURLToPath(new URL(`../templates/${name}`, import.meta.url))
	if (!existsSync(dir)) {
		throw new Error(`模板目录缺失：${name}（${dir}）`)
	}
	return dir
}
