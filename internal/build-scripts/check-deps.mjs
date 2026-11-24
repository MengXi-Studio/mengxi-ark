#!/usr/bin/env node
/**
 * 依赖链路检查（CI 门禁第 1 项）：
 * 扫描 packages/<pkg>/src 下 .ts/.mts/.vue 文件的 import 说明符，按依赖层级表阻断反向依赖。
 *
 * 规则：
 * 1. 目标包层级 > 当前包层级 → 报错（反向依赖）；
 * 2. 目标为 theme → 一律报错（theme 为纯样式层，无 JS 可被 import）；
 * 3. 说明符为 @mengxi-ark-internal/* → 报错（内部包禁止进入 src 运行时代码）；
 * 4. 相对路径 import 忽略。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

/** 依赖层级表（数值越小越底层），cli 特视为 5 */
const LEVELS = {
  utils: 0,
  theme: 0,
  hooks: 1,
  components: 2,
  'biz-components': 3,
  runtime: 4,
  'dsl-render': 4,
};
const CLI_LEVEL = 5;
const SOURCE_EXTENSIONS = new Set(['.ts', '.mts', '.vue']);

/** 说明符提取：静态 import/export ... from、副作用 import '...'、动态 import('...') */
const IMPORT_PATTERNS = [
  /(?:^|[\s;])(?:import|export)\b[^'"]*?from\s*['"]([^'"]+)['"]/g,
  /(?:^|[\s;])import\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function packageLevel(dirName) {
  if (dirName === 'cli') return CLI_LEVEL;
  const level = LEVELS[dirName];
  return level === undefined ? null : level;
}

function listSourceFiles(srcDir) {
  if (!existsSync(srcDir)) return [];
  return readdirSync(srcDir, { recursive: true }).filter((relPath) =>
    SOURCE_EXTENSIONS.has(extname(relPath)),
  );
}

function extractSpecifiers(code) {
  const specifiers = new Set();
  for (const pattern of IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(code)) !== null) {
      specifiers.add(match[1]);
    }
  }
  return [...specifiers];
}

const violations = [];
let fileCount = 0;
const packagesDir = join(process.cwd(), 'packages');

for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const currentLevel = packageLevel(entry.name);
  if (currentLevel === null) continue; // 未登记层级的目录跳过
  const srcDir = join(packagesDir, entry.name, 'src');
  for (const relPath of listSourceFiles(srcDir)) {
    fileCount += 1;
    const filePath = join(srcDir, relPath);
    const code = readFileSync(filePath, 'utf8');
    for (const specifier of extractSpecifiers(code)) {
      if (specifier.startsWith('.') || specifier.startsWith('/')) continue; // 相对路径忽略
      if (/^@mengxi-ark-internal\//.test(specifier)) {
        violations.push({
          pkg: entry.name,
          filePath,
          specifier,
          reason: '内部包禁止进入 src 运行时代码',
        });
        continue;
      }
      const ark = specifier.match(/^@mengxi-ark\/([a-z-]+)/);
      if (!ark) continue;
      const target = ark[1];
      if (target === 'theme') {
        violations.push({
          pkg: entry.name,
          filePath,
          specifier,
          reason: 'theme 为纯样式层，无 JS 可被 import',
        });
        continue;
      }
      const targetLevel = packageLevel(target);
      if (targetLevel !== null && targetLevel > currentLevel) {
        violations.push({
          pkg: entry.name,
          filePath,
          specifier,
          reason: `反向依赖（${target} 层级 ${targetLevel} > ${entry.name} 层级 ${currentLevel}）`,
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`✘ 依赖链路检查发现 ${violations.length} 处违规：`);
  for (const v of violations) {
    console.error(`  [${v.pkg}] ${v.filePath}`);
    console.error(`    import "${v.specifier}" — ${v.reason}`);
  }
  process.exit(1);
}
console.log(`✔ 依赖链路检查通过（${fileCount} 个文件）`);
