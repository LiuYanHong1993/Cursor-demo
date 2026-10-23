import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { UploadPanel } from "./upload-panel";

export default async function Page() {
  await requireSession("admin.support.upload");
  const files = getDb().prepare("SELECT * FROM uploaded_files ORDER BY id DESC").all() as {
    id: number;
    original_name: string;
    stored_name: string;
    size: number;
    mime_type: string;
    uploaded_by: string;
    created_at: string;
  }[];
  return <UploadPanel files={files} />;
}
