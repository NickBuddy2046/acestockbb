#!/bin/bash

# OpenBB Web App 部署腳本

echo "🚀 開始部署 OpenBB Web App..."

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤: 請在項目根目錄運行此腳本"
    exit 1
fi

# 檢查環境變量
if [ -z "$NEXT_PUBLIC_CONVEX_URL" ]; then
    echo "❌ 錯誤: 請設置 NEXT_PUBLIC_CONVEX_URL 環境變量"
    exit 1
fi

echo "📦 安裝依賴..."
npm ci

echo "🔧 構建項目..."
npm run build

echo "☁️ 部署 Convex 後端..."
npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL

echo "🌐 部署前端到 Vercel..."
vercel --prod

echo "✅ 部署完成！"
echo ""
echo "🔗 訪問你的應用:"
echo "- 前端: https://your-app.vercel.app"
echo "- Convex Dashboard: https://dashboard.convex.dev"
echo ""
echo "📊 監控:"
echo "- Vercel Analytics: https://vercel.com/analytics"
echo "- Convex Logs: npx convex dashboard"