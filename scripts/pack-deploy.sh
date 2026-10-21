#!/usr/bin/env bash
# 打包一键部署 zip：dist/usp-deploy.zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/dist"
STAGE="$OUT_DIR/usp-deploy"
ZIP="$OUT_DIR/usp-deploy.zip"
STAMP="$(date +%Y%m%d)"

rm -rf "$STAGE"
mkdir -p "$STAGE"

# 应用构建所需源码与配置（compose up --build）
COPY_ITEMS=(
  Dockerfile
  docker-compose.yml
  .env.example
  .dockerignore
  package.json
  package-lock.json
  next.config.ts
  tsconfig.json
  tailwind.config.ts
  postcss.config.mjs
  eslint.config.mjs
  README.md
  DEPLOY.md
  部署手册.md
  deploy.sh
  stop.sh
  reset.sh
  uninstall.sh
  deploy.bat
  stop.bat
  reset.bat
  uninstall.bat
  deploy.ps1
  public
  src
)

for item in "${COPY_ITEMS[@]}"; do
  if [[ ! -e "$ROOT/$item" ]]; then
    echo "缺少必要文件: $item" >&2
    exit 1
  fi
  cp -a "$ROOT/$item" "$STAGE/"
done

# 确保脚本可执行（zip 在 Unix 解压后仍可用）
chmod +x "$STAGE"/deploy.sh "$STAGE"/stop.sh "$STAGE"/reset.sh "$STAGE"/uninstall.sh

# 部署包内简短入口说明（避免用户找错文件）
cat > "$STAGE/开始部署.txt" <<'EOF'
统一支撑平台 V1.0 · 一键部署包
====================================

Linux / macOS：
  chmod +x deploy.sh && ./deploy.sh

Windows：
  双击 deploy.bat
  或在 PowerShell：.\deploy.ps1

正式说明见《统一支撑平台部署手册》：部署手册.md
（DEPLOY.md 为简明入口）
初始管理员账号：admin / admin123
默认端口：http://localhost:3000
EOF

rm -f "$ZIP"
(
  cd "$OUT_DIR"
  if command -v zip >/dev/null 2>&1; then
    zip -r -q "usp-deploy.zip" "usp-deploy"
  else
    # 无 zip 时用 tar.gz，并额外生成同名说明
    tar -czf "usp-deploy.tar.gz" "usp-deploy"
    echo "本环境无 zip 命令，已生成 usp-deploy.tar.gz" >&2
    # 仍尝试用 Python 打 zip，保证交付 zip
    python3 - <<'PY'
import pathlib, zipfile
out = pathlib.Path("usp-deploy.zip")
root = pathlib.Path("usp-deploy")
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for p in root.rglob("*"):
        z.write(p, p.as_posix())
print("wrote", out)
PY
  fi
)

# 校验
test -f "$ZIP"
BYTES=$(wc -c < "$ZIP" | tr -d ' ')
echo "已生成: $ZIP ($BYTES bytes)"
echo "建议复制到发布目录，例如 Project media/usp-deploy-${STAMP}.zip"
echo "$ZIP"
