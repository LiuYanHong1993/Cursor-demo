import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";
import { formatZodError, sampleItemSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.base")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const items = getDb().prepare("SELECT * FROM sample_items ORDER BY id DESC").all();
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.base")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const parsed = sampleItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "校验失败", issues: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;
  const info = getDb()
    .prepare(
      `INSERT INTO sample_items (title, status, content, updated_at)
       VALUES (?, ?, ?, datetime('now'))`
    )
    .run(data.title, data.status, data.content);
  writeAccessLog({ username: session.username || "unknown", action: "创建样例条目", path: "/api/samples" });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
