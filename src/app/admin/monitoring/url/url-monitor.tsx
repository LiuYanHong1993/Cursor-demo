"use client";

import { useEffect, useState } from "react";
import { PageHeader, Table } from "@/components/ui";

type UrlData = {
  rows: {
    uri: string;
    requestCount: number;
    totalTimeMs: number;
    slowestMs: number;
    running: number;
    maxConcurrency: number;
    jdbcExec: number;
    jdbcError: number;
    jdbcTimeMs: number;
    txCommit: number;
    txRollback: number;
    readRows: number;
    updateRows: number;
  }[];
};

export function UrlMonitor() {
  const [data, setData] = useState<UrlData | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/monitoring/url");
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
      <PageHeader title="URL 监控" desc="按 URI 统计请求、耗时、JDBC 与事务（Mock）。" />
      {!data ? (
        <p className="text-sm text-slate-500">加载中…</p>
      ) : (
        <Table
          headers={[
            "URI",
            "请求数",
            "总耗时",
            "最慢",
            "执行中",
            "最大并发",
            "JDBC执行",
            "JDBC错误",
            "JDBC耗时",
            "提交",
            "回滚",
            "读行",
            "更新行",
          ]}
        >
          {data.rows.map((r) => (
            <tr key={r.uri}>
              <td className="px-3 py-2 font-mono text-xs">{r.uri}</td>
              <td className="px-3 py-2">{r.requestCount}</td>
              <td className="px-3 py-2">{r.totalTimeMs}</td>
              <td className="px-3 py-2">{r.slowestMs}</td>
              <td className="px-3 py-2">{r.running}</td>
              <td className="px-3 py-2">{r.maxConcurrency}</td>
              <td className="px-3 py-2">{r.jdbcExec}</td>
              <td className="px-3 py-2">{r.jdbcError}</td>
              <td className="px-3 py-2">{r.jdbcTimeMs}</td>
              <td className="px-3 py-2">{r.txCommit}</td>
              <td className="px-3 py-2">{r.txRollback}</td>
              <td className="px-3 py-2">{r.readRows}</td>
              <td className="px-3 py-2">{r.updateRows}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
