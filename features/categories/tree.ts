/**
 * Pure transforms over the category tree (no framework/server imports) so they
 * are safe to run in Server Components and unit-testable in isolation.
 */

export interface CategoryLeaf {
  id: string;
  name: string;
}

export interface CategorySelectGroup {
  label: string;
  options: CategoryLeaf[];
}

export interface CategorySelectData {
  /** Top-level categories with no children — directly selectable. */
  ungrouped: CategoryLeaf[];
  /** Parent categories rendered as <optgroup>s of their child leaves. */
  groups: CategorySelectGroup[];
}

interface TreeNodeInput {
  id: string;
  name: string;
  children: { id: string; name: string }[];
}

/**
 * Split the two-level tree into the shape a grouped <select> needs. A category
 * is selectable only when it is a leaf: top-level-without-children become plain
 * options; a parent-with-children becomes a non-selectable group of its leaves.
 */
export function toCategorySelectData(tree: TreeNodeInput[]): CategorySelectData {
  const ungrouped: CategoryLeaf[] = [];
  const groups: CategorySelectGroup[] = [];

  for (const node of tree) {
    if (node.children.length === 0) {
      ungrouped.push({ id: node.id, name: node.name });
    } else {
      groups.push({
        label: node.name,
        options: node.children.map((c) => ({ id: c.id, name: c.name })),
      });
    }
  }

  return { ungrouped, groups };
}
