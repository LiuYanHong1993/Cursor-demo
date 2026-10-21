#!/usr/bin/env bash
# 卸载：停止并删除容器、网络与数据卷（不删除本部署包文件）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
COMPOSE_PROJECT="${COMPOSE_PROJECT_NAME:-usp-demo}"
export COMPOSE_PROJECT_NAME="$COMPOSE_PROJECT"

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "错误：未找到 docker compose。请先安装 Docker。" >&2
  exit 1
fi

echo "将删除容器、网络与数据卷 usp_data（演示数据不可恢复）。"
read -r -p "确认卸载？[y/N] " ans
case "${ans:-}" in
  y|Y|yes|YES) ;;
  *) echo "已取消。"; exit 0 ;;
esac

"${COMPOSE[@]}" down -v --rmi local 2>/dev/null || "${COMPOSE[@]}" down -v
echo "已卸载运行环境。部署包目录仍保留，需要时可再次 ./deploy.sh。"
