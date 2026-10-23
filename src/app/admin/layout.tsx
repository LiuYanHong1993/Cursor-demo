import { AdminShell } from "@/components/admin-shell";
import { requireSession } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  return (
    <AdminShell displayName={session.displayName || session.username || ""} permissions={session.permissions || []}>
      {children}
    </AdminShell>
  );
}
