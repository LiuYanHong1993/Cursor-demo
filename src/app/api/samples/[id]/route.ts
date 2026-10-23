import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";
import { canTransition, ItemStatus } from "@/lib/state-machine";
import { formatZodError, sampleItemSchema } from "@/lib/validation";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const db = getDb();
  const current = db.prepare("SELECT * FROM sample_items WHERE id = ?").get(Number(id)) as
    | { status: ItemStatus }
    | undefined;
  if (!current) return NextResponse.json({ error: "不存在" }, { status: 404 });

  if (body.transitionTo) {
    if (!hasPermission(session, "admin.support.fsm") && !hasPermission(session, "admin.support.base")) {
      return NextResponse.json({ error: "无权访问" }, { status: 403 });
    }
    const to = body.transitionTo as ItemStatus;
    if (!canTransition(current.status, to)) {
      return NextResponse.json({ error: `不允许从 ${current.status} 转到 ${to}` }, { status: 400 });
    }
    db.prepare("UPDATE sample_items SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
      to,
      Number(id)
    );
    writeAccessLog({
      username: session.username || "unknown",
      action: `状态流转 ${current.status}->${to}`,
      path: `/api/samples/${id}`,
    });
    return NextResponse.json({ ok: true });
  }

  if (!hasPermission(session, "admin.support.base")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const parsed = sampleItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "校验失败", issues: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;
  db.prepare(
    `UPDATE sample_items SET title = ?, content = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(data.title, data.content, data.status, Number(id));
  writeAccessLog({ username: session.username || "unknown", action: "更新样例条目", path: `/api/samples/${id}` });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.base")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  getDb().prepare("DELETE FROM sample_items WHERE id = ?").run(Number(id));
  writeAccessLog({ username: session.username || "unknown", action: "删除样例条目", path: `/api/samples/${id}` });
  return NextResponse.json({ ok: true });
}
