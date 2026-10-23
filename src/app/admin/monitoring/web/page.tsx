import { requireSession } from "@/lib/auth";
import { WebMonitor } from "./web-monitor";

export default async function Page() {
  await requireSession("admin.monitor.web");
  return <WebMonitor />;
}
