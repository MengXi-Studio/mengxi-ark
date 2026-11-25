import { describe, expect, it } from 'vitest';
import { filterTree, findTree, forEachTree, mapTree } from '../index';

interface TestNode {
  id: number;
  name: string;
  tag?: number;
  children?: TestNode[];
}

const tree: TestNode[] = [
  {
    id: 1,
    name: '系统管理',
    children: [
      { id: 11, name: '用户管理' },
      { id: 12, name: '菜单管理', children: [{ id: 121, name: '菜单详情' }] },
    ],
  },
  { id: 2, name: '工作台' },
];

describe('forEachTree', () => {
  it('按前序遍历所有节点并回传父节点', () => {
    const visited: Array<{ id: number; parentId: number | null }> = [];
    forEachTree(tree, (node, parent) => {
      visited.push({ id: node.id, parentId: parent?.id ?? null });
    });
    expect(visited).toEqual([
      { id: 1, parentId: null },
      { id: 11, parentId: 1 },
      { id: 12, parentId: 1 },
      { id: 121, parentId: 12 },
      { id: 2, parentId: null },
    ]);
  });

  it('支持自定义子节点字段名', () => {
    const custom = [{ id: 1, sub: [{ id: 2 }, { id: 3 }] }];
    const visited: number[] = [];
    forEachTree(custom, (node) => visited.push(node.id), { childrenField: 'sub' });
    expect(visited).toEqual([1, 2, 3]);
  });

  it('空树不执行回调', () => {
    const visited: number[] = [];
    forEachTree<TestNode>([], (node) => visited.push(node.id));
    expect(visited).toEqual([]);
  });
});

describe('mapTree', () => {
  it('返回新树且完全不改入参', () => {
    const snapshot = JSON.stringify(tree);
    const result = mapTree(tree, (node) => ({ ...node, tag: node.id * 10 }));
    expect(JSON.stringify(tree)).toBe(snapshot);
    expect(result[0].children?.[0]?.tag).toBe(110);
    expect(result[0].children?.[1]?.tag).toBe(120);
    expect(result[1].tag).toBe(20);
  });

  it('新树各层节点引用均与原树隔离，子树由返回值重建', () => {
    const result = mapTree(tree, (node) => ({ ...node }));
    expect(result[0]).not.toBe(tree[0]);
    expect(result[0].children).not.toBe(tree[0].children);
    expect(result[0].children?.[0]).not.toBe(tree[0].children?.[0]);
    expect(result[1].children).toBeUndefined();
    expect(JSON.stringify(result)).toBe(JSON.stringify(tree));
  });

  it('支持自定义子节点字段名', () => {
    const custom: Array<{ id: number; sub?: Array<{ id: number; level?: number }> }> = [
      { id: 1, sub: [{ id: 2 }] },
    ];
    const result = mapTree(custom, (node) => ({ ...node, level: node.id + 1 }), {
      childrenField: 'sub',
    });
    expect(result[0].level).toBe(2);
    expect(result[0].sub?.[0]?.level).toBe(3);
  });
});

describe('findTree', () => {
  it('返回首个命中节点', () => {
    expect(findTree(tree, (n) => n.id === 121)?.name).toBe('菜单详情');
    expect(findTree(tree, (n) => n.name === '工作台')?.id).toBe(2);
  });

  it('未命中返回 null', () => {
    expect(findTree(tree, (n) => n.id === 999)).toBe(null);
  });

  it('支持自定义子节点字段名', () => {
    const custom = [{ id: 1, sub: [{ id: 2 }] }];
    expect(findTree(custom, (n) => n.id === 2, { childrenField: 'sub' })?.id).toBe(2);
  });
});

describe('filterTree', () => {
  it('保留命中节点及其祖先链，剔除无关分支且不改入参', () => {
    const snapshot = JSON.stringify(tree);
    const result = filterTree(tree, (n) => n.name.includes('菜单'));
    expect(JSON.stringify(tree)).toBe(snapshot);
    // 「系统管理」未命中但存在命中后代 → 保留；「工作台」「用户管理」整体剔除
    expect(result.map((n) => n.id)).toEqual([1]);
    expect(result[0].children?.map((n) => n.id)).toEqual([12]);
    expect(result[0].children?.[0].children?.map((n) => n.id)).toEqual([121]);
  });

  it('全部未命中返回空数组', () => {
    expect(filterTree(tree, () => false)).toEqual([]);
  });

  it('支持自定义子节点字段名', () => {
    const custom = [{ id: 1, sub: [{ id: 2 }, { id: 3 }] }];
    const result = filterTree(custom, (n) => n.id === 3, { childrenField: 'sub' });
    expect(result.map((n) => n.id)).toEqual([1]);
    expect(result[0].sub.map((n) => n.id)).toEqual([3]);
  });
});
