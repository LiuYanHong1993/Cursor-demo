import { requireSession } from "@/lib/auth";
import { UrlMonitor } from "./url-monitor";

export default async function Page() {
  await requireSession("admin.monitor.url");
  return <UrlMonitor />;
}
