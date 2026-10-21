#!/usr/bin/env bash
# 统一支撑平台 V1.0 演示版 · 一键启动
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

PORT="${USP_PORT:-3000}"
URL="http://localhost:${PORT}"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-usp-demo}"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
info() { printf '%s\n' "$*"; }

fail_docker() {
  red "错误：未检测到可用的 Docker，无法启动演示环境。"
  echo
  info "请先安装 Docker Desktop（含 Compose），安装后重新打开终端再执行本脚本。"
  echo
  info "安装指引："
  info "  · macOS / Windows：https://docs.docker.com/desktop/"
  info "  · Linux（官方文档）：https://docs.docker.com/engine/install/"
  info "  · Ubuntu 示例：https://docs.docker.com/engine/install/ubuntu/"
  echo
  info "安装后请确认："
  info "  1) 命令 docker version 可正常输出"
  info "  2) 命令 docker compose version 可正常输出"
  info "  3) Docker 守护进程已启动（Docker Desktop 已打开，或 systemctl start docker）"
  exit 1
}

detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    COMPOSE=(docker compose)
    return 0
  fi
  if command -v docker-compose >/dev/null 2>&1 && docker-compose version >/dev/null 2>&1; then
    COMPOSE=(docker-compose)
    return 0
  fi
  return 1
}

if ! command -v docker >/dev/null 2>&1; then
  fail_docker
fi

if ! docker info >/dev/null 2>&1; then
  red "错误：已安装 Docker，但守护进程不可用（未启动或无权限）。"
  echo
  info "请尝试："
  info "  · 打开 Docker Desktop 并等待其就绪"
  info "  · Linux：sudo systemctl start docker"
  info "  · 将当前用户加入 docker 组后重新登录：sudo usermod -aG docker \"\$USER\""
  exit 1
fi

if ! detect_compose; then
  red "错误：检测到 Docker，但缺少 Compose（docker compose / docker-compose）。"
  echo
  info "Docker Desktop 一般已内置 Compose。Linux 可参考："
  info "  https://docs.docker.com/compose/install/"
  exit 1
fi

if [[ ! -f "$ROOT/docker-compose.yml" ]]; then
  red "错误：未找到 docker-compose.yml，请在解压后的部署包根目录执行本脚本。"
  exit 1
fi

if [[ ! -f "$ROOT/.env" ]]; then
  if [[ -f "$ROOT/.env.example" ]]; then
    cp "$ROOT/.env.example" "$ROOT/.env"
    yellow "已从 .env.example 生成 .env（可按需修改 SESSION_SECRET / 端口映射）。"
  else
    yellow "未找到 .env.example，将使用 compose 内置默认环境变量。"
  fi
fi

info "=== 统一支撑平台 V1.0 演示版 · 一键部署 ==="
info "项目目录: $ROOT"
info "Compose:  ${COMPOSE[*]}"
info "访问端口: $PORT"
echo

info "正在构建并启动（首次可能需要数分钟下载基础镜像）…"
export COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT"
"${COMPOSE[@]}" up -d --build

info "等待服务就绪…"
ok=0
for i in $(seq 1 60); do
  if curl -fsS "$URL" >/dev/null 2>&1 || curl -fsS "$URL/login" >/dev/null 2>&1; then
    ok=1
    break
  fi
  # 容器内无 curl 时，用 docker 探测端口
  if command -v curl >/dev/null 2>&1; then
    :
  elif "${COMPOSE[@]}" exec -T web node -e "require('http').get('http://127.0.0.1:3000',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))" >/dev/null 2>&1; then
    ok=1
    break
  fi
  sleep 2
done

echo
if [[ "$ok" -eq 1 ]]; then
  green "启动成功。"
else
  yellow "容器已启动，但健康检查超时。请稍后浏览器访问，或执行："
  info "  ${COMPOSE[*]} logs -f web"
fi

echo
info "访问地址: $URL"
info "管理登录: $URL/login"
echo
info "默认账号："
info "  管理员  admin / admin123"
info "  教师    teacher / teacher123"
info "  学生    student01 / student123"
echo
info "常用命令："
info "  查看日志: ${COMPOSE[*]} logs -f web"
info "  停止服务: ./stop.sh"
info "  重置数据: ./reset.sh"
info "  卸载清理: ./uninstall.sh"
