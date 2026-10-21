import { PortalSection } from "@/components/portal-section";

export default function OfflineLabsPage() {
  return (
    <PortalSection
      title="线下实验室"
      lead="线下机房与开放时间示意信息。"
      items={[
        {
          title: "A101 软件工程实验室",
          meta: "工作日 08:00–21:00",
          body: "60 机位 · 关联信息工程学院 / 计算机系。",
        },
        {
          title: "B203 硬件接口实验室",
          meta: "需教师带队",
          body: "展示「组织—资源」关联，不做真实门禁对接。",
        },
      ]}
    />
  );
}
