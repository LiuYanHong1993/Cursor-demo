import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import {
  getHostMetrics,
  getSqlFirewallMetrics,
  getSqlMetrics,
  getUrlMetrics,
  getWebAppMetrics,
} from "@/lib/mock-metrics";

const permMap: Record<string, string> = {
  host: "admin.monitor.host",
  sql: "admin.monitor.sql",
  "sql-firewall": "admin.monitor.firewall",
  web: "admin.monitor.web",
  url: "admin.monitor.url",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const session = await getSession();
  const { kind } = await ctx.params;
  const perm = permMap[kind];
  if (!session.isLoggedIn || !perm || !hasPermission(session, perm)) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  switch (kind) {
    case "host":
      return NextResponse.json(getHostMetrics());
    case "sql":
      return NextResponse.json(getSqlMetrics());
    case "sql-firewall":
      return NextResponse.json(getSqlFirewallMetrics());
    case "web":
      return NextResponse.json(getWebAppMetrics());
    case "url":
      return NextResponse.json(getUrlMetrics());
    default:
      return NextResponse.json({ error: "未知监控类型" }, { status: 404 });
  }
}
