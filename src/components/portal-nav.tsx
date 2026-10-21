"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "平台概况" },
  { href: "/notices", label: "通知公告" },
  { href: "/resources", label: "教学资源" },
  { href: "/lab-center", label: "实验中心" },
  { href: "/offline-labs", label: "线下实验室" },
  { href: "/activities", label: "学生活动" },
  { href: "/student-center", label: "学生用户中心" },
];

export function PortalNav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b3d4a]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 font-display text-lg tracking-wide text-white">
          统一支撑平台
        </Link>
        <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm transition ${
                  active ? "bg-white/15 text-white" : "text-teal-50/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/login"
          className="rounded-md bg-amber-400 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-amber-300"
        >
          管理登录
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-md px-2 py-1 text-xs ${
              pathname === l.href ? "bg-white/15 text-white" : "text-teal-50/80"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
