import { PortalSection } from "@/components/portal-section";

export default function NoticesPage() {
  return (
    <PortalSection
      title="通知公告"
      lead="门户栏目内容示例，用于展示信息架构。"
      items={[
        {
          title: "统一支撑平台运行环境上线",
          meta: "2026-10-20",
          body: "本环境用于汇报与验收，初始管理员账号见 README。请勿存放真实生产数据。",
        },
        {
          title: "实验中心预约通道开放",
          meta: "2026-10-18",
          body: "学生可通过学生用户中心查看预约入口示意（支撑平台不接真实排课）。",
        },
        {
          title: "教学资源库维护窗口",
          meta: "2026-10-15",
          body: "周末 02:00–04:00 进行缓存与上传目录维护演练。",
        },
      ]}
    />
  );
}
