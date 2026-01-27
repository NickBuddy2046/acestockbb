# 開發環境設置指南

## 系統要求

- Node.js 18+ 
- npm 或 yarn
- Git

## 快速設置

### 1. 使用自動化腳本（推薦）

```bash
# 克隆項目
git clone <repository-url>
cd openbb-web-app

# 運行設置腳本
chmod +x convex-setup-script.sh
./convex-setup-script.sh
```

### 2. 手動設置

#### 2.1 創建 Next.js 項目
```bash
npx create-next-app@latest openbb-convex-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd openbb-convex-app
```

#### 2.2 安裝依賴
```bash
# Convex 核心
npm install convex @convex-dev/auth @auth/core

# UI 組件
npm install recharts lucide-react 
npm install @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast @radix-ui/react-tabs

# 工具庫
npm install date-fns clsx tailwind-merge class-variance-authority

# 開發依賴
npm install -D @types/node
```

#### 2.3 初始化 Convex
```bash
npx convex dev --once
```

## 環境配置

### 1. Convex 項目設置

1. 訪問 [Convex Dashboard](https://dashboard.convex.dev)
2. 創建新項目
3. 獲取項目 URL 和部署密鑰

### 2. 環境變量配置

創建 `.env.local` 文件：

```bash
# Convex 配置
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# OpenBB API 配置
OPENBB_API_URL=http://localhost:8000

# 認證配置（可選）
AUTH0_DOMAIN=your-auth0-domain
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### 3. OpenBB 後端設置

#### 3.1 安裝 OpenBB Platform
```bash
pip install "openbb[all]"
```

#### 3.2 啟動 API 服務器
```bash
openbb-api
```

這將在 `http://localhost:8000` 啟動 FastAPI 服務器。

## 開發工作流

### 1. 啟動開發服務器

```bash
# 終端 1: 啟動 Convex 後端
npx convex dev

# 終端 2: 啟動 Next.js 前端
npm run dev
```

### 2. 數據庫管理

```bash
# 查看數據庫狀態
npx convex dashboard

# 重置數據庫（開發環境）
npx convex run clearAll
```

### 3. 部署

```bash
# 部署 Convex 後端
npx convex deploy

# 部署到 Vercel
vercel --prod
```

## 開發工具推薦

### VS Code 擴展
- TypeScript Importer
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter

### 瀏覽器工具
- React Developer Tools
- Convex Developer Tools

## 常見問題

### Q: Convex 函數調用失敗
A: 檢查環境變量配置，確保 `NEXT_PUBLIC_CONVEX_URL` 正確

### Q: OpenBB API 連接失敗
A: 確保 OpenBB API 服務器正在運行，檢查 `OPENBB_API_URL` 配置

### Q: 認證問題
A: 檢查 Auth0 配置，確保回調 URL 正確設置

### Q: 樣式問題
A: 確保 Tailwind CSS 正確配置，檢查 `tailwind.config.js`

## 調試技巧

### 1. Convex 函數調試
```typescript
// 在 Convex 函數中添加日誌
console.log("Debug info:", data)
```

### 2. 前端調試
```typescript
// 使用 React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

### 3. 網絡請求調試
- 使用瀏覽器開發者工具的 Network 標籤
- 檢查 Convex 函數調用和 OpenBB API 請求

## 性能優化

### 1. 圖片優化
```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority
/>
```

### 2. 代碼分割
```typescript
import dynamic from 'next/dynamic'

const Chart = dynamic(() => import('./Chart'), {
  loading: () => <p>Loading...</p>,
})
```

### 3. 緩存策略
- 利用 Convex 自動緩存
- 使用 React Query 的 staleTime 配置
- 實施適當的數據重新驗證策略