#!/usr/bin/env node
/**
 * peerDependency 对齐校验（CI 门禁第 5 项）：
 * 遍历 packages/<pkg>/package.json 与其 src 的 import 说明符：
 * 1. import @mengxi-ark/<pkg> → 必须声明在该包 dependencies（workspace:^ 形态）；
 * 2. import vue / pinia / vue-router → 必须声明在该包 peerDependencies。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const SOURCE_EXTENSIONS = new Set(['.ts', '.mts', '.vue']);
const VUE_ECOSYSTEM = new Set(['vue', 'pinia', 'vue-router']);

/** 说明符提取：静态 import/export ... from、副作用 import '...'、动态 import('...') */
const IMPORT_PATTERNS = [
  /(?:^|[\s;])(?:import|export)\b[^'"]*?from\s*['"]([^'"]+)['"]/g,
  /(?:^|[\s;])import\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

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
  const pkgDir = join(packagesDir, entry.name);
  const manifestPath = join(pkgDir, 'package.json');
  if (!existsSync(manifestPath)) continue;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
  const dependencies = manifest.dependencies ?? {};
  const peerDependencies = manifest.peerDependencies ?? {};
  const srcDir = join(pkgDir, 'src');
  for (const relPath of listSourceFiles(srcDir)) {
    fileCount += 1;
    const filePath = join(srcDir, relPath);
    const code = readFileSync(filePath, 'utf8');
    for (const specifier of extractSpecifiers(code)) {
      if (specifier.startsWith('.') || specifier.startsWith('/')) continue; // 相对路径忽略
      if (/^@mengxi-ark-internal\//.test(specifier)) continue; // 内部包不在本校验范围
      const ark = specifier.match(/^@mengxi-ark\/([a-z-]+?)(?:\/|$)/);
      if (ark) {
        const declared = dependencies[`@mengxi-ark/${ark[1]}`];
        if (typeof declared !== 'string' || !/^workspace:\^/.test(declared)) {
          violations.push({
            pkg: entry.name,
            filePath,
            specifier,
            reason: '未在 dependencies 声明 workspace:^ 形态依赖',
          });
        }
        continue;
      }
      if (VUE_ECOSYSTEM.has(specifier) && !(specifier in peerDependencies)) {
        violations.push({
          pkg: entry.name,
          filePath,
          specifier,
          reason: '未在 peerDependencies 声明',
        });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(`✘ peerDependency 对齐校验发现 ${violations.length} 处违规：`);
  for (const v of violations) {
    console.error(`  [${v.pkg}] ${v.filePath}`);
    console.error(`    import "${v.specifier}" — ${v.reason}`);
  }
  process.exit(1);
}
console.log(`✔ peerDependency 对齐校验通过（${fileCount} 个文件）`);
