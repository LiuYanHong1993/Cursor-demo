import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";
import { UPLOAD_DIR } from "@/lib/paths";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.upload")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const files = getDb()
    .prepare("SELECT * FROM uploaded_files ORDER BY id DESC")
    .all();
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.support.upload")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请选择文件" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "文件不能超过 5MB" }, { status: 400 });
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const safeBase = file.name.replace(/[^a-zA-Z0-9._\u4e00-\u9fa5-]/g, "_");
  const stored = `${Date.now()}-${safeBase}`;
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(UPLOAD_DIR, stored), buf);
  const info = getDb()
    .prepare(
      `INSERT INTO uploaded_files (original_name, stored_name, size, mime_type, uploaded_by)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(file.name, stored, file.size, file.type || "application/octet-stream", session.username || "unknown");
  writeAccessLog({
    username: session.username || "unknown",
    action: `上传文件 ${file.name}`,
    path: "/api/upload",
  });
  return NextResponse.json({ ok: true, id: info.lastInsertRowid, stored });
}
