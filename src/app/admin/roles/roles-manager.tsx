"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, PageHeader, TextArea } from "@/components/ui";

export function RolesManager({
  roles,
  permissions,
  links,
}: {
  roles: { id: number; name: string; code: string; description: string }[];
  permissions: { id: number; code: string; name: string; menu_path: string }[];
  links: { role_id: number; permission_id: number }[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(roles[0]?.id);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const selectedPerms = useMemo(() => {
    return new Set(links.filter((l) => l.role_id === selectedId).map((l) => l.permission_id));
  }, [links, selectedId]);

  const [checked, setChecked] = useState<Set<number>>(selectedPerms);

  function selectRole(id: number) {
    setSelectedId(id);
    setChecked(new Set(links.filter((l) => l.role_id === id).map((l) => l.permission_id)));
  }

  async function savePerms() {
    const role = roles.find((r) => r.id === selectedId);
    if (!role) return;
    await fetch(`/api/roles/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: role.name,
        description: role.description,
        permissionIds: Array.from(checked),
      }),
    });
    router.refresh();
  }

  async function createRole() {
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, code, description, permissionIds: [] }),
    });
    setName("");
    setCode("");
    setDescription("");
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="角色与权限" desc="自定义角色，勾选菜单权限（RBAC）。" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 font-medium">角色列表</h2>
          <div className="space-y-1">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => selectRole(r.id)}
                className={`block w-full rounded-md px-2 py-2 text-left text-sm ${
                  selectedId === r.id ? "bg-teal-50 text-teal-900" : "hover:bg-slate-50"
                }`}
              >
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-slate-500">{r.code}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="text-sm font-medium">新建角色</div>
            <Input placeholder="名称" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="编码" value={code} onChange={(e) => setCode(e.target.value)} />
            <TextArea placeholder="描述" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
            <Button type="button" onClick={createRole}>
              创建角色
            </Button>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">菜单权限分配</h2>
            <Button type="button" onClick={savePerms}>
              保存权限
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissions.map((p) => (
              <label key={p.id} className="flex items-start gap-2 rounded-md border border-slate-100 px-2 py-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={checked.has(p.id)}
                  onChange={(e) => {
                    const next = new Set(checked);
                    if (e.target.checked) next.add(p.id);
                    else next.delete(p.id);
                    setChecked(next);
                  }}
                />
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {p.code} · {p.menu_path}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
