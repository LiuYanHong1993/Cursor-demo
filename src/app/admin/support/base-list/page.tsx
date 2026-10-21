import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { BaseListPanel } from "./base-list-panel";

export default async function Page() {
  await requireSession("admin.support.base");
  const items = getDb().prepare("SELECT * FROM sample_items ORDER BY id DESC").all() as {
    id: number;
    title: string;
    status: "draft" | "review" | "published" | "archived";
    content: string;
    updated_at: string;
  }[];
  return <BaseListPanel items={items} />;
}
