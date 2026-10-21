"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { LiveMetricChart } from "@/components/live-metric-chart";

type WebData = {
  currentExecuting: number;
  maxConcurrency: number;
  totalRequests: number;
  sessionCount: number;
  txCommit: number;
  txRollback: number;
  jdbcExec: number;
  jdbcTimeMs: number;
  readRows: number;
  updateRows: number;
  series: { t: string; value: number }[];
};

export function WebMonitor() {
  const [data, setData] = useState<WebData | null>(null);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const res = await fetch("/api/monitoring/web");
      if (res.ok && alive) setData(await res.json());
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const cards = data
    ? ([
        ["当前执行", data.currentExecuting],
        ["最大并发", data.maxConcurrency],
        ["请求总数", data.totalRequests],
        ["Session", data.sessionCount],
        ["事务提交", data.txCommit],
        ["事务回滚", data.txRollback],
        ["JDBC 执行", data.jdbcExec],
        ["JDBC 耗时ms", data.jdbcTimeMs],
        ["读取行", data.readRows],
        ["更新行", data.updateRows],
      ] as [string, number][])
    : [];

  return (
    <div>
      <PageHeader title="Web 应用监控" desc="请求并发、Session、事务与 JDBC 汇总（Mock）。" />
      {!data ? (
        <p className="text-sm text-slate-500">加载中…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map(([k, v]) => (
              <Card key={k}>
                <div className="text-xs text-slate-500">{k}</div>
                <div className="mt-1 text-xl font-semibold">{v}</div>
              </Card>
            ))}
          </div>
          <Card className="mt-4">
            <h3 className="mb-2 text-sm font-medium">请求吞吐示意</h3>
            <LiveMetricChart data={data.series} />
          </Card>
        </>
      )}
    </div>
  );
}
