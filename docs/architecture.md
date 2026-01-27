# 系統架構設計

## 技術棧
- **前端**: Next.js 14 + TypeScript + Tailwind CSS
- **後端**: Convex (實時數據庫 + 函數)
- **認證**: Convex Auth (支持多種提供商)
- **部署**: Vercel (前端) + Convex (後端)
- **實時功能**: Convex Subscriptions

## Convex 的核心優勢

### 1. **實時同步**
- 自動實時數據同步
- 無需手動管理 WebSocket
- 樂觀更新支持

### 2. **類型安全**
- 端到端 TypeScript 支持
- 自動生成類型定義
- 編譯時類型檢查

### 3. **簡化開發**
- 無需寫 SQL
- 內建緩存和優化
- 自動處理並發

### 4. **強大的查詢**
- 響應式查詢
- 自動重新獲取
- 智能緩存

## 項目結構
```
openbb-web-app/
├── convex/                     # Convex 後端
│   ├── _generated/            # 自動生成的類型
│   ├── auth.config.ts         # 認證配置
│   ├── schema.ts              # 數據庫模式
│   ├── users.ts               # 用戶相關函數
│   ├── portfolios.ts          # 投資組合函數
│   ├── watchlists.ts          # 監控列表函數
│   ├── stocks.ts              # 股票數據函數
│   └── http.ts                # HTTP 動作
├── src/                       # Next.js 前端
│   ├── app/                   # App Router
│   │   ├── (auth)/           # 認證頁面
│   │   ├── dashboard/        # 儀表板
│   │   ├── portfolio/        # 投資組合
│   │   └── layout.tsx
│   ├── components/           # React 組件
│   │   ├── ui/              # 基礎 UI
│   │   ├── charts/          # 圖表組件
│   │   └── dashboard/       # 儀表板組件
│   ├── lib/                 # 工具庫
│   │   ├── convex.ts        # Convex 客戶端
│   │   ├── openbb.ts        # OpenBB API
│   │   └── utils.ts         # 工具函數
│   └── hooks/               # 自定義 Hooks
├── package.json
├── convex.json              # Convex 配置
├── next.config.js
└── tailwind.config.js
```

## 核心功能對比

| 功能 | Supabase | Convex |
|------|----------|---------|
| 實時數據 | Realtime subscriptions | 自動響應式查詢 |
| 認證 | Supabase Auth | Convex Auth |
| 數據庫 | PostgreSQL + RLS | 文檔數據庫 + 函數級權限 |
| API | REST + GraphQL | 類型安全函數調用 |
| 文件存儲 | Supabase Storage | Convex File Storage |
| 邊緣函數 | Edge Functions | Convex Actions |

## 開發體驗優勢

### 1. **無需手動狀態管理**
```typescript
// Convex 自動處理實時更新
const watchlist = useQuery(api.watchlists.getMyWatchlist)
// 數據變化時自動重新渲染，無需手動刷新
```

### 2. **類型安全的 API 調用**
```typescript
// 編譯時類型檢查
const result = await addToWatchlist({ 
  symbol: "AAPL", 
  targetPrice: 150.00 
})
```

### 3. **樂觀更新**
```typescript
// 立即更新 UI，後台同步
const addStock = useMutation(api.watchlists.add)
await addStock({ symbol: "AAPL" }) // UI 立即更新
```