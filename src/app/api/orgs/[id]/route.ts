import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";
import { formatZodError, orgFormSchema } from "@/lib/validation";

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.org")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const parsed = orgFormSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "校验失败", issues: formatZodError(parsed.error) }, { status: 400 });
  }
  const data = parsed.data;
  getDb()
    .prepare("UPDATE orgs SET name = ?, type = ?, code = ?, parent_id = ? WHERE id = ?")
    .run(data.name, data.type, data.code, data.parentId ?? null, Number(id));
  writeAccessLog({ username: session.username || "unknown", action: "更新组织", path: `/api/orgs/${id}` });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.org")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const { id } = await ctx.params;
  getDb().prepare("DELETE FROM orgs WHERE id = ?").run(Number(id));
  writeAccessLog({ username: session.username || "unknown", action: "删除组织", path: `/api/orgs/${id}` });
  return NextResponse.json({ ok: true });
}
