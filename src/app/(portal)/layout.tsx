import { PortalNav } from "@/components/portal-nav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--usp-sand)]">
      <PortalNav />
      {children}
      <footer className="border-t border-teal-900/10 bg-[#0b3d4a] px-4 py-8 text-center text-sm text-teal-50/80">
        统一支撑平台 V1.0 · 演示版 · B/S 架构 · 支持单机 Docker Compose 部署
      </footer>
    </div>
  );
}
