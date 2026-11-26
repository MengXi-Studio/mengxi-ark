/**
 * 脚手架纯逻辑层：模板拷贝 + 占位符替换 + 版本绑定。
 *
 * - 占位符：`__PROJECT_NAME__`（项目名）、`__ARK_VERSION__`（框架包版本，与 cli 自身版本绑定）；
 * - 二进制文件（图片等）原样拷贝不做替换；
 * - 全部为纯函数（无交互、无 console），供 bin 入口与单测复用。
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 模板渲染变量 */
export interface TemplateVars {
  /** 项目目录名（写入模板 package.json name） */
  projectName: string;
  /** 框架包版本（与 cli 自身版本绑定，注入模板 package.json） */
  arkVersion: string;
}

/** 项目名占位符 */
export const PLACEHOLDER_PROJECT_NAME = '__PROJECT_NAME__';
/** 框架版本占位符 */
export const PLACEHOLDER_ARK_VERSION = '__ARK_VERSION__';

/** 二进制扩展名（跳过占位符替换，原样拷贝） */
const BINARY_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svg']);

/**
 * 文本占位符替换：`__PROJECT_NAME__` → projectName，`__ARK_VERSION__` → arkVersion。
 *
 * @param content - 模板文件内容
 * @param vars - 渲染变量
 * @returns 替换后的内容
 */
export function renderPlaceholders(content: string, vars: TemplateVars): string {
  return content
    .replaceAll(PLACEHOLDER_PROJECT_NAME, vars.projectName)
    .replaceAll(PLACEHOLDER_ARK_VERSION, vars.arkVersion);
}

/** 读取 cli 自身 package.json 的版本号（模板 @mengxi-ark/* 版本与其绑定对齐） */
export function getCliVersion(): string {
  // src/scaffold.ts → ../package.json；dist/scaffold.js → ../package.json，两种产物形态均落在 cli 包根
  const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
  return pkg.version ?? '0.0.0';
}

/**
 * 递归拷贝模板目录并做占位符替换。
 *
 * @param srcDir - 模板源目录（templates/light | templates/platform）
 * @param destDir - 目标工程目录（不存在则递归创建）
 * @param vars - 渲染变量
 * @returns 拷贝的文件相对路径清单（相对 destDir，POSIX 风格分隔符）
 * @throws 模板源目录不存在时抛出
 */
export function copyTemplate(srcDir: string, destDir: string, vars: TemplateVars): string[] {
  if (!existsSync(srcDir)) {
    throw new Error(`模板目录不存在：${srcDir}`);
  }
  mkdirSync(destDir, { recursive: true });

  const copied: string[] = [];
  const walk = (src: string, dest: string): void => {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      if (statSync(srcPath).isDirectory()) {
        walk(srcPath, destPath);
        continue;
      }
      if (BINARY_EXTENSIONS.has(extname(entry).toLowerCase())) {
        copyFileSync(srcPath, destPath);
      } else {
        const content = readFileSync(srcPath, 'utf8');
        writeFileSync(destPath, renderPlaceholders(content, vars), 'utf8');
      }
      copied.push(destPath);
    }
  };
  walk(srcDir, destDir);
  // 统一以顶层 destDir 为基准输出相对路径（POSIX 风格分隔符）
  return copied.map((destPath) => relative(destDir, destPath).replaceAll('\\', '/'));
}
