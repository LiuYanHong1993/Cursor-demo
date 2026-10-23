import { NextRequest, NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { clearCache, deleteCache, listCache, setCache } from "@/lib/cache-store";
import { writeAccessLog } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.cache")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  return NextResponse.json({ entries: listCache() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.cache")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const body = await req.json();
  const key = String(body.key || "").trim();
  const value = String(body.value ?? "");
  if (!key) return NextResponse.json({ error: "key 必填" }, { status: 400 });
  setCache(key, value);
  writeAccessLog({ username: session.username || "unknown", action: "写入缓存", path: "/api/cache" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.cache")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.all) {
    clearCache();
    writeAccessLog({ username: session.username || "unknown", action: "清空缓存", path: "/api/cache" });
    return NextResponse.json({ ok: true });
  }
  const key = String(body.key || "");
  deleteCache(key);
  writeAccessLog({ username: session.username || "unknown", action: "删除缓存", path: "/api/cache" });
  return NextResponse.json({ ok: true });
}
