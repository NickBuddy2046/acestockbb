#!/bin/bash

# OpenBB Web App 開發環境啟動腳本

echo "🚀 啟動 OpenBB Web App 開發環境..."

# 檢查是否在正確的目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤: 請在項目根目錄運行此腳本"
    exit 1
fi

# 檢查環境變量
if [ ! -f ".env.local" ]; then
    echo "⚠️  警告: 未找到 .env.local 文件"
    echo "請複製 .env.local.example 並填入配置"
fi

# 檢查依賴
if [ ! -d "node_modules" ]; then
    echo "📦 安裝依賴..."
    npm install
fi

echo "🔧 啟動服務..."

# 在後台啟動 Convex
echo "啟動 Convex 開發服務器..."
npx convex dev &
CONVEX_PID=$!

# 等待 Convex 啟動
sleep 3

# 啟動 Next.js
echo "啟動 Next.js 開發服務器..."
npm run dev &
NEXTJS_PID=$!

echo ""
echo "✅ 開發環境已啟動！"
echo ""
echo "🔗 訪問地址:"
echo "- 前端: http://localhost:3000"
echo "- Convex Dashboard: npx convex dashboard"
echo ""
echo "⏹️  停止服務: Ctrl+C"

# 等待用戶中斷
trap "echo ''; echo '🛑 停止服務...'; kill $CONVEX_PID $NEXTJS_PID 2>/dev/null; exit 0" INT

# 保持腳本運行
wait