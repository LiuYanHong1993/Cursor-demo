import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { RolesManager } from "./roles-manager";

export default async function RolesPage() {
  await requireSession("admin.roles");
  const db = getDb();
  const roles = db.prepare("SELECT * FROM roles ORDER BY id").all() as {
    id: number;
    name: string;
    code: string;
    description: string;
  }[];
  const permissions = db.prepare("SELECT * FROM permissions ORDER BY id").all() as {
    id: number;
    code: string;
    name: string;
    menu_path: string;
  }[];
  const links = db.prepare("SELECT role_id, permission_id FROM role_permissions").all() as {
    role_id: number;
    permission_id: number;
  }[];
  return <RolesManager roles={roles} permissions={permissions} links={links} />;
}
