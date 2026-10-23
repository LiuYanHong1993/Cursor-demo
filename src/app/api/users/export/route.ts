import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.users")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const users = getDb()
    .prepare(
      `SELECT u.username, u.display_name, u.email, u.status, o.code AS org_code,
              GROUP_CONCAT(r.code, '|') AS role_codes
       FROM users u
       LEFT JOIN orgs o ON o.id = u.org_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.id`
    )
    .all() as {
    username: string;
    display_name: string;
    email: string;
    status: string;
    org_code: string | null;
    role_codes: string | null;
  }[];

  const header = "username,display_name,email,status,org_code,role_codes";
  const lines = users.map((u) =>
    [u.username, u.display_name, u.email, u.status, u.org_code || "", u.role_codes || ""]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = "\uFEFF" + [header, ...lines].join("\n");
  writeAccessLog({ username: session.username || "unknown", action: "导出用户CSV", path: "/api/users/export" });
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="users.csv"',
    },
  });
}
