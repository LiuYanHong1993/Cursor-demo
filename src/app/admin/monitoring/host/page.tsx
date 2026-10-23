import { requireSession } from "@/lib/auth";
import { HostMonitor } from "./host-monitor";

export default async function HostMonitorPage() {
  await requireSession("admin.monitor.host");
  return <HostMonitor />;
}
