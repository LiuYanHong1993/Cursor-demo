@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "COMPOSE_PROJECT_NAME=usp-demo"

where docker >nul 2>&1
if errorlevel 1 (
  echo 错误：未找到 Docker。
  exit /b 1
)

docker compose stop
echo 已停止服务。数据卷仍保留。再次启动请执行 deploy.bat
exit /b 0
