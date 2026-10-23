import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.groups")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const db = getDb();
  db.prepare("UPDATE groups SET name = ?, description = ? WHERE id = ?").run(
    String(body.name || ""),
    String(body.description || ""),
    Number(id)
  );
  if (Array.isArray(body.userIds)) {
    db.prepare("DELETE FROM user_groups WHERE group_id = ?").run(Number(id));
    const link = db.prepare("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)");
    for (const uid of body.userIds) {
      link.run(Number(uid), Number(id));
    }
  }
  writeAccessLog({ username: session.username || "unknown", action: "更新用户组", path: `/api/groups/${id}` });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.groups")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  getDb().prepare("DELETE FROM groups WHERE id = ?").run(Number(id));
  writeAccessLog({ username: session.username || "unknown", action: "删除用户组", path: `/api/groups/${id}` });
  return NextResponse.json({ ok: true });
}
