"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader, Table } from "@/components/ui";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Dist = { bucket: string; count: number };
type SqlRow = {
  id: number;
  sql: string;
  execCount: number;
  execTimeMs: number;
  slowestMs: number;
  txCount: number;
  errorCount: number;
  updateRows: number;
  readRows: number;
  running: number;
  maxConcurrency: number;
};
type SqlData = {
  rows: SqlRow[];
  distributions: {
    execTime: Dist[];
    execRsTime: Dist[];
    readRows: Dist[];
    updateRows: Dist[];
  };
};

export function SqlMonitor() {
  const [data, setData] = useState<SqlData | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/monitoring/sql");
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
      <PageHeader
        title="SQL 监控"
        desc="语句执行次数、耗时、慢查询、读写行数与分布（Mock APM）。"
      />
      {!data ? (
        <p className="text-sm text-slate-500">加载中…</p>
      ) : (
        <>
          <Table
            headers={[
              "SQL",
              "执行次数",
              "耗时ms",
              "最慢ms",
              "事务",
              "错误",
              "更新行",
              "读取行",
              "执行中",
              "最大并发",
            ]}
          >
            {data.rows.map((r) => (
              <tr key={r.id}>
                <td className="max-w-xs truncate px-3 py-2 font-mono text-xs" title={r.sql}>
                  {r.sql}
                </td>
                <td className="px-3 py-2">{r.execCount}</td>
                <td className="px-3 py-2">{r.execTimeMs}</td>
                <td className="px-3 py-2">{r.slowestMs}</td>
                <td className="px-3 py-2">{r.txCount}</td>
                <td className="px-3 py-2">{r.errorCount}</td>
                <td className="px-3 py-2">{r.updateRows}</td>
                <td className="px-3 py-2">{r.readRows}</td>
                <td className="px-3 py-2">{r.running}</td>
                <td className="px-3 py-2">{r.maxConcurrency}</td>
              </tr>
            ))}
          </Table>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {(
              [
                ["执行时间分布", data.distributions.execTime],
                ["执行+RS 时间分布", data.distributions.execRsTime],
                ["读取行分布", data.distributions.readRows],
                ["更新行分布", data.distributions.updateRows],
              ] as [string, Dist[]][]
            ).map(([title, series]) => (
              <Card key={title}>
                <h3 className="mb-2 text-sm font-medium">{title}</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={series}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} width={40} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0f766e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
