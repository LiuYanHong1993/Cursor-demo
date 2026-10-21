import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { StateMachineDemo } from "./state-machine-demo";

export default async function Page() {
  await requireSession("admin.support.fsm");
  const items = getDb().prepare("SELECT * FROM sample_items ORDER BY id").all() as {
    id: number;
    title: string;
    status: "draft" | "review" | "published" | "archived";
    content: string;
    updated_at: string;
  }[];
  return <StateMachineDemo items={items} />;
}
