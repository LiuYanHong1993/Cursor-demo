"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const sections = [
  {
    title: "管理",
    items: [
      { href: "/admin", label: "概览", code: "admin.dashboard" },
      { href: "/admin/org", label: "组织树", code: "admin.org" },
      { href: "/admin/users", label: "用户", code: "admin.users" },
      { href: "/admin/groups", label: "用户组", code: "admin.groups" },
      { href: "/admin/roles", label: "角色权限", code: "admin.roles" },
      { href: "/admin/logs", label: "访问日志", code: "admin.logs" },
    ],
  },
  {
    title: "监控",
    items: [
      { href: "/admin/monitoring/host", label: "主机", code: "admin.monitor.host" },
      { href: "/admin/monitoring/sql", label: "SQL", code: "admin.monitor.sql" },
      { href: "/admin/monitoring/sql-firewall", label: "SQL 防火墙", code: "admin.monitor.firewall" },
      { href: "/admin/monitoring/web", label: "Web 应用", code: "admin.monitor.web" },
      { href: "/admin/monitoring/url", label: "URL", code: "admin.monitor.url" },
    ],
  },
  {
    title: "支撑能力",
    items: [
      { href: "/admin/support/cache", label: "缓存管理", code: "admin.support.cache" },
      { href: "/admin/support/state-machine", label: "状态机", code: "admin.support.fsm" },
      { href: "/admin/support/base-list", label: "列表/编辑基类", code: "admin.support.base" },
      { href: "/admin/support/form-validation", label: "表单校验", code: "admin.support.form" },
      { href: "/admin/support/upload", label: "文件上传", code: "admin.support.upload" },
    ],
  },
];

export function AdminShell({
  children,
  displayName,
  permissions,
}: {
  children: React.ReactNode;
  displayName: string;
  permissions: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const nav = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-slate-950 text-slate-100">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="font-display text-lg text-white">统一支撑平台</div>
        <div className="mt-1 text-xs text-slate-400">管理后台 · 演示 V1.0</div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((sec) => (
          <div key={sec.title} className="mb-4">
            <div className="px-2 pb-1 text-[11px] uppercase tracking-wider text-slate-500">{sec.title}</div>
            <div className="space-y-0.5">
              {sec.items
                .filter((i) => permissions.includes(i.code))
                .map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-md px-2.5 py-1.5 text-sm ${
                        active ? "bg-teal-600 text-white" : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 p-3 text-sm">
        <div className="truncate text-slate-300">{displayName}</div>
        <div className="mt-2 flex gap-2">
          <Link href="/" className="text-xs text-teal-300 hover:underline">
            门户
          </Link>
          <button onClick={onLogout} className="text-xs text-rose-300 hover:underline">
            退出
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">{nav}</div>
        {open ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="relative z-10 h-full">{nav}</div>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <button className="rounded-md border px-2 py-1 text-sm" onClick={() => setOpen(true)}>
              菜单
            </button>
            <span className="font-medium">管理后台</span>
          </div>
          <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
