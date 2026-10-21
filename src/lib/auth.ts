import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getDb, writeAccessLog } from "./db";

export type SessionData = {
  userId?: number;
  username?: string;
  displayName?: string;
  permissions?: string[];
  isLoggedIn?: boolean;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "usp-demo-session-secret-change-me-32chars!!",
  cookieName: "usp_demo_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE === "true",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireSession(permission?: string) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    redirect("/login");
  }
  if (permission && !hasPermission(session, permission)) {
    redirect("/admin?denied=1");
  }
  return session;
}

export function getUserPermissions(userId: number): string[] {
  const rows = getDb()
    .prepare(
      `SELECT DISTINCT p.code AS code
       FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = ?`
    )
    .all(userId) as { code: string }[];
  return rows.map((r) => r.code);
}

export async function login(username: string, password: string, meta?: { ip?: string; ua?: string }) {
  const user = getDb()
    .prepare("SELECT * FROM users WHERE username = ? AND status = 'active'")
    .get(username) as
    | {
        id: number;
        username: string;
        display_name: string;
        password_hash: string;
      }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return { ok: false as const, error: "用户名或密码错误" };
  }

  const permissions = getUserPermissions(user.id);
  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.displayName = user.display_name;
  session.permissions = permissions;
  session.isLoggedIn = true;
  await session.save();

  writeAccessLog({
    username: user.username,
    action: "登录",
    path: "/login",
    ip: meta?.ip,
    userAgent: meta?.ua,
  });

  return { ok: true as const };
}

export async function logout() {
  const session = await getSession();
  const username = session.username || "anonymous";
  session.destroy();
  writeAccessLog({ username, action: "退出登录", path: "/logout" });
}

export function hasPermission(session: SessionData, code: string) {
  return (session.permissions || []).includes(code);
}
