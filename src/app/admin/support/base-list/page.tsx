import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { BaseListDemo } from "./base-list-demo";

export default async function Page() {
  await requireSession("admin.support.base");
  const items = getDb().prepare("SELECT * FROM sample_items ORDER BY id DESC").all() as {
    id: number;
    title: string;
    status: "draft" | "review" | "published" | "archived";
    content: string;
    updated_at: string;
  }[];
  return <BaseListDemo items={items} />;
}
