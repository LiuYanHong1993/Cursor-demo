"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input, PageHeader, Select } from "@/components/ui";
import type { OrgNode } from "@/lib/db";
import type { OrgTreeNode } from "@/lib/org";

function Tree({
  nodes,
  depth = 0,
  onSelect,
  selectedId,
}: {
  nodes: OrgTreeNode[];
  depth?: number;
  onSelect: (n: OrgTreeNode) => void;
  selectedId?: number;
}) {
  return (
    <ul className={depth ? "ml-4 border-l border-slate-200 pl-3" : "space-y-1"}>
      {nodes.map((n) => (
        <li key={n.id} className="py-0.5">
          <button
            type="button"
            onClick={() => onSelect(n)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
              selectedId === n.id ? "bg-teal-50 text-teal-900" : "hover:bg-slate-50"
            }`}
          >
            <span className="font-medium">{n.name}</span>
            <Badge>{n.code}</Badge>
          </button>
          {n.children?.length ? (
            <Tree nodes={n.children} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function OrgManager({
  initialTree,
  flat,
  typeLabels,
}: {
  initialTree: OrgTreeNode[];
  flat: OrgNode[];
  typeLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<OrgTreeNode | null>(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "class" as OrgNode["type"],
    parentId: "" as string | number,
  });
  const [msg, setMsg] = useState("");

  const parentOptions = useMemo(() => flat, [flat]);

  async function createOrg() {
    setMsg("");
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        code: form.code,
        type: form.type,
        parentId: form.parentId === "" ? null : Number(form.parentId),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error || "创建失败");
      return;
    }
    setForm({ name: "", code: "", type: "class", parentId: "" });
    router.refresh();
  }

  async function removeSelected() {
    if (!selected) return;
    if (!confirm(`确认删除「${selected.name}」及其子节点？`)) return;
    await fetch(`/api/orgs/${selected.id}`, { method: "DELETE" });
    setSelected(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="组织管理" desc="校/院 → 系 → 专业 → 班级树形结构，与用户 org_id 关联。" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">组织树</h2>
          <Tree
            nodes={initialTree}
            selectedId={selected?.id}
            onSelect={(n) => {
              setSelected(n);
              setForm({
                name: n.name,
                code: n.code,
                type: n.type,
                parentId: n.parent_id ?? "",
              });
            }}
          />
        </Card>
        <Card className="space-y-3">
          <h2 className="font-medium">{selected ? "编辑 / 新增子节点" : "新增组织节点"}</h2>
          {selected ? (
            <p className="text-sm text-slate-500">
              当前选中：{selected.name}（{typeLabels[selected.type]}）
            </p>
          ) : null}
          <Input placeholder="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input placeholder="编码" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as OrgNode["type"] })}>
            {Object.entries(typeLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select
            value={String(form.parentId)}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          >
            <option value="">无上级（根）</option>
            {parentOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.code})
              </option>
            ))}
          </Select>
          {msg ? <p className="text-sm text-rose-600">{msg}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={createOrg}>
              新增节点
            </Button>
            {selected ? (
              <Button type="button" variant="danger" onClick={removeSelected}>
                删除选中
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
