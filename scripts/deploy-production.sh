#!/bin/bash

echo "🚀 開始部署 OpenBB Web App 到生產環境..."

# 進入項目目錄
cd openbb-convex-app

echo "📦 安裝依賴..."
npm install

echo "🔧 構建應用..."
npm run build

echo "☁️ 部署 Convex 到生產環境..."
npx convex deploy

echo "🌐 部署到 Vercel..."
npx vercel --prod

echo "✅ 部署完成！"
echo ""
echo "🎉 您的應用現在可以在線上訪問了！"
echo "📊 Convex Dashboard: https://dashboard.convex.dev"
echo "🌐 Vercel Dashboard: https://vercel.com/dashboard"