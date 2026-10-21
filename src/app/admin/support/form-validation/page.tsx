import { requireSession } from "@/lib/auth";
import { FormValidationDemo } from "./form-validation-demo";

export default async function Page() {
  await requireSession("admin.support.form");
  return <FormValidationDemo />;
}
