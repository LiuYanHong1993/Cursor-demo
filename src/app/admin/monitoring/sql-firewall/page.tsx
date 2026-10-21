import { requireSession } from "@/lib/auth";
import { FirewallMonitor } from "./firewall-monitor";

export default async function Page() {
  await requireSession("admin.monitor.firewall");
  return <FirewallMonitor />;
}
