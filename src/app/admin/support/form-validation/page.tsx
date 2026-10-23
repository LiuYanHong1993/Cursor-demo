import { requireSession } from "@/lib/auth";
import { FormValidationPanel } from "./form-validation-panel";

export default async function Page() {
  await requireSession("admin.support.form");
  return <FormValidationPanel />;
}
