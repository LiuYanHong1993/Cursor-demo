import { PortalSection } from "@/components/portal-section";

export default function ActivitiesPage() {
  return (
    <PortalSection
      title="学生活动"
      lead="社团与竞赛活动列表示意。"
      items={[
        {
          title: "程序设计竞赛校内选拔",
          meta: "10 月下旬",
          body: "报名入口指向学生用户中心示意页。",
        },
        {
          title: "开源贡献工作坊",
          meta: "每周三晚",
          body: "结合支撑平台「状态机样例」讲解审核发布流程。",
        },
      ]}
    />
  );
}
