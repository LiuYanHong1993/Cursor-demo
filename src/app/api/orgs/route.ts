import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";
import { buildOrgTree, listOrgs } from "@/lib/org";
import { formatZodError, orgFormSchema } from "@/lib/validation";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const rows = listOrgs();
  return NextResponse.json({ orgs: rows, tree: buildOrgTree(rows) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.org")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const parsed = orgFormSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "校验失败", issues: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;
  try {
    const info = getDb()
      .prepare("INSERT INTO orgs (parent_id, name, type, code) VALUES (?, ?, ?, ?)")
      .run(data.parentId ?? null, data.name, data.type, data.code);
    writeAccessLog({ username: session.username || "unknown", action: "新增组织", path: "/api/orgs" });
    return NextResponse.json({ ok: true, id: info.lastInsertRowid });
  } catch (e) {
    return NextResponse.json({ error: "创建失败", detail: String(e) }, { status: 400 });
  }
}
