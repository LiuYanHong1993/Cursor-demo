import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";
import { formatZodError, userFormSchema } from "@/lib/validation";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.users")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = userFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "校验失败", issues: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();
  db.prepare(
    `UPDATE users SET display_name = ?, email = ?, org_id = ?, status = ? WHERE id = ?`
  ).run(data.displayName, data.email, data.orgId ?? null, data.status, Number(id));
  if (data.password) {
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(
      bcrypt.hashSync(data.password, 10),
      Number(id)
    );
  }
  if (Array.isArray(body.roleIds)) {
    db.prepare("DELETE FROM user_roles WHERE user_id = ?").run(Number(id));
    const link = db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
    for (const rid of body.roleIds) {
      link.run(Number(id), Number(rid));
    }
  }
  writeAccessLog({ username: session.username || "unknown", action: "更新用户", path: `/api/users/${id}` });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.users")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (Number(id) === session.userId) {
    return NextResponse.json({ error: "不能删除当前登录用户" }, { status: 400 });
  }
  getDb().prepare("DELETE FROM users WHERE id = ?").run(Number(id));
  writeAccessLog({ username: session.username || "unknown", action: "删除用户", path: `/api/users/${id}` });
  return NextResponse.json({ ok: true });
}
