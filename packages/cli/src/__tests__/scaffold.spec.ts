import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { copyTemplate, getCliVersion, PLACEHOLDER_ARK_VERSION, PLACEHOLDER_PROJECT_NAME, renderPlaceholders } from '../scaffold';

/** 临时目录（用后清理） */
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'ark-cli-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('renderPlaceholders', () => {
  const vars = { projectName: 'my-app', arkVersion: '1.2.3' };

  it('替换项目名与版本占位符', () => {
    const content = `{"name": "${PLACEHOLDER_PROJECT_NAME}", "version": "${PLACEHOLDER_ARK_VERSION}"}`;
    expect(renderPlaceholders(content, vars)).toBe('{"name": "my-app", "version": "1.2.3"}');
  });

  it('同一占位符出现多次全部替换', () => {
    expect(renderPlaceholders(`${PLACEHOLDER_PROJECT_NAME}/${PLACEHOLDER_PROJECT_NAME}`, vars)).toBe('my-app/my-app');
  });

  it('无占位符内容原样返回', () => {
    expect(renderPlaceholders('no placeholder', vars)).toBe('no placeholder');
  });
});

describe('copyTemplate', () => {
  it('递归拷贝 + 子目录 + 占位符替换 + 返回相对路径清单', () => {
    const srcDir = makeTempDir();
    const destDir = join(makeTempDir(), 'my-app');

    writeFileSync(join(srcDir, 'package.json'), `{"name": "${PLACEHOLDER_PROJECT_NAME}", "dep": "${PLACEHOLDER_ARK_VERSION}"}`);
    writeFileSync(join(srcDir, 'README.md'), '# __PROJECT_NAME__');
    mkdirSync(join(srcDir, 'src', 'nested'), { recursive: true });
    writeFileSync(join(srcDir, 'src', 'main.ts'), 'console.log(1);');
    writeFileSync(join(srcDir, 'src', 'nested', 'a.md'), 'deep __ARK_VERSION__');
    // 二进制占位文件（按扩展名跳过替换）
    writeFileSync(join(srcDir, 'logo.png'), `fake-binary-${PLACEHOLDER_ARK_VERSION}`);

    const files = copyTemplate(srcDir, destDir, { projectName: 'my-app', arkVersion: '9.9.9' });

    expect(files.sort()).toEqual(['README.md', 'logo.png', 'package.json', 'src/main.ts', 'src/nested/a.md'].sort());
    expect(readFileSync(join(destDir, 'package.json'), 'utf8')).toBe('{"name": "my-app", "dep": "9.9.9"}');
    expect(readFileSync(join(destDir, 'README.md'), 'utf8')).toBe('# my-app');
    expect(readFileSync(join(destDir, 'src', 'nested', 'a.md'), 'utf8')).toBe('deep 9.9.9');
    expect(readFileSync(join(destDir, 'logo.png'), 'utf8')).toContain(PLACEHOLDER_ARK_VERSION);
  });

  it('目标目录不存在时递归创建；重复拷贝不抛错', () => {
    const srcDir = makeTempDir();
    const destDir = join(makeTempDir(), 'a', 'b', 'c');
    writeFileSync(join(srcDir, 'x.txt'), 'x');

    expect(() => copyTemplate(srcDir, destDir, { projectName: 'p', arkVersion: '1.0.0' })).not.toThrow();
    expect(() => copyTemplate(srcDir, destDir, { projectName: 'p', arkVersion: '1.0.0' })).not.toThrow();
    expect(readdirSync(destDir)).toContain('x.txt');
  });

  it('模板目录不存在 → 抛出带路径的错误', () => {
    expect(() => copyTemplate(join(makeTempDir(), 'missing'), makeTempDir(), { projectName: 'p', arkVersion: '1.0.0' }))
      .toThrow(/模板目录不存在/);
  });
});

describe('getCliVersion', () => {
  it('返回 SemVer 版本号（与 cli package.json 绑定）', () => {
    expect(getCliVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
