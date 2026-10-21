import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";
import { formatZodError, userFormSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.users")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const users = getDb()
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.email, u.org_id, u.status, u.created_at,
              o.name AS org_name,
              GROUP_CONCAT(r.name, ',') AS roles
       FROM users u
       LEFT JOIN orgs o ON o.id = u.org_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.id`
    )
    .all();
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.users")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const body = await req.json();
  const parsed = userFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "校验失败", issues: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;
  if (!data.password) {
    return NextResponse.json({ error: "新建用户必须设置密码" }, { status: 400 });
  }
  try {
    const info = getDb()
      .prepare(
        `INSERT INTO users (username, display_name, email, password_hash, org_id, status)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.username,
        data.displayName,
        data.email,
        bcrypt.hashSync(data.password, 10),
        data.orgId ?? null,
        data.status
      );
    if (Array.isArray(body.roleIds)) {
      const link = getDb().prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
      for (const rid of body.roleIds) {
        link.run(info.lastInsertRowid, Number(rid));
      }
    }
    writeAccessLog({
      username: session.username || "unknown",
      action: "创建用户",
      path: "/api/users",
    });
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch (e) {
    return NextResponse.json({ error: "创建失败，用户名可能已存在", detail: String(e) }, { status: 400 });
  }
}
