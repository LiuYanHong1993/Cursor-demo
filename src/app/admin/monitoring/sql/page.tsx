import { requireSession } from "@/lib/auth";
import { SqlMonitor } from "./sql-monitor";

export default async function Page() {
  await requireSession("admin.monitor.sql");
  return <SqlMonitor />;
}
