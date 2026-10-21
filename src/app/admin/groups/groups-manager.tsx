"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input, PageHeader, Table, TextArea } from "@/components/ui";

export function GroupsManager({
  initialGroups,
  users,
}: {
  initialGroups: {
    id: number;
    name: string;
    description: string;
    user_ids: string | null;
    members: string | null;
  }[];
  users: { id: number; username: string; display_name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [userIds, setUserIds] = useState<number[]>([]);

  async function createGroup() {
    await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, userIds }),
    });
    setName("");
    setDescription("");
    setUserIds([]);
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("删除该用户组？")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <PageHeader title="用户组管理" desc="将用户归入业务组，便于批量授权与通知。" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3">
          <h2 className="font-medium">新建用户组</h2>
          <Input placeholder="名称" value={name} onChange={(e) => setName(e.target.value)} />
          <TextArea placeholder="描述" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={userIds.includes(u.id)}
                  onChange={(e) =>
                    setUserIds(e.target.checked ? [...userIds, u.id] : userIds.filter((x) => x !== u.id))
                  }
                />
                {u.display_name} ({u.username})
              </label>
            ))}
          </div>
          <Button type="button" onClick={createGroup}>
            创建
          </Button>
        </Card>
        <div className="lg:col-span-2">
          <Table headers={["名称", "描述", "成员", "操作"]}>
            {initialGroups.map((g) => (
              <tr key={g.id}>
                <td className="px-3 py-2">{g.name}</td>
                <td className="px-3 py-2">{g.description}</td>
                <td className="px-3 py-2">{g.members || "-"}</td>
                <td className="px-3 py-2">
                  <button className="text-rose-600 hover:underline" onClick={() => remove(g.id)}>
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
