import { requireSession } from "@/lib/auth";
import { listCache } from "@/lib/cache-store";
import { CacheManager } from "./cache-manager";

export default async function Page() {
  await requireSession("admin.support.cache");
  return <CacheManager initial={listCache()} />;
}
