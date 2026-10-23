import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[78vh] overflow-hidden bg-[radial-gradient(ellipse_at_20%_20%,#1a6b78_0%,#0b3d4a_45%,#07262e_100%)] text-white">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -right-16 top-10 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl animate-drift" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-teal-200/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end gap-6 px-4 pb-16 pt-28 sm:pt-36">
          <p className="animate-rise font-display text-4xl sm:text-6xl tracking-wide">统一支撑平台</p>
          <h1 className="animate-rise max-w-2xl text-xl text-teal-50/90 sm:text-2xl" style={{ animationDelay: "80ms" }}>
            为业务系统提供基础框架与组件能力，减少重复建设
          </h1>
          <p className="animate-rise max-w-xl text-sm leading-relaxed text-teal-100/75" style={{ animationDelay: "140ms" }}>
            用户与权限、日志、缓存、表单校验、状态机、文件存储与监控示意一站式提供。
          </p>
          <div className="animate-rise flex flex-wrap gap-3" style={{ animationDelay: "200ms" }}>
            <Link
              href="/login"
              className="rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300"
            >
              进入管理后台
            </Link>
            <Link
              href="/notices"
              className="rounded-md border border-white/30 px-5 py-2.5 text-sm text-white hover:bg-white/10"
            >
              浏览门户栏目
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-display text-2xl text-[#0b3d4a]">平台能力一览</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          本系统覆盖需求中的门户导航、组织与 RBAC、访问日志、主机/系统监控示意，以及若干支撑组件样例。
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            ["用户与权限", "组织树、用户/组/角色、菜单级 RBAC、CSV 导入导出"],
            ["运行观测", "主机 CPU/内存/磁盘，SQL / 防火墙 / Web / URL Mock 指标"],
            ["支撑组件", "缓存、状态机、列表编辑基类、前后端一致校验、本地上传"],
          ].map(([t, d]) => (
            <div key={t} className="border-l-2 border-teal-700 pl-4">
              <h3 className="font-medium text-slate-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
