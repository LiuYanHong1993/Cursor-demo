import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "fs";
import { DATA_DIR, DB_PATH, UPLOAD_DIR } from "./paths";

let db: Database.Database | null = null;

export type OrgNode = {
  id: number;
  parent_id: number | null;
  name: string;
  type: "school" | "college" | "dept" | "major" | "class";
  code: string;
};

export type UserRow = {
  id: number;
  username: string;
  display_name: string;
  email: string;
  password_hash: string;
  org_id: number | null;
  status: "active" | "disabled";
  created_at: string;
};

export type RoleRow = {
  id: number;
  name: string;
  code: string;
  description: string;
};

export type GroupRow = {
  id: number;
  name: string;
  description: string;
};

export type AccessLogRow = {
  id: number;
  username: string;
  action: string;
  path: string;
  ip: string;
  user_agent: string;
  created_at: string;
};

export type SampleItem = {
  id: number;
  title: string;
  status: "draft" | "review" | "published" | "archived";
  content: string;
  updated_at: string;
};

function ensureDirs() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function migrate(database: Database.Database) {
  database.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS orgs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER REFERENCES orgs(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      org_id INTEGER REFERENCES orgs(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      menu_path TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, permission_id)
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, group_id)
    );

    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      path TEXT NOT NULL,
      ip TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cache_entries (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sample_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS uploaded_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_name TEXT NOT NULL,
      stored_name TEXT NOT NULL,
      size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

function seed(database: Database.Database) {
  const count = database.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number };
  if (count.c > 0) return;

  const insertOrg = database.prepare(
    "INSERT INTO orgs (parent_id, name, type, code) VALUES (?, ?, ?, ?)"
  );

  const schoolId = Number(
    insertOrg.run(null, "星河大学", "school", "SCH-001").lastInsertRowid
  );
  const collegeId = Number(
    insertOrg.run(schoolId, "信息工程学院", "college", "COL-001").lastInsertRowid
  );
  const deptId = Number(
    insertOrg.run(collegeId, "计算机系", "dept", "DEPT-001").lastInsertRowid
  );
  const majorCs = Number(
    insertOrg.run(deptId, "软件工程", "major", "MAJ-SE").lastInsertRowid
  );
  const majorAi = Number(
    insertOrg.run(deptId, "人工智能", "major", "MAJ-AI").lastInsertRowid
  );
  insertOrg.run(majorCs, "软工 2024 级 1 班", "class", "CLS-SE-241");
  insertOrg.run(majorCs, "软工 2024 级 2 班", "class", "CLS-SE-242");
  insertOrg.run(majorAi, "人工智能 2024 级 1 班", "class", "CLS-AI-241");

  const perms = [
    ["admin.dashboard", "管理首页", "/admin"],
    ["admin.org", "组织管理", "/admin/org"],
    ["admin.users", "用户管理", "/admin/users"],
    ["admin.groups", "用户组管理", "/admin/groups"],
    ["admin.roles", "角色权限", "/admin/roles"],
    ["admin.logs", "访问日志", "/admin/logs"],
    ["admin.monitor.host", "主机监控", "/admin/monitoring/host"],
    ["admin.monitor.sql", "SQL 监控", "/admin/monitoring/sql"],
    ["admin.monitor.firewall", "SQL 防火墙", "/admin/monitoring/sql-firewall"],
    ["admin.monitor.web", "Web 应用监控", "/admin/monitoring/web"],
    ["admin.monitor.url", "URL 监控", "/admin/monitoring/url"],
    ["admin.support.cache", "缓存管理", "/admin/support/cache"],
    ["admin.support.fsm", "状态机样例", "/admin/support/state-machine"],
    ["admin.support.base", "列表编辑基类", "/admin/support/base-list"],
    ["admin.support.form", "表单校验", "/admin/support/form-validation"],
    ["admin.support.upload", "文件上传", "/admin/support/upload"],
  ] as const;

  const insertPerm = database.prepare(
    "INSERT INTO permissions (code, name, menu_path) VALUES (?, ?, ?)"
  );
  for (const [code, name, menu] of perms) {
    insertPerm.run(code, name, menu);
  }

  const insertRole = database.prepare(
    "INSERT INTO roles (name, code, description) VALUES (?, ?, ?)"
  );
  const adminRoleId = Number(
    insertRole.run("系统管理员", "admin", "全部后台权限").lastInsertRowid
  );
  const teacherRoleId = Number(
    insertRole.run("教师", "teacher", "查看监控与基础支撑示意").lastInsertRowid
  );
  const studentRoleId = Number(
    insertRole.run("学生", "student", "门户访问权限").lastInsertRowid
  );

  const allPermIds = database.prepare("SELECT id FROM permissions").all() as { id: number }[];
  const linkRolePerm = database.prepare(
    "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)"
  );
  for (const p of allPermIds) {
    linkRolePerm.run(adminRoleId, p.id);
  }

  const teacherPerms = database
    .prepare("SELECT id FROM permissions WHERE code LIKE 'admin.monitor%' OR code LIKE 'admin.support%' OR code = 'admin.dashboard'")
    .all() as { id: number }[];
  for (const p of teacherPerms) {
    linkRolePerm.run(teacherRoleId, p.id);
  }

  const hash = bcrypt.hashSync("admin123", 10);
  const insertUser = database.prepare(
    `INSERT INTO users (username, display_name, email, password_hash, org_id, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const adminId = Number(
    insertUser.run("admin", "平台管理员", "admin@usp.local", hash, collegeId, "active")
      .lastInsertRowid
  );
  const teacherId = Number(
    insertUser
      .run("teacher", "张老师", "teacher@usp.local", bcrypt.hashSync("teacher123", 10), deptId, "active")
      .lastInsertRowid
  );
  const studentId = Number(
    insertUser.run(
      "student01",
      "李同学",
      "student01@usp.local",
      bcrypt.hashSync("student123", 10),
      majorCs,
      "active"
    ).lastInsertRowid
  );

  const linkUserRole = database.prepare(
    "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)"
  );
  linkUserRole.run(adminId, adminRoleId);
  linkUserRole.run(teacherId, teacherRoleId);
  linkUserRole.run(studentId, studentRoleId);

  const insertGroup = database.prepare(
    "INSERT INTO groups (name, description) VALUES (?, ?)"
  );
  const g1 = Number(insertGroup.run("教务组", "教务与资源管理").lastInsertRowid);
  const g2 = Number(insertGroup.run("运维组", "监控与日志运维").lastInsertRowid);
  database.prepare("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)").run(adminId, g2);
  database.prepare("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)").run(teacherId, g1);

  const insertLog = database.prepare(
    `INSERT INTO access_logs (username, action, path, ip, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const samples = [
    ["admin", "登录", "/login", "10.0.0.8", "Chrome", "2026-10-20 08:01:00"],
    ["admin", "查看组织", "/admin/org", "10.0.0.8", "Chrome", "2026-10-20 08:05:12"],
    ["teacher", "登录", "/login", "10.0.0.22", "Edge", "2026-10-20 09:12:33"],
    ["teacher", "查看主机监控", "/admin/monitoring/host", "10.0.0.22", "Edge", "2026-10-20 09:15:01"],
    ["student01", "访问门户", "/", "10.0.1.9", "Safari", "2026-10-20 10:02:44"],
    ["admin", "导出用户", "/api/users/export", "10.0.0.8", "Chrome", "2026-10-20 11:20:00"],
    ["admin", "删除日志", "/admin/logs", "10.0.0.8", "Chrome", "2026-10-20 11:25:18"],
  ] as const;
  for (const row of samples) {
    insertLog.run(...row);
  }

  database
    .prepare("INSERT INTO cache_entries (key, value) VALUES (?, ?)")
    .run("portal:notices", JSON.stringify([{ id: 1, title: "开学通知" }]));
  database
    .prepare("INSERT INTO cache_entries (key, value) VALUES (?, ?)")
    .run("session:online_count", "128");

  const insertItem = database.prepare(
    "INSERT INTO sample_items (title, status, content) VALUES (?, ?, ?)"
  );
  insertItem.run("实验预约流程示意", "draft", "草稿内容：等待提交审核");
  insertItem.run("教学资源上架", "review", "审核中：待教务确认");
  insertItem.run("平台概况文案", "published", "已发布到门户概况页");
}

export function getDb() {
  if (db) return db;
  ensureDirs();
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  migrate(db);
  seed(db);
  return db;
}

export function writeAccessLog(input: {
  username: string;
  action: string;
  path: string;
  ip?: string;
  userAgent?: string;
}) {
  getDb()
    .prepare(
      `INSERT INTO access_logs (username, action, path, ip, user_agent)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(
      input.username,
      input.action,
      input.path,
      input.ip || "",
      input.userAgent || ""
    );
}
