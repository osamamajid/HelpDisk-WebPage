/** Tree helpers shared by the filter panel and the admin category editor. */
import type { CategoryRead } from '@/lib/api/types';

export interface FlatCategory {
  id: string;
  name: string;
  /** Depth from the root: 0 for a top-level group, 1 for its children. */
  depth: number;
  path: string;
  icon: string | null;
  hasChildren: boolean;
}

/**
 * Depth-first flattening that keeps parent labels available, so a list can show
 * "Software / Utilities" instead of an ambiguous child name. The seeded tree is
 * two levels deep but this walks any depth.
 */
export function flattenCategories(
  nodes: CategoryRead[],
  options: { excludeId?: string } = {},
): FlatCategory[] {
  const out: FlatCategory[] = [];

  const walk = (list: CategoryRead[], depth: number, prefix: string[]) => {
    for (const node of list) {
      if (node.id === options.excludeId) continue;
      const path = [...prefix, node.name];
      const children = node.children ?? [];
      out.push({
        id: node.id,
        name: node.name,
        depth,
        path: path.join(' / '),
        icon: node.icon ?? null,
        hasChildren: children.length > 0,
      });
      if (children.length > 0) {
        walk(children, depth + 1, path);
      }
    }
  };

  walk(nodes, 0, []);
  return out;
}

/** Ids of every descendant of `id`, used when a parent filter implies children. */
export function descendantIds(node: CategoryRead): string[] {
  return (node.children ?? []).flatMap((child) => [child.id, ...descendantIds(child)]);
}
