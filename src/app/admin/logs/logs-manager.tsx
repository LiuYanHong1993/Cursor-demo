"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Input, PageHeader, Table } from "@/components/ui";

type Log = {
  id: number;
  username: string;
  action: string;
  path: string;
  ip: string;
  user_agent: string;
  created_at: string;
};

export function LogsManager({ initialLogs }: { initialLogs: Log[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return initialLogs;
    return initialLogs.filter(
      (l) =>
        l.username.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        l.path.toLowerCase().includes(s)
    );
  }, [initialLogs, q]);

  async function removeSelected() {
    if (!selected.length) return;
    if (!confirm(`删除选中的 ${selected.length} 条日志？`)) return;
    await fetch("/api/logs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    setSelected([]);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="访问日志"
        desc="查询、导出、删除平台访问日志。"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = "/api/logs/export";
              }}
            >
              导出 CSV
            </Button>
            <Button type="button" variant="danger" onClick={removeSelected} disabled={!selected.length}>
              删除选中
            </Button>
          </>
        }
      />
      <div className="mb-3 max-w-md">
        <Input placeholder="按用户/动作/路径筛选" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Table headers={["", "时间", "用户", "动作", "路径", "IP", "UA"]}>
        {filtered.map((l) => (
          <tr key={l.id}>
            <td className="px-3 py-2">
              <input
                type="checkbox"
                checked={selected.includes(l.id)}
                onChange={(e) =>
                  setSelected(e.target.checked ? [...selected, l.id] : selected.filter((x) => x !== l.id))
                }
              />
            </td>
            <td className="whitespace-nowrap px-3 py-2 text-xs">{l.created_at}</td>
            <td className="px-3 py-2">{l.username}</td>
            <td className="px-3 py-2">{l.action}</td>
            <td className="px-3 py-2 font-mono text-xs">{l.path}</td>
            <td className="px-3 py-2 text-xs">{l.ip}</td>
            <td className="max-w-[160px] truncate px-3 py-2 text-xs">{l.user_agent}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
