import { getDb, OrgNode } from "./db";

export function listOrgs(): OrgNode[] {
  return getDb()
    .prepare("SELECT id, parent_id, name, type, code FROM orgs ORDER BY id")
    .all() as OrgNode[];
}

export type OrgTreeNode = OrgNode & { children: OrgTreeNode[] };

export function buildOrgTree(rows: OrgNode[]): OrgTreeNode[] {
  const map = new Map<number, OrgTreeNode>();
  const roots: OrgTreeNode[] = [];
  for (const row of rows) {
    map.set(row.id, { ...row, children: [] });
  }
  for (const row of rows) {
    const node = map.get(row.id)!;
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export const ORG_TYPE_LABEL: Record<OrgNode["type"], string> = {
  school: "学校",
  college: "学院",
  dept: "系",
  major: "专业",
  class: "班级",
};
