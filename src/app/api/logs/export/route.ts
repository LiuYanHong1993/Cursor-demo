import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.logs")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const logs = getDb()
    .prepare("SELECT id, username, action, path, ip, user_agent, created_at FROM access_logs ORDER BY id DESC")
    .all() as Record<string, string | number>[];
  const header = "id,username,action,path,ip,user_agent,created_at";
  const lines = logs.map((l) =>
    [l.id, l.username, l.action, l.path, l.ip, l.user_agent, l.created_at]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  writeAccessLog({ username: session.username || "unknown", action: "导出访问日志", path: "/api/logs/export" });
  return new NextResponse("\uFEFF" + [header, ...lines].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="access-logs.csv"',
    },
  });
}
