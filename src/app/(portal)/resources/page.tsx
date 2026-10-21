import { PortalSection } from "@/components/portal-section";

export default function ResourcesPage() {
  return (
    <PortalSection
      title="教学资源"
      lead="示例资源条目，展示门户信息架构。"
      items={[
        {
          title: "Web 前端实验指导书",
          meta: "课件 · PDF",
          body: "覆盖组件化开发与表单校验实践，可在后台「文件上传」示意中挂载附件。",
        },
        {
          title: "数据库原理实验数据集",
          meta: "数据 · CSV",
          body: "与用户批量导入导出功能共用 CSV 约定。",
        },
        {
          title: "统一认证对接说明",
          meta: "文档",
          body: "支撑平台使用 Session + RBAC；生产可替换为校园统一认证。",
        },
      ]}
    />
  );
}
