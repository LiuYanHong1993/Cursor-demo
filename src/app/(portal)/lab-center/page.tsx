import { PortalSection } from "@/components/portal-section";

export default function LabCenterPage() {
  return (
    <PortalSection
      title="实验中心"
      lead="虚拟实验与在线实训入口示意。"
      items={[
        {
          title: "网络攻防仿真舱",
          meta: "在线 · 开放中",
          body: "门户入口；真实实验环境不在本仓库范围。",
        },
        {
          title: "大数据可视化实训",
          meta: "在线 · 预约",
          body: "与组织树中的专业/班级关联，用于说明数据联动能力。",
        },
      ]}
    />
  );
}
