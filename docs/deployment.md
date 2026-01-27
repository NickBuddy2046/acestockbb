# 部署指南

## 部署架構

```
用戶 → Vercel (前端) → Convex (後端) → OpenBB API
```

## 準備工作

### 1. 帳號準備
- [Vercel 帳號](https://vercel.com)
- [Convex 帳號](https://convex.dev)
- [GitHub 帳號](https://github.com) (用於代碼託管)

### 2. 代碼準備
```bash
# 確保代碼已提交到 Git
git add .
git commit -m "準備部署"
git push origin main
```

## Convex 後端部署

### 1. 創建生產環境項目

```bash
# 部署到 Convex
npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

### 2. 配置環境變量

在 Convex Dashboard 中設置：

```bash
# OpenBB API URL (如果使用雲端 OpenBB)
OPENBB_API_URL=https://your-openbb-api.com

# 認證配置
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### 3. 數據庫初始化

```bash
# 運行數據庫遷移（如果有）
npx convex run setup:initializeDatabase
```

## Vercel 前端部署

### 1. 連接 GitHub 倉庫

1. 登錄 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "New Project"
3. 選擇 GitHub 倉庫
4. 配置項目設置

### 2. 環境變量配置

在 Vercel 項目設置中添加：

```bash
# Convex 配置
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# OpenBB API 配置
OPENBB_API_URL=https://your-openbb-api.com

# 認證配置
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

### 3. 構建配置

確保 `next.config.js` 正確配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-image-domains.com'],
  },
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
}

module.exports = nextConfig
```

### 4. 部署

```bash
# 手動部署
vercel --prod

# 或者通過 Git 推送自動部署
git push origin main
```

## OpenBB API 部署

### 選項 1: 雲端部署 (推薦)

#### 使用 Railway
```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登錄
railway login

# 創建項目
railway new

# 部署
railway up
```

#### 使用 Render
1. 連接 GitHub 倉庫
2. 選擇 Web Service
3. 配置構建命令：
   ```bash
   pip install "openbb[all]"
   ```
4. 配置啟動命令：
   ```bash
   openbb-api --host 0.0.0.0 --port $PORT
   ```

### 選項 2: Docker 部署

#### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安裝 OpenBB
RUN pip install "openbb[all]"

# 暴露端口
EXPOSE 8000

# 啟動命令
CMD ["openbb-api", "--host", "0.0.0.0", "--port", "8000"]
```

#### 部署到雲端
```bash
# 構建鏡像
docker build -t openbb-api .

# 推送到容器註冊表
docker tag openbb-api your-registry/openbb-api
docker push your-registry/openbb-api
```

## 域名和 SSL

### 1. 自定義域名

在 Vercel 項目設置中：
1. 進入 "Domains" 標籤
2. 添加自定義域名
3. 配置 DNS 記錄

### 2. SSL 證書
Vercel 自動提供 SSL 證書，無需額外配置。

## 監控和日誌

### 1. Vercel 監控
- 使用 Vercel Analytics
- 配置錯誤追蹤

### 2. Convex 監控
```typescript
// 在 Convex 函數中添加日誌
export const myFunction = mutation({
  handler: async (ctx, args) => {
    console.log("函數調用:", args)
    // 業務邏輯
  }
})
```

### 3. 第三方監控

#### Sentry 錯誤追蹤
```bash
npm install @sentry/nextjs
```

```javascript
// next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  org: 'your-org',
  project: 'your-project',
})
```

## 性能優化

### 1. 圖片優化
```typescript
// 使用 Next.js Image 組件
import Image from 'next/image'

<Image
  src="/chart.png"
  alt="股價圖表"
  width={800}
  height={400}
  priority
/>
```

### 2. 代碼分割
```typescript
// 動態導入大型組件
import dynamic from 'next/dynamic'

const StockChart = dynamic(() => import('./StockChart'), {
  loading: () => <div>載入圖表中...</div>,
})
```

### 3. 緩存策略
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=300, stale-while-revalidate=600',
          },
        ],
      },
    ]
  },
}
```

## 安全配置

### 1. 環境變量安全
- 敏感信息只在服務器端使用
- 使用 `NEXT_PUBLIC_` 前綴的變量會暴露給客戶端

### 2. CORS 配置
```typescript
// 在 Convex HTTP 動作中
export const httpAction = httpRouter()

httpAction.route({
  path: "/api/webhook",
  method: "POST",
  handler: async (ctx, request) => {
    // 設置 CORS 頭
    return new Response(JSON.stringify(data), {
      headers: {
        "Access-Control-Allow-Origin": "https://your-domain.com",
        "Content-Type": "application/json",
      },
    })
  },
})
```

### 3. 認證安全
```typescript
// 確保所有敏感操作都需要認證
export const sensitiveOperation = mutation({
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("需要登錄")
    }
    // 執行操作
  }
})
```

## 備份和恢復

### 1. 數據備份
```bash
# 導出 Convex 數據
npx convex export --output backup.jsonl
```

### 2. 數據恢復
```bash
# 導入數據到新環境
npx convex import backup.jsonl
```

## 成本優化

### 1. Vercel 成本
- 使用 Hobby 計劃（免費）適合個人項目
- Pro 計劃 ($20/月) 適合商業項目

### 2. Convex 成本
- 免費額度：1M 函數調用/月
- 付費計劃：$25/月起

### 3. OpenBB API 成本
- 使用免費數據源（Yahoo Finance）
- 按需升級到付費數據源

## 故障排除

### 常見問題

#### 1. 部署失敗
```bash
# 檢查構建日誌
vercel logs your-deployment-url
```

#### 2. 環境變量問題
```bash
# 檢查環境變量
vercel env ls
```

#### 3. Convex 連接問題
```bash
# 檢查 Convex 狀態
npx convex dashboard
```

### 調試工具
- Vercel 部署日誌
- Convex Dashboard
- 瀏覽器開發者工具
- Sentry 錯誤報告

## 維護和更新

### 1. 依賴更新
```bash
# 檢查過期依賴
npm outdated

# 更新依賴
npm update
```

### 2. 安全更新
```bash
# 檢查安全漏洞
npm audit

# 修復漏洞
npm audit fix
```

### 3. 定期備份
設置定期備份腳本：
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
npx convex export --output "backup-$DATE.jsonl"
```

## 擴展計劃

### 1. 水平擴展
- Vercel 自動處理前端擴展
- Convex 自動處理後端擴展

### 2. 功能擴展
- 添加更多數據源
- 實施高級分析功能
- 集成第三方服務

### 3. 性能監控
- 設置性能指標監控
- 實施用戶體驗追蹤
- 優化關鍵路徑