Write-Host "🚀 開始部署 OpenBB Web App 到生產環境..." -ForegroundColor Green

# 進入項目目錄
Set-Location openbb-convex-app

Write-Host "📦 安裝依賴..." -ForegroundColor Yellow
npm install

Write-Host "🔧 構建應用..." -ForegroundColor Yellow
npm run build

Write-Host "☁️ 部署 Convex 到生產環境..." -ForegroundColor Yellow
npx convex deploy

Write-Host "🌐 部署到 Vercel..." -ForegroundColor Yellow
npx vercel --prod

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 您的應用現在可以在線上訪問了！" -ForegroundColor Cyan
Write-Host "📊 Convex Dashboard: https://dashboard.convex.dev" -ForegroundColor Blue
Write-Host "🌐 Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor Blue