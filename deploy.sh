#!/bin/bash
# Java面试通 · 一键部署到 Netlify
# 用法：在项目根目录执行 bash deploy.sh
# 前提：已运行 netlify login 且已执行 netlify link --name magical-crisp-b5c2fe

set -e

echo "🚀 开始部署 Java面试通 到 Netlify..."
echo ""

# 部署到生产环境
netlify deploy --prod --dir=.

echo ""
echo "✅ 部署完成！"
echo "📱 访问地址: https://magical-crisp-b5c2fe.netlify.app"
