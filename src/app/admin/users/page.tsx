import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listOrgs } from "@/lib/org";
import { UsersManager } from "./users-manager";

export default async function UsersPage() {
  await requireSession("admin.users");
  const db = getDb();
  const users = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.email, u.org_id, u.status, u.created_at,
              o.name AS org_name,
              GROUP_CONCAT(r.id) AS role_ids,
              GROUP_CONCAT(r.name, ',') AS roles
       FROM users u
       LEFT JOIN orgs o ON o.id = u.org_id
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       GROUP BY u.id
       ORDER BY u.id`
    )
    .all() as {
    id: number;
    username: string;
    display_name: string;
    email: string;
    org_id: number | null;
    status: string;
    created_at: string;
    org_name: string | null;
    role_ids: string | null;
    roles: string | null;
  }[];
  const roles = db.prepare("SELECT id, name, code FROM roles ORDER BY id").all() as {
    id: number;
    name: string;
    code: string;
  }[];
  const orgs = listOrgs();
  return <UsersManager initialUsers={users} roles={roles} orgs={orgs} />;
}
