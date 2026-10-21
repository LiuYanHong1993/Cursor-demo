# 统一支撑平台 V1.0 · 演示版

可一键部署的 B/S 演示系统：门户栏目 + 组织/用户/RBAC + 访问日志 + 主机/系统监控示意 + 支撑组件样例。

## 一键启动

```bash
docker compose up --build
```

浏览器打开 [http://localhost:3000](http://localhost:3000)

本地开发：

```bash
npm install
npm run dev
```

## 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员（全权限） | `admin` | `admin123` |
| 教师（监控+支撑） | `teacher` | `teacher123` |
| 学生（权限很少） | `student01` | `student123` |

## 演示路径（约 5 分钟）

1. **门户**：顶部导航切换「平台概况 / 通知公告 / 教学资源 / 实验中心 / 线下实验室 / 学生活动 / 学生用户中心」
2. **登录后台**：门户右上角「管理登录」→ `admin / admin123`
3. **组织树**：校/院 → 系 → 专业 → 班级；可新增/删除节点
4. **用户**：新建用户、绑定角色；**导出/导入 CSV**
5. **角色权限**：勾选菜单权限并保存（RBAC）
6. **访问日志**：筛选、导出 CSV、勾选删除
7. **监控**：主机（CPU/内存/磁盘，约 3s 刷新）；SQL / SQL 防火墙 / Web / URL（Mock 指标）
8. **支撑能力**：缓存、状态机流转、列表编辑基类、前后端一致表单校验、本地文件上传

## 技术说明

- Next.js App Router 全栈（API Routes + SQLite）
- Session（iron-session）+ RBAC
- 数据与上传目录默认 `./data`（Compose 挂载卷 `usp_data`）
- 监控与 SQL 防火墙为 **Mock**，足够现场演示；用户/角色/日志为真实 CRUD

### 多实例（演示级说明）

当前 Compose 为单实例。扩到多实例时建议：

1. 将 SQLite 换成 Postgres/MySQL（连接串配置位可后续扩展）
2. Session 改为 Redis 共享，或使用统一认证
3. 上传目录改为共享卷 / 对象存储
4. 反向代理（Nginx）做负载均衡与 HTTPS（`COOKIE_SECURE=true`）

## 覆盖 vs 示意（Stub）

| 需求项 | 状态 |
|--------|------|
| 门户 7 个栏目 | 已覆盖（示意内容） |
| 组织树联动用户 | 已覆盖 |
| 用户/组/角色 + RBAC | 已覆盖 |
| 用户 CSV 导入导出 | 已覆盖 |
| 访问日志查看/导出/删除 | 已覆盖 |
| 主机 CPU/内存/磁盘 | 已覆盖（Mock 刷新） |
| SQL / 防火墙 / Web / URL 监控 | 已覆盖（Mock 指标与表格） |
| 缓存 / 状态机 / 列表编辑 / 表单校验 / 上传 | 已覆盖（演示级） |
| 多数据库驱动切换 | Stub（当前仅 SQLite） |
| 真实集群 / APM 探针 / SQL 防火墙引擎 | Stub（文档级说明） |
| 完整教学业务 | 不做 |

## 环境变量

见 `.env.example`：`DATA_DIR`、`SESSION_SECRET`、`COOKIE_SECURE`。
