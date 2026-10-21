@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
set "COMPOSE_PROJECT_NAME=usp"

where docker >nul 2>&1
if errorlevel 1 (
  echo 错误：未找到 Docker。
  exit /b 1
)

echo 将删除容器、网络与数据卷 usp_data（业务数据不可恢复）。
set /p ans=确认卸载？[y/N] 
if /I not "%ans%"=="y" if /I not "%ans%"=="yes" (
  echo 已取消。
  exit /b 0
)

docker compose down -v --rmi local
if errorlevel 1 docker compose down -v
echo 已卸载运行环境。部署包目录仍保留，需要时可再次 deploy.bat。
exit /b 0
