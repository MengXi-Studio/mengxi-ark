import { afterEach, describe, expect, it, vi } from 'vitest';
import { download, exportCsv, getUrlParam } from '../index';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubBrowser() {
  const click = vi.fn();
  const anchor: Record<string, unknown> = { click };
  const createElement = vi.fn(() => anchor as unknown as HTMLAnchorElement);
  const appendChild = vi.fn();
  const removeChild = vi.fn();
  const createdBlobs: Blob[] = [];
  const createObjectURL = vi.fn((blob: Blob) => {
    createdBlobs.push(blob);
    return 'blob:mock';
  });
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('window', { location: { href: 'https://demo.mx.com/page?tab=1' } });
  vi.stubGlobal('document', { createElement, body: { appendChild, removeChild } });
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  return {
    anchor,
    click,
    createElement,
    appendChild,
    removeChild,
    createdBlobs,
    createObjectURL,
    revokeObjectURL,
  };
}

/** 继承真实 Blob 以通过 instanceof 判定，同时同步暴露文本内容供断言 */
class FakeBlob extends Blob {
  readonly csvText: string;
  constructor(parts: BlobPart[], options?: BlobPropertyBag) {
    super(parts, options);
    this.csvText = String(parts[0] ?? '');
  }
}

describe('download', () => {
  it('Node 环境（无 window / document）安全返回 false', () => {
    expect(typeof window === 'undefined').toBe(true);
    expect(download(new Blob(['x']), 'a.txt')).toBe(false);
  });

  it('浏览器环境：Blob 源走 createObjectURL 并触发点击后回收', () => {
    const stubs = stubBrowser();
    expect(download(new Blob(['hello']), '说明.txt')).toBe(true);
    expect(stubs.createElement).toHaveBeenCalledWith('a');
    expect(stubs.anchor.href).toBe('blob:mock');
    expect(stubs.anchor.download).toBe('说明.txt');
    expect(stubs.appendChild).toHaveBeenCalledTimes(1);
    expect(stubs.click).toHaveBeenCalledTimes(1);
    expect(stubs.removeChild).toHaveBeenCalledTimes(1);
    expect(stubs.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('浏览器环境：字符串源直接作为下载地址，不创建临时 URL', () => {
    const stubs = stubBrowser();
    expect(download('https://cdn.mx.com/pkg.zip', 'pkg.zip')).toBe(true);
    expect(stubs.anchor.href).toBe('https://cdn.mx.com/pkg.zip');
    expect(stubs.anchor.download).toBe('pkg.zip');
    expect(stubs.createObjectURL).not.toHaveBeenCalled();
    expect(stubs.revokeObjectURL).not.toHaveBeenCalled();
  });
});

describe('exportCsv', () => {
  it('Node 环境（无 window / document）安全返回 false', () => {
    expect(exportCsv([{ a: 1 }], 'a.csv')).toBe(false);
  });

  it('浏览器环境：生成带 BOM 的 CSV，逗号 / 引号 / 换行正确转义', () => {
    const stubs = stubBrowser();
    vi.stubGlobal('Blob', FakeBlob as unknown as typeof Blob);
    const result = exportCsv(
      [
        { name: '张,三', note: '说"你好"', age: 18 },
        { name: '李四', note: '多行\n备注', age: 20 },
      ],
      'users.csv',
    );
    expect(result).toBe(true);
    const blob = stubs.createdBlobs[0] as FakeBlob;
    expect(blob.csvText).toBe(
      '\uFEFFname,note,age\r\n"张,三","说""你好""",18\r\n李四,"多行\n备注",20',
    );
    expect(stubs.anchor.download).toBe('users.csv');
    expect(stubs.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('浏览器环境：headers 自定义表头文案，空行数据仅输出表头', () => {
    const stubs = stubBrowser();
    vi.stubGlobal('Blob', FakeBlob as unknown as typeof Blob);
    exportCsv([{ a: 1, b: 2 }], 'f.csv', { headers: ['甲', '乙'] });
    exportCsv([], 'empty.csv', { headers: ['甲', '乙'] });
    const first = stubs.createdBlobs[0] as FakeBlob;
    const second = stubs.createdBlobs[1] as FakeBlob;
    expect(first.csvText).toBe('\uFEFF甲,乙\r\n1,2');
    expect(second.csvText).toBe('\uFEFF甲,乙');
  });
});

describe('getUrlParam', () => {
  it('从传入 url 解析参数（自动解码）', () => {
    expect(getUrlParam('b', 'https://x.com/p?b=hello&c=2')).toBe('hello');
    expect(getUrlParam('c', 'https://x.com/p?b=hello&c=%E4%B8%AD%E6%96%87')).toBe('中文');
  });

  it('无该参数 / 无查询串 / 参数位于 hash 之前', () => {
    expect(getUrlParam('d', 'https://x.com/p?b=1')).toBe(null);
    expect(getUrlParam('b', 'https://x.com/p')).toBe(null);
    expect(getUrlParam('b', 'https://x.com/p?b=1#section')).toBe('1');
  });

  it('未传 url 时回退 window.location.href；Node 下返回 null', () => {
    vi.stubGlobal('window', { location: { href: 'https://demo.mx.com/page?tab=1' } });
    expect(getUrlParam('tab')).toBe('1');
    vi.unstubAllGlobals();
    expect(getUrlParam('tab')).toBe(null);
  });
});
