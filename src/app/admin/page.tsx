import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const session = await requireSession();
  const sp = await searchParams;
  const db = getDb();
  const users = (db.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;
  const orgs = (db.prepare("SELECT COUNT(*) AS c FROM orgs").get() as { c: number }).c;
  const logs = (db.prepare("SELECT COUNT(*) AS c FROM access_logs").get() as { c: number }).c;
  const roles = (db.prepare("SELECT COUNT(*) AS c FROM roles").get() as { c: number }).c;
  const canSeeStats = (session.permissions || []).includes("admin.dashboard");

  return (
    <div>
      <PageHeader
        title="管理概览"
        desc={`你好，${session.displayName}。按演示路径：组织 → 用户/角色 → 日志 → 监控。`}
      />
      {sp.denied ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          当前角色缺少目标菜单权限，已回到概览。
        </div>
      ) : null}
      {!canSeeStats ? (
        <Card>
          <p className="text-sm text-slate-600">
            当前账号权限较少，主要用于门户体验。请使用 <code>admin / admin123</code> 完整体验后台。
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["用户", users, "/admin/users"],
              ["组织节点", orgs, "/admin/org"],
              ["角色", roles, "/admin/roles"],
              ["访问日志", logs, "/admin/logs"],
            ].map(([label, value, href]) => (
              <Link key={String(label)} href={String(href)}>
                <Card className="hover:border-teal-300">
                  <div className="text-sm text-slate-500">{label as string}</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-900">{value as number}</div>
                </Card>
              </Link>
            ))}
          </div>
          <Card className="mt-6">
            <h2 className="font-medium">建议演示顺序</h2>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>组织树查看校/院→系→专业→班级</li>
              <li>用户 CSV 导出/导入，调整角色权限</li>
              <li>访问日志查询、导出、删除</li>
              <li>主机与系统监控页（Mock 实时刷新）</li>
              <li>支撑能力：缓存 / 状态机 / 表单校验 / 上传</li>
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
