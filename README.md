# ilook 虚拟现实工程技术实训软件 V1.0（本地原型）

为用户提供虚拟现实工程技术实训服务的可本地运行 Web 原型。体现软著描述中的实训流程、多层加密与脱敏、聚合一致性、组件化环境与高可靠 IPC（进程内消息总线模拟）。**不是完整 VR/Unity 引擎**，管理端 + 流程模拟 + 轻量 Canvas 示意。

## 环境要求

- Node.js ≥ 18（零第三方 npm 依赖，仅用 Node 标准库）

## 安装依赖

本原型无外部包依赖，无需 `npm install`。若仅校验 Node 版本：

```bash
node -v
```

## 本地启动

```bash
npm start
# 或
node server/index.js
```

开发热重载（可选）：

```bash
npm run dev
```

## 默认访问地址

- 管理端首页：http://127.0.0.1:3780/
- 健康检查：http://127.0.0.1:3780/api/health

可通过环境变量覆盖：`PORT`、`HOST`、`ILOOK_SECRET`。

## 主要功能入口

| 入口 | 说明 |
|------|------|
| 首页 Hero /「进入实训台」 | 品牌与 VR 场景示意 |
| `#train` 实训任务台 | 场景/学员选择、会话状态机推进、AI 教练建议 |
| `#privacy` 隐私层 | 加密通道开关、字段脱敏、密文预览、解密审计 |
| `#consistency` 一致性观察台 | 聚合内强一致日志、跨聚合 Outbox / 最终一致 |
| `#components` 组件 IPC | 人工智能软件分类、组件心跳、IPC ACK/重试 |

## 目录结构

```
├── package.json
├── README.md
├── public/           # 前端静态页
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── server/           # Node HTTP 服务
    ├── index.js
    ├── domain/       # 实训会话 / 学员聚合
    ├── security/     # 多层加密与脱敏
    ├── ipc/          # 高可靠消息总线
    └── components/   # 组件化环境管理
```

## 技术栈

Node.js 原生 HTTP + 原生 ESM；前端静态 HTML/CSS/JS（Outfit / JetBrains Mono）。
