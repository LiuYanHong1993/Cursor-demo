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

echo 将删除 Compose 数据卷中的演示数据，并重新启动。
set /p ans=确认继续？[y/N] 
if /I not "%ans%"=="y" if /I not "%ans%"=="yes" (
  echo 已取消。
  exit /b 0
)

docker compose down -v
call "%~dp0deploy.bat"
exit /b %ERRORLEVEL%
