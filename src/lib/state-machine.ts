export type ItemStatus = "draft" | "review" | "published" | "archived";

export const STATUS_LABEL: Record<ItemStatus, string> = {
  draft: "草稿",
  review: "审核中",
  published: "已发布",
  archived: "已归档",
};

const transitions: Record<ItemStatus, ItemStatus[]> = {
  draft: ["review", "archived"],
  review: ["published", "draft"],
  published: ["archived"],
  archived: ["draft"],
};

export function canTransition(from: ItemStatus, to: ItemStatus) {
  return transitions[from]?.includes(to) ?? false;
}

export function nextStatuses(from: ItemStatus) {
  return transitions[from] || [];
}
