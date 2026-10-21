"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Table } from "@/components/ui";

type FirewallData = {
  defense: Record<string, number>;
  tables: {
    name: string;
    Select: number;
    SelectInto: number;
    Insert: number;
    Update: number;
    Delete: number;
    Truncate: number;
    Create: number;
    Alter: number;
    Drop: number;
    Replace: number;
    deletedRows: number;
  }[];
  samples: { sql: string; exec: number; errors: number; readRows: number; updateRows: number }[];
};

export function FirewallMonitor() {
  const [data, setData] = useState<FirewallData | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/monitoring/sql-firewall");
      if (res.ok && alive) setData(await res.json());
    };
    load();
    const t = setInterval(load, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div>
      <PageHeader title="SQL 防火墙" desc="防御统计、表访问统计与违规样例（Mock，非真实引擎）。" />
      {!data ? (
        <p className="text-sm text-slate-500">加载中…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(data.defense).map(([k, v]) => (
              <Card key={k}>
                <div className="text-xs text-slate-500">{k}</div>
                <div className="mt-1 text-xl font-semibold">{v}</div>
              </Card>
            ))}
          </div>
          <h3 className="mb-2 mt-6 font-medium">表访问统计</h3>
          <Table
            headers={[
              "表名",
              "Select",
              "SelectInto",
              "Insert",
              "Update",
              "Delete",
              "Truncate",
              "Create",
              "Alter",
              "Drop",
              "Replace",
              "删除行数",
            ]}
          >
            {data.tables.map((t) => (
              <tr key={t.name}>
                <td className="px-3 py-2 font-medium">{t.name}</td>
                <td className="px-3 py-2">{t.Select}</td>
                <td className="px-3 py-2">{t.SelectInto}</td>
                <td className="px-3 py-2">{t.Insert}</td>
                <td className="px-3 py-2">{t.Update}</td>
                <td className="px-3 py-2">{t.Delete}</td>
                <td className="px-3 py-2">{t.Truncate}</td>
                <td className="px-3 py-2">{t.Create}</td>
                <td className="px-3 py-2">{t.Alter}</td>
                <td className="px-3 py-2">{t.Drop}</td>
                <td className="px-3 py-2">{t.Replace}</td>
                <td className="px-3 py-2">{t.deletedRows}</td>
              </tr>
            ))}
          </Table>
          <h3 className="mb-2 mt-6 font-medium">防御明细样例</h3>
          <Table headers={["SQL 样例", "执行次数", "错误", "读取行", "更新行"]}>
            {data.samples.map((s, i) => (
              <tr key={i}>
                <td className="max-w-md truncate px-3 py-2 font-mono text-xs">{s.sql}</td>
                <td className="px-3 py-2">{s.exec}</td>
                <td className="px-3 py-2">{s.errors}</td>
                <td className="px-3 py-2">{s.readRows}</td>
                <td className="px-3 py-2">{s.updateRows}</td>
              </tr>
            ))}
          </Table>
        </>
      )}
    </div>
  );
}
