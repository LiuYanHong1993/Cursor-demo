import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.roles")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const db = getDb();
  const roles = db.prepare("SELECT * FROM roles ORDER BY id").all();
  const permissions = db.prepare("SELECT * FROM permissions ORDER BY id").all();
  const links = db.prepare("SELECT role_id, permission_id FROM role_permissions").all() as {
    role_id: number;
    permission_id: number;
  }[];
  return NextResponse.json({ roles, permissions, links });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.roles")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const body = await req.json();
  const name = String(body.name || "").trim();
  const code = String(body.code || "").trim();
  const description = String(body.description || "");
  if (!name || !code) {
    return NextResponse.json({ error: "名称与编码必填" }, { status: 400 });
  }
  const db = getDb();
  const info = db
    .prepare("INSERT INTO roles (name, code, description) VALUES (?, ?, ?)")
    .run(name, code, description);
  if (Array.isArray(body.permissionIds)) {
    const link = db.prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
    for (const pid of body.permissionIds) {
      link.run(info.lastInsertRowid, Number(pid));
    }
  }
  writeAccessLog({ username: session.username || "unknown", action: "创建角色", path: "/api/roles" });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
