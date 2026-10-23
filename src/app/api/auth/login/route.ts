import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) {
    return NextResponse.json({ ok: false, error: "请输入用户名和密码" }, { status: 400 });
  }
  const result = await login(username, password, {
    ip: req.headers.get("x-forwarded-for") || "127.0.0.1",
    ua: req.headers.get("user-agent") || "",
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
