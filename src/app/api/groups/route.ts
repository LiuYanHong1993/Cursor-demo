import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.groups")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const groups = getDb()
    .prepare(
      `SELECT g.*, GROUP_CONCAT(u.username, ',') AS members
       FROM groups g
       LEFT JOIN user_groups ug ON ug.group_id = g.id
       LEFT JOIN users u ON u.id = ug.user_id
       GROUP BY g.id
       ORDER BY g.id`
    )
    .all();
  const users = getDb().prepare("SELECT id, username, display_name FROM users ORDER BY id").all();
  return NextResponse.json({ groups, users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.groups")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "名称必填" }, { status: 400 });
  const db = getDb();
  const info = db
    .prepare("INSERT INTO groups (name, description) VALUES (?, ?)")
    .run(name, String(body.description || ""));
  if (Array.isArray(body.userIds)) {
    const link = db.prepare("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)");
    for (const uid of body.userIds) {
      link.run(Number(uid), info.lastInsertRowid);
    }
  }
  writeAccessLog({ username: session.username || "unknown", action: "创建用户组", path: "/api/groups" });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid });
}
