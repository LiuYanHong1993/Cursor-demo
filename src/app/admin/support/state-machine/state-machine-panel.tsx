"use client";

import { useRouter } from "next/navigation";
import { Badge, Button, Card, PageHeader } from "@/components/ui";
import { ItemStatus, nextStatuses, STATUS_LABEL } from "@/lib/state-machine";

const tone: Record<ItemStatus, "slate" | "amber" | "emerald" | "rose"> = {
  draft: "slate",
  review: "amber",
  published: "emerald",
  archived: "rose",
};

export function StateMachinePanel({
  items,
}: {
  items: { id: number; title: string; status: ItemStatus; content: string; updated_at: string }[];
}) {
  const router = useRouter();

  async function transition(id: number, to: ItemStatus) {
    await fetch(`/api/samples/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transitionTo: to }),
    });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="状态机样例"
        desc="草稿 → 审核中 → 已发布 → 已归档，非法流转由后端拒绝。"
      />
      <Card className="mb-4 text-sm text-slate-600">
        流转规则：draft→review/archived；review→published/draft；published→archived；archived→draft。
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium">{item.title}</h3>
              <Badge tone={tone[item.status]}>{STATUS_LABEL[item.status]}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{item.content}</p>
            <p className="mt-2 text-xs text-slate-400">更新于 {item.updated_at}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {nextStatuses(item.status).map((s) => (
                <Button key={s} type="button" variant="secondary" onClick={() => transition(item.id, s)}>
                  → {STATUS_LABEL[s]}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
