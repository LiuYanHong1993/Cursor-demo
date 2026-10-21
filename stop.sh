#!/usr/bin/env bash
# 停止演示服务（保留数据卷）
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

"${COMPOSE[@]}" stop
echo "已停止服务。数据卷仍保留。再次启动请执行: ./deploy.sh"
