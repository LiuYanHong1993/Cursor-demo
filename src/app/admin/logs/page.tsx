import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { LogsManager } from "./logs-manager";

export default async function LogsPage() {
  await requireSession("admin.logs");
  const logs = getDb().prepare("SELECT * FROM access_logs ORDER BY id DESC LIMIT 500").all() as {
    id: number;
    username: string;
    action: string;
    path: string;
    ip: string;
    user_agent: string;
    created_at: string;
  }[];
  return <LogsManager initialLogs={logs} />;
}
