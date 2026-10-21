"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, PageHeader, Table, TextArea } from "@/components/ui";

export function CacheManager({
  initial,
}: {
  initial: { key: string; value: string; updated_at: string }[];
}) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  async function save() {
    await fetch("/api/cache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setKey("");
    setValue("");
    router.refresh();
  }

  async function remove(k: string) {
    await fetch("/api/cache", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: k }),
    });
    router.refresh();
  }

  async function clearAll() {
    if (!confirm("清空全部缓存？")) return;
    await fetch("/api/cache", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="缓存管理"
        desc="平台 KV 缓存（SQLite 持久化），可扩展为 Redis。"
        actions={
          <Button type="button" variant="danger" onClick={clearAll}>
            清空全部
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3">
          <h2 className="font-medium">写入缓存</h2>
          <Input placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} />
          <TextArea placeholder="value" rows={4} value={value} onChange={(e) => setValue(e.target.value)} />
          <Button type="button" onClick={save}>
            保存
          </Button>
        </Card>
        <div className="lg:col-span-2">
          <Table headers={["Key", "Value", "更新时间", "操作"]}>
            {initial.map((e) => (
              <tr key={e.key}>
                <td className="px-3 py-2 font-mono text-xs">{e.key}</td>
                <td className="max-w-sm truncate px-3 py-2 text-xs">{e.value}</td>
                <td className="px-3 py-2 text-xs">{e.updated_at}</td>
                <td className="px-3 py-2">
                  <button className="text-rose-600 hover:underline" onClick={() => remove(e.key)}>
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
