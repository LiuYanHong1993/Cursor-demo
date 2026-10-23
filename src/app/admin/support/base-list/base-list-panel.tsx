"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Card, Input, PageHeader, Select, Table, TextArea } from "@/components/ui";
import { STATUS_LABEL, ItemStatus } from "@/lib/state-machine";

export function BaseListPanel({
  items,
}: {
  items: { id: number; title: string; status: ItemStatus; content: string; updated_at: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", status: "draft" as ItemStatus });
  const [error, setError] = useState("");

  function startCreate() {
    setEditing(0);
    setForm({ title: "", content: "", status: "draft" });
    setError("");
  }

  function startEdit(item: (typeof items)[0]) {
    setEditing(item.id);
    setForm({ title: item.title, content: item.content, status: item.status });
    setError("");
  }

  async function save() {
    setError("");
    const url = editing ? `/api/samples/${editing}` : "/api/samples";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.issues?.[0]?.message || data.error || "保存失败");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("删除？")) return;
    await fetch(`/api/samples/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="列表 / 编辑基类页"
        desc="可复用的列表 + 编辑抽屉示意，业务页可继承同一交互骨架。"
        actions={
          <Button type="button" onClick={startCreate}>
            新建
          </Button>
        }
      />
      <Table headers={["标题", "状态", "更新时间", "操作"]}>
        {items.map((item) => (
          <tr key={item.id}>
            <td className="px-3 py-2">{item.title}</td>
            <td className="px-3 py-2">
              <Badge>{STATUS_LABEL[item.status]}</Badge>
            </td>
            <td className="px-3 py-2 text-xs">{item.updated_at}</td>
            <td className="space-x-2 px-3 py-2">
              <button className="text-teal-700 hover:underline" onClick={() => startEdit(item)}>
                编辑
              </button>
              <button className="text-rose-600 hover:underline" onClick={() => remove(item.id)}>
                删除
              </button>
            </td>
          </tr>
        ))}
      </Table>

      {editing !== null ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <Card className="h-full w-full max-w-md rounded-none border-0 shadow-2xl">
            <h2 className="text-lg font-medium">{editing ? "编辑条目" : "新建条目"}</h2>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <TextArea
                rows={5}
                placeholder="内容"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ItemStatus })}
              >
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <div className="flex gap-2">
                <Button type="button" onClick={save}>
                  保存
                </Button>
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  取消
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
