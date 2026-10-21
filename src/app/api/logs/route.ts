import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.logs")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const logs = q
    ? getDb()
        .prepare(
          `SELECT * FROM access_logs
           WHERE username LIKE ? OR action LIKE ? OR path LIKE ?
           ORDER BY id DESC LIMIT 500`
        )
        .all(`%${q}%`, `%${q}%`, `%${q}%`)
    : getDb().prepare("SELECT * FROM access_logs ORDER BY id DESC LIMIT 500").all();
  return NextResponse.json({ logs });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.logs")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(Number) : [];
  if (!ids.length) {
    return NextResponse.json({ error: "请选择要删除的日志" }, { status: 400 });
  }
  const placeholders = ids.map(() => "?").join(",");
  getDb().prepare(`DELETE FROM access_logs WHERE id IN (${placeholders})`).run(...ids);
  writeAccessLog({
    username: session.username || "unknown",
    action: `删除日志(${ids.length})`,
    path: "/api/logs",
  });
  return NextResponse.json({ ok: true });
}
