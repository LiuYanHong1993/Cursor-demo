# 统一支撑平台 V1.0 · PowerShell 一键启动
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

$Port = if ($env:USP_PORT) { $env:USP_PORT } else { "3000" }
$Url = "http://localhost:$Port"
$env:COMPOSE_PROJECT_NAME = "usp"

function Fail-Docker([string]$Msg) {
  Write-Host $Msg -ForegroundColor Red
  Write-Host ""
  Write-Host "请先安装 Docker Desktop（含 Compose）："
  Write-Host "  https://docs.docker.com/desktop/setup/install/windows-install/"
  Write-Host "安装后确认 docker / docker compose 可用，且 Docker Desktop 已启动。"
  exit 1
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  Fail-Docker "错误：未检测到 Docker，无法启动运行环境。"
}

try {
  docker info | Out-Null
} catch {
  Fail-Docker "错误：Docker 守护进程不可用。请打开 Docker Desktop 后重试。"
}

try {
  docker compose version | Out-Null
} catch {
  Fail-Docker "错误：缺少 docker compose。请安装/升级 Docker Desktop。"
}

if (-not (Test-Path ".\docker-compose.yml")) {
  Write-Host "错误：未找到 docker-compose.yml，请在解压后的部署包根目录执行。" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path ".\.env") -and (Test-Path ".\.env.example")) {
  Copy-Item ".\.env.example" ".\.env" -Force
  Write-Host "已从 .env.example 生成 .env" -ForegroundColor Yellow
}

Write-Host "正在构建并启动…"
docker compose up -d --build

$ok = $false
for ($i = 1; $i -le 60; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri $Url
    if ($r.StatusCode -lt 500) { $ok = $true; break }
  } catch {
    Start-Sleep -Seconds 2
  }
}

Write-Host ""
if ($ok) { Write-Host "启动成功。" -ForegroundColor Green }
else { Write-Host "容器已启动，但健康检查超时。可查看: docker compose logs -f web" -ForegroundColor Yellow }

Write-Host ""
Write-Host "访问地址: $Url"
Write-Host "管理登录: $Url/login"
Write-Host ""
Write-Host "初始管理员账号："
Write-Host "  管理员  admin / admin123"
Write-Host "  教师    teacher / teacher123"
Write-Host "  学生    student01 / student123"
