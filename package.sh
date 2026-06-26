#!/bin/bash
SOURCE_ZIP="theme-source-code.zip"

package_deploy() {
  npm run build
  npx shopify theme package
  echo "✅ 部署包 theme.zip 生成完成"
}

package_source() {
  rm -f "$SOURCE_ZIP"
  zip -r "$SOURCE_ZIP" . \
    -x node_modules/** \
    -x *.zip \
    -x .vite/** \
    -x dist/** \
    -x tmp/** \
    -x .DS_Store \
    -x package.sh \
    -x .git/** \
    -x .vscode/** \
    -x .idea/** \
    -x *.log
  echo "✅ 源码包 $SOURCE_ZIP 生成完成"
}

if [ "$1" = "deploy" ]; then
  package_deploy
elif [ "$1" = "source" ]; then
  package_source
else
  echo "用法：bash package.sh deploy  或  bash package.sh source"
fi