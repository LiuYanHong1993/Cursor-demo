"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select, Table } from "@/components/ui";

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  org_id: number | null;
  status: string;
  created_at: string;
  org_name: string | null;
  role_ids: string | null;
  roles: string | null;
};

export function UsersManager({
  initialUsers,
  roles,
  orgs,
}: {
  initialUsers: UserRow[];
  roles: { id: number; name: string; code: string }[];
  orgs: { id: number; name: string; code: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    orgId: "",
    status: "active",
    roleIds: [] as number[],
  });
  const [msg, setMsg] = useState("");

  async function createUser() {
    setMsg("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        orgId: form.orgId ? Number(form.orgId) : null,
        roleIds: form.roleIds,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.issues?.[0]?.message || data.error || "创建失败");
      return;
    }
    setForm({ username: "", displayName: "", email: "", password: "", orgId: "", status: "active", roleIds: [] });
    router.refresh();
  }

  async function removeUser(id: number) {
    if (!confirm("确认删除该用户？")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function importCsv(file: File) {
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/users/import", { method: "POST", body: fd });
    const data = await res.json();
    setMsg(res.ok ? `导入完成：新增 ${data.created}，更新 ${data.updated}` : data.error || "导入失败");
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="用户管理"
        desc="支持增删改、角色绑定，以及 CSV 批量导入导出。"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = "/api/users/export";
              }}
            >
              导出 CSV
            </Button>
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              导入 CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCsv(f);
              }}
            />
          </>
        }
      />
      {msg ? <p className="mb-3 text-sm text-teal-800">{msg}</p> : null}
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="space-y-3 xl:col-span-1">
          <h2 className="font-medium">新建用户</h2>
          <Input placeholder="用户名" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <Input placeholder="显示名" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
          <Input placeholder="邮箱" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="密码" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Select value={form.orgId} onChange={(e) => setForm({ ...form, orgId: e.target.value })}>
            <option value="">未分配组织</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">启用</option>
            <option value="disabled">停用</option>
          </Select>
          <div className="space-y-1">
            <div className="text-xs text-slate-500">角色</div>
            {roles.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.roleIds.includes(r.id)}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      roleIds: e.target.checked
                        ? [...form.roleIds, r.id]
                        : form.roleIds.filter((id) => id !== r.id),
                    });
                  }}
                />
                {r.name}
              </label>
            ))}
          </div>
          <Button type="button" onClick={createUser}>
            创建
          </Button>
        </Card>
        <div className="xl:col-span-2">
          <Table headers={["用户名", "显示名", "组织", "角色", "状态", "操作"]}>
            {initialUsers.map((u) => (
              <tr key={u.id} className="text-slate-700">
                <td className="px-3 py-2">{u.username}</td>
                <td className="px-3 py-2">{u.display_name}</td>
                <td className="px-3 py-2">{u.org_name || "-"}</td>
                <td className="px-3 py-2">{u.roles || "-"}</td>
                <td className="px-3 py-2">
                  <Badge tone={u.status === "active" ? "emerald" : "rose"}>{u.status}</Badge>
                </td>
                <td className="px-3 py-2">
                  <button className="text-rose-600 hover:underline" onClick={() => removeUser(u.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </div>
  );
}
