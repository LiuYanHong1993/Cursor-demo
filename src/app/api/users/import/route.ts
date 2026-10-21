import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, hasPermission } from "@/lib/auth";
import { getDb, writeAccessLog } from "@/lib/db";

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  return lines.slice(1).map((line) => {
    const cols = line.match(/("([^"]|"")*"|[^,]*)/g) || [];
    const values = cols.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !hasPermission(session, "admin.users")) {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传 CSV 文件" }, { status: 400 });
  }
  const text = await file.text();
  const rows = parseCsv(text);
  const db = getDb();
  let created = 0;
  let updated = 0;
  const defaultHash = bcrypt.hashSync("ChangeMe123", 10);

  const tx = db.transaction(() => {
    for (const row of rows) {
      const username = row.username?.trim();
      if (!username) continue;
      const org = row.org_code
        ? (db.prepare("SELECT id FROM orgs WHERE code = ?").get(row.org_code) as { id: number } | undefined)
        : undefined;
      const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username) as
        | { id: number }
        | undefined;
      if (existing) {
        db.prepare(
          `UPDATE users SET display_name = ?, email = ?, status = ?, org_id = ? WHERE id = ?`
        ).run(
          row.display_name || username,
          row.email || `${username}@demo.edu`,
          row.status || "active",
          org?.id ?? null,
          existing.id
        );
        updated += 1;
      } else {
        const info = db
          .prepare(
            `INSERT INTO users (username, display_name, email, password_hash, org_id, status)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(
            username,
            row.display_name || username,
            row.email || `${username}@demo.edu`,
            defaultHash,
            org?.id ?? null,
            row.status || "active"
          );
        if (row.role_codes) {
          for (const code of row.role_codes.split("|").filter(Boolean)) {
            const role = db.prepare("SELECT id FROM roles WHERE code = ?").get(code) as
              | { id: number }
              | undefined;
            if (role) {
              db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)").run(
                info.lastInsertRowid,
                role.id
              );
            }
          }
        }
        created += 1;
      }
    }
  });
  tx();
  writeAccessLog({
    username: session.username || "unknown",
    action: `导入用户CSV(+${created}/~${updated})`,
    path: "/api/users/import",
  });
  return NextResponse.json({ ok: true, created, updated });
}
