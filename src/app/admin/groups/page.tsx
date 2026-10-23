import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { GroupsManager } from "./groups-manager";

export default async function GroupsPage() {
  await requireSession("admin.groups");
  const db = getDb();
  const groups = db
    .prepare(
      `SELECT g.*, GROUP_CONCAT(u.id) AS user_ids, GROUP_CONCAT(u.username, ',') AS members
       FROM groups g
       LEFT JOIN user_groups ug ON ug.group_id = g.id
       LEFT JOIN users u ON u.id = ug.user_id
       GROUP BY g.id
       ORDER BY g.id`
    )
    .all() as {
    id: number;
    name: string;
    description: string;
    user_ids: string | null;
    members: string | null;
  }[];
  const users = db.prepare("SELECT id, username, display_name FROM users ORDER BY id").all() as {
    id: number;
    username: string;
    display_name: string;
  }[];
  return <GroupsManager initialGroups={groups} users={users} />;
}
