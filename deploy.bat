@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

set "PORT=3000"
if not "%USP_PORT%"=="" set "PORT=%USP_PORT%"
set "URL=http://localhost:%PORT%"
set "COMPOSE_PROJECT_NAME=usp"

echo === 统一支撑平台 V1.0 · 一键部署 ===
echo 项目目录: %CD%
echo.

where docker >nul 2>&1
if errorlevel 1 (
  echo 错误：未检测到 Docker，无法启动运行环境。
  echo.
  echo 请先安装 Docker Desktop（含 Compose），然后重新打开命令行再执行本脚本。
  echo 下载：https://docs.docker.com/desktop/setup/install/windows-install/
  echo.
  echo 安装后请确认：
  echo   1^) docker version 可正常输出
  echo   2^) docker compose version 可正常输出
  echo   3^) Docker Desktop 已启动
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo 错误：已安装 Docker，但守护进程不可用。请打开 Docker Desktop 并等待就绪后重试。
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo 错误：缺少 docker compose。请安装/升级 Docker Desktop。
  echo 文档：https://docs.docker.com/compose/install/
  exit /b 1
)

if not exist "docker-compose.yml" (
  echo 错误：未找到 docker-compose.yml，请在解压后的部署包根目录执行本脚本。
  exit /b 1
)

if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo 已从 .env.example 生成 .env
  )
)

echo 正在构建并启动（首次可能需要数分钟）...
docker compose up -d --build
if errorlevel 1 (
  echo 启动失败，请执行: docker compose logs web
  exit /b 1
)

echo 等待服务就绪...
set "OK=0"
for /L %%i in (1,1,60) do (
  powershell -NoProfile -Command "try { (Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 '%URL%').StatusCode } catch { exit 1 }" >nul 2>&1
  if not errorlevel 1 (
    set "OK=1"
    goto :ready
  )
  timeout /t 2 /nobreak >nul
)

:ready
echo.
if "%OK%"=="1" (
  echo 启动成功。
) else (
  echo 容器已启动，但健康检查超时。请稍后访问或查看: docker compose logs -f web
)

echo.
echo 访问地址: %URL%
echo 管理登录: %URL%/login
echo.
echo 初始管理员账号：
echo   管理员  admin / admin123
echo   教师    teacher / teacher123
echo   学生    student01 / student123
echo.
echo 停止服务: stop.bat
echo 重置数据: reset.bat
echo 卸载清理: uninstall.bat
exit /b 0
