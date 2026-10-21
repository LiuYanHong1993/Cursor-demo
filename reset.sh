#!/usr/bin/env bash
# 重置演示数据（清空数据卷后重新启动，恢复种子账号）
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

echo "将删除 Compose 数据卷中的演示数据，并重新启动。"
read -r -p "确认继续？[y/N] " ans
case "${ans:-}" in
  y|Y|yes|YES) ;;
  *) echo "已取消。"; exit 0 ;;
esac

"${COMPOSE[@]}" down -v
exec "$ROOT/deploy.sh"
