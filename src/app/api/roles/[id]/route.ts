import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.roles")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const db = getDb();
  db.prepare("UPDATE roles SET name = ?, description = ? WHERE id = ?").run(
    String(body.name || ""),
    String(body.description || ""),
    Number(id)
  );
  if (Array.isArray(body.permissionIds)) {
    db.prepare("DELETE FROM role_permissions WHERE role_id = ?").run(Number(id));
    const link = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
    for (const pid of body.permissionIds) {
      link.run(Number(id), Number(pid));
    }
  }
  writeAccessLog({ username: session.username || "unknown", action: "更新角色权限", path: `/api/roles/${id}` });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.roles")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const role = getDb().prepare("SELECT code FROM roles WHERE id = ?").get(Number(id)) as
    | { code: string }
    | undefined;
  if (role?.code === "admin") {
    return NextResponse.json({ error: "不能删除内置管理员角色" }, { status: 400 });
  }
  getDb().prepare("DELETE FROM roles WHERE id = ?").run(Number(id));
  writeAccessLog({ username: session.username || "unknown", action: "删除角色", path: `/api/roles/${id}` });
  return NextResponse.json({ ok: true });
}
