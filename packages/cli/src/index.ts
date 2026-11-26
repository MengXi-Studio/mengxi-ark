/**
 * create-mengxi-ark 交互入口（bin 命令实现）。
 *
 * 流程：选择模板 → 项目目录名 → 拷贝模板 + 占位符替换 / 版本绑定 → 输出后续指引。
 * 交互库为 @clack/prompts（任务文档 Q5）；本模块只做编排，拷贝 / 渲染逻辑在 scaffold.ts。
 */
import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import * as p from '@clack/prompts'
import { copyTemplate, getCliVersion } from './scaffold.js'
import { resolveTemplateDir, TEMPLATES } from './templates.js'
import type { TemplateName } from './templates.js'

/** 默认项目目录名 */
const DEFAULT_PROJECT_NAME = 'my-ark-app'

/**
 * 脚手架主流程（由 bin/create-mengxi-ark.js 调用；导出供单测与程序化调用）。
 */
export async function run(): Promise<void> {
	p.intro('create-mengxi-ark · 曦舟 MengXi Ark 脚手架')

	const template = await p.select<TemplateName>({
		message: '选择项目模板',
		options: TEMPLATES.map(meta => ({ value: meta.name, label: meta.label, hint: meta.description }))
	})
	if (p.isCancel(template)) {
		p.cancel('已取消')
		return
	}

	const projectName = await p.text({
		message: '项目目录名',
		placeholder: DEFAULT_PROJECT_NAME,
		defaultValue: DEFAULT_PROJECT_NAME
	})
	if (p.isCancel(projectName)) {
		p.cancel('已取消')
		return
	}

	const targetDir = resolve(process.cwd(), projectName)
	if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
		const overwrite = await p.confirm({ message: `目录 ${projectName} 非空，仍要继续生成？（不覆盖已有文件）` })
		if (p.isCancel(overwrite) || !overwrite) {
			p.cancel('已取消')
			return
		}
	}

	const spinner = p.spinner()
	spinner.start('正在生成工程…')
	try {
		const files = copyTemplate(resolveTemplateDir(template), targetDir, {
			projectName,
			arkVersion: getCliVersion()
		})
		spinner.stop(`已生成 ${files.length} 个文件 → ${targetDir}`)
	} catch (error) {
		spinner.stop('生成失败')
		p.cancel(error instanceof Error ? error.message : String(error))
		process.exitCode = 1
		return
	}

	p.outro(['', '后续步骤：', `  cd ${projectName}`, '  pnpm install', '  pnpm dev', '', `使用说明见工程内 README.md；AI 用法速查见 .trae/rules/（随模板分档）。`].join('\n'))
}
