"use client";

import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { LiveMetricChart } from "@/components/live-metric-chart";

type HostData = {
  refreshedAt: string;
  cpu: { usage: number; cores: number; series: { t: string; value: number }[] };
  memory: { usedGb: number; totalGb: number; usage: number; series: { t: string; value: number }[] };
  disk: { usedGb: number; totalGb: number; freeGb: number; series: { t: string; value: number }[] };
};

export function HostMonitor() {
  const [data, setData] = useState<HostData | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const res = await fetch("/api/monitoring/host");
      if (!res.ok) return;
      const json = await res.json();
      if (alive) setData(json);
    }
    load();
    const t = setInterval(load, 3000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div>
      <PageHeader title="主机监控" desc="CPU / 内存 / 磁盘示意指标，每 3 秒刷新（Mock）。" />
      {!data ? (
        <p className="text-sm text-slate-500">加载中…</p>
      ) : (
        <>
          <p className="mb-4 text-xs text-slate-500">刷新时间：{new Date(data.refreshedAt).toLocaleString("zh-CN")}</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <div className="text-sm text-slate-500">CPU 使用率</div>
              <div className="mt-1 text-3xl font-semibold">{data.cpu.usage}%</div>
              <div className="text-xs text-slate-400">{data.cpu.cores} 核</div>
              <div className="mt-3">
                <LiveMetricChart data={data.cpu.series} />
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">内存使用量</div>
              <div className="mt-1 text-3xl font-semibold">
                {data.memory.usedGb} / {data.memory.totalGb} GB
              </div>
              <div className="text-xs text-slate-400">占用 {data.memory.usage}%</div>
              <div className="mt-3">
                <LiveMetricChart data={data.memory.series} color="#0369a1" />
              </div>
            </Card>
            <Card>
              <div className="text-sm text-slate-500">磁盘余量</div>
              <div className="mt-1 text-3xl font-semibold">{data.disk.freeGb} GB</div>
              <div className="text-xs text-slate-400">
                已用 {data.disk.usedGb} / {data.disk.totalGb} GB
              </div>
              <div className="mt-3">
                <LiveMetricChart data={data.disk.series} color="#b45309" />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
