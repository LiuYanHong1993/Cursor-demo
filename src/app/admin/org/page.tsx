import { requireSession } from "@/lib/auth";
import { buildOrgTree, listOrgs, ORG_TYPE_LABEL } from "@/lib/org";
import { OrgManager } from "./org-manager";

export default async function OrgPage() {
  await requireSession("admin.org");
  const rows = listOrgs();
  return <OrgManager initialTree={buildOrgTree(rows)} flat={rows} typeLabels={ORG_TYPE_LABEL} />;
}
