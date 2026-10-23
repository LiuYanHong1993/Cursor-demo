# 统一支撑平台 · 部署入口

正式实施与审计请以包内文档为准（与 `deploy.sh` / `deploy.bat` **同目录**）：

| 文档 | 文件 |
|------|------|
| 《统一支撑平台部署手册》 | `部署手册.pdf` / `部署手册.md` |
| 《统一支撑平台测试报告》 | `测试报告.pdf` / `测试报告.md` |
| 《统一支撑平台用户手册》 | `用户手册.pdf` / `用户手册.md` |

本文件仅作解压后的快速入口。

## 快速开始

```bash
# Linux / macOS
chmod +x deploy.sh && ./deploy.sh

# Windows：deploy.bat 或 .\deploy.ps1
```

- 门户：http://localhost:3000  
- 管理登录：http://localhost:3000/login  
- 初始管理员账号：`admin` / `admin123`（首次登录后请修改密码）

停止 / 重置 / 卸载：`./stop.sh` · `./reset.sh` · `./uninstall.sh`

环境要求、配置、常见问题、回滚等详见《部署手册》。
