# 统一支撑平台 V1.0 · 一键部署说明

本说明面向**解压部署包后**在本机或服务器运行统一支撑平台（B/S）。优先支持 Linux / macOS；Windows 可用 `deploy.bat` / `deploy.ps1`。

## 1. 前置：安装 Docker

部署依赖 **Docker** 与 **Compose**。若未安装，一键脚本会报错并打印安装链接（不会静默失败）。

| 系统 | 建议 |
|------|------|
| Windows / macOS | [Docker Desktop](https://docs.docker.com/desktop/) |
| Linux | [Docker Engine](https://docs.docker.com/engine/install/) + [Compose 插件](https://docs.docker.com/compose/install/) |

安装后确认：

```bash
docker version
docker compose version
```

Windows 请保持 **Docker Desktop 处于运行状态**。

## 2. 一键启动

解压 zip 后进入目录：

**Linux / macOS**

```bash
chmod +x deploy.sh stop.sh reset.sh uninstall.sh
./deploy.sh
```

**Windows**

- 双击 `deploy.bat`，或
- PowerShell：`.\deploy.ps1`

首次会 `docker compose up --build`，需联网拉取 `node:22-bookworm-slim` 等基础镜像并完成本地构建。

成功后脚本会打印访问地址与初始管理员账号。

- 门户：http://localhost:3000  
- 管理登录：http://localhost:3000/login  

### 初始管理员账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 教师 | `teacher` | `teacher123` |
| 学生 | `student01` | `student123` |

## 3. 停止 / 重置 / 卸载

| 操作 | Linux/macOS | Windows | 说明 |
|------|-------------|---------|------|
| 停止 | `./stop.sh` | `stop.bat` | 停容器，**保留**数据卷 |
| 重置数据 | `./reset.sh` | `reset.bat` | 删除数据卷并重新启动（恢复种子数据） |
| 卸载 | `./uninstall.sh` | `uninstall.bat` | 删除容器、网络、本地构建镜像与数据卷；**不删除**部署包文件 |

也可手动：

```bash
docker compose stop
docker compose down -v   # 含数据重置
```

## 4. 数据卷约定

- Compose 命名卷：`usp_data` → 容器内 `/app/data`
- 内容包括：SQLite 库 `usp.db`、上传目录 `uploads/`
- 重置/卸载使用 `docker compose down -v` 会清空该卷

环境变量见 `.env.example`（首次启动脚本会复制为 `.env`）：

- `SESSION_SECRET`：Session 密钥（至少 32 字符）
- `COOKIE_SECURE`：仅 HTTPS 反代时设为 `true`
- 端口默认映射 `3000:3000`（改端口请编辑 `docker-compose.yml` 的 `ports`）

## 5. 常见问题

**脚本提示未检测到 Docker**  
按脚本打印的链接安装，并确保守护进程已启动。

**健康检查超时**  
执行 `docker compose logs -f web` 查看构建/启动日志；首次构建较慢属正常。

**端口被占用**  
修改 `docker-compose.yml` 中 `"3000:3000"` 左侧主机端口，例如 `"3001:3000"`，并用 `http://localhost:3001` 访问。

**仅源码开发（不走 Docker）**  
见根目录 `README.md`：`npm install && npm run dev`。

## 6. 如何打部署包（维护者）

在仓库根目录：

```bash
npm run pack:deploy
# 或
./scripts/pack-deploy.sh
```

生成：`dist/usp-deploy.zip`  
解压后即可按上文一键启动（包内含 Dockerfile、compose、源码与脚本，现场 `compose up --build`）。
