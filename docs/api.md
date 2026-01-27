# API 文檔

## Convex 函數 API

### 用戶管理 (users.ts)

#### `getCurrentUser`
獲取當前登錄用戶信息

```typescript
const user = useQuery(api.users.getCurrentUser)
```

**返回值:**
```typescript
{
  _id: Id<"users">
  email: string
  name?: string
  image?: string
  apiKeys?: {
    alphaVantage?: string
    polygon?: string
    fmp?: string
  }
  preferences?: {
    defaultInterval?: string
    theme?: string
  }
}
```

#### `createUser`
創建新用戶

```typescript
const createUser = useMutation(api.users.createUser)
await createUser({
  email: "user@example.com",
  name: "John Doe",
  image: "https://example.com/avatar.jpg"
})
```

#### `updateUserPreferences`
更新用戶偏好設置

```typescript
const updatePreferences = useMutation(api.users.updateUserPreferences)
await updatePreferences({
  preferences: {
    defaultInterval: "1d",
    theme: "dark"
  }
})
```

### 監控列表 (watchlists.ts)

#### `getMyWatchlist`
獲取用戶的監控列表

```typescript
const watchlist = useQuery(api.watchlists.getMyWatchlist)
```

**返回值:**
```typescript
Array<{
  _id: Id<"watchlists">
  userId: Id<"users">
  symbol: string
  companyName?: string
  targetPrice?: number
  notes?: string
  alertEnabled?: boolean
}>
```

#### `addToWatchlist`
添加股票到監控列表

```typescript
const addToWatchlist = useMutation(api.watchlists.addToWatchlist)
await addToWatchlist({
  symbol: "AAPL",
  companyName: "Apple Inc.",
  targetPrice: 150.00,
  notes: "關注財報發布"
})
```

#### `removeFromWatchlist`
從監控列表移除股票

```typescript
const removeFromWatchlist = useMutation(api.watchlists.removeFromWatchlist)
await removeFromWatchlist({ id: watchlistItemId })
```

#### `updateWatchlistItem`
更新監控列表項目

```typescript
const updateItem = useMutation(api.watchlists.updateWatchlistItem)
await updateItem({
  id: watchlistItemId,
  targetPrice: 160.00,
  alertEnabled: true
})
```

### 投資組合 (portfolios.ts)

#### `getMyPortfolios`
獲取用戶的投資組合列表

```typescript
const portfolios = useQuery(api.portfolios.getMyPortfolios)
```

#### `createPortfolio`
創建新的投資組合

```typescript
const createPortfolio = useMutation(api.portfolios.createPortfolio)
await createPortfolio({
  name: "我的投資組合",
  description: "長期投資組合",
  isDefault: true
})
```

#### `getPortfolioHoldings`
獲取投資組合持倉

```typescript
const holdings = useQuery(api.portfolios.getPortfolioHoldings, {
  portfolioId: portfolioId
})
```

#### `addHolding`
添加持倉

```typescript
const addHolding = useMutation(api.portfolios.addHolding)
await addHolding({
  portfolioId: portfolioId,
  symbol: "AAPL",
  quantity: 100,
  averageCost: 145.50,
  purchaseDate: "2024-01-15"
})
```

### 股票數據 (stocks.ts)

#### `getStockData`
獲取股票數據（優先返回緩存）

```typescript
const stockData = useQuery(api.stocks.getStockData, {
  symbol: "AAPL",
  interval: "1d"
})
```

#### `fetchStockData`
強制獲取最新股票數據

```typescript
const fetchData = useAction(api.stocks.fetchStockData)
const data = await fetchData({
  symbol: "AAPL",
  interval: "1d"
})
```

## OpenBB API 集成

### 支持的數據提供商

| 提供商 | 免費額度 | API Key 需求 |
|--------|----------|--------------|
| Yahoo Finance | 無限制 | 不需要 |
| Alpha Vantage | 25 請求/天 | 需要 |
| Polygon | 5 請求/分鐘 | 需要 |
| FMP | 250 請求/天 | 需要 |

### 股票價格數據

#### 歷史價格
```typescript
// 通過 Convex Action 調用
const data = await fetchStockData({
  symbol: "AAPL",
  interval: "1d" // 1m, 5m, 15m, 30m, 1h, 1d, 1W, 1M
})
```

**返回格式:**
```typescript
Array<{
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}>
```

#### 實時價格
```typescript
// 獲取最新價格（最近的收盤價）
const latestData = stockData?.[stockData.length - 1]
const currentPrice = latestData?.close
```

### 公司新聞

```typescript
// OpenBB API 調用示例
const response = await fetch(
  `${OPENBB_API_URL}/api/v1/news/company?symbol=AAPL&limit=10&provider=yfinance`
)
const newsData = await response.json()
```

**返回格式:**
```typescript
Array<{
  title: string
  url: string
  date: string
  text: string
  source?: string
}>
```

### 財務數據

#### 財務報表
```typescript
const response = await fetch(
  `${OPENBB_API_URL}/api/v1/equity/fundamental/income?symbol=AAPL&provider=yfinance`
)
```

#### 關鍵指標
```typescript
const response = await fetch(
  `${OPENBB_API_URL}/api/v1/equity/fundamental/metrics?symbol=AAPL&provider=yfinance`
)
```

## 錯誤處理

### Convex 錯誤處理

```typescript
// 在組件中處理錯誤
const { data, error, isLoading } = useQuery(api.watchlists.getMyWatchlist)

if (error) {
  return <div>錯誤: {error.message}</div>
}
```

### OpenBB API 錯誤處理

```typescript
// 在 Convex Action 中處理錯誤
export const fetchStockData = action({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(`${OPENBB_API_URL}/api/v1/...`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error("API 調用失敗:", error)
      throw new Error(`無法獲取 ${args.symbol} 的數據`)
    }
  }
})
```

## 緩存策略

### Convex 自動緩存
- Convex 自動緩存查詢結果
- 數據變更時自動失效緩存
- 支持樂觀更新

### 股票數據緩存
```typescript
// 在 stocks.ts 中實施的緩存邏輯
const cached = await ctx.db
  .query("stockData")
  .withIndex("by_symbol_interval", (q) => 
    q.eq("symbol", symbol).eq("interval", interval)
  )
  .first()

// 5分鐘內的數據視為有效
if (cached && Date.now() - cached.lastUpdated < 5 * 60 * 1000) {
  return cached.data
}
```

## 實時更新

### Convex 實時訂閱
```typescript
// 自動實時更新，無需額外配置
const watchlist = useQuery(api.watchlists.getMyWatchlist)
// 當數據庫中的監控列表發生變化時，組件會自動重新渲染
```

### 股票價格實時更新
```typescript
// 使用定時器定期更新股票數據
useEffect(() => {
  const interval = setInterval(() => {
    fetchStockData({ symbol, interval: "1d" })
  }, 60000) // 每分鐘更新一次

  return () => clearInterval(interval)
}, [symbol])
```

## 認證 API

### Convex Auth 集成
```typescript
// 獲取當前用戶身份
const identity = await ctx.auth.getUserIdentity()

// 檢查用戶是否已認證
if (!identity) {
  throw new Error("未認證")
}
```

### 權限控制
```typescript
// 確保用戶只能訪問自己的數據
const user = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", identity.email!))
  .first()

if (!user || watchlistItem.userId !== user._id) {
  throw new Error("無權限")
}
```