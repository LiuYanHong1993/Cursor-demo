import Link from "next/link";

export default function StudentCenterPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-3xl text-[#0b3d4a]">学生用户中心</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        演示版提供个人信息与快捷入口示意。完整业务能力请使用管理后台账号体验组织、权限与监控模块。
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-teal-900/10 bg-white/70 p-5">
          <h2 className="font-medium">演示学生账号</h2>
          <p className="mt-2 text-sm text-slate-600">用户名 student01 / 密码 student123（权限较受限）</p>
          <Link href="/login" className="mt-4 inline-block text-sm text-teal-800 hover:underline">
            去登录 →
          </Link>
        </div>
        <div className="rounded-xl border border-teal-900/10 bg-white/70 p-5">
          <h2 className="font-medium">我的预约（示意）</h2>
          <p className="mt-2 text-sm text-slate-600">暂无真实预约数据。现场可讲解与班级组织节点的关联设计。</p>
        </div>
      </div>
    </div>
  );
}
