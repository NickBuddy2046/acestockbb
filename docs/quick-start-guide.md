# 快速上手指南

## 🚀 5分鐘快速開始

### 前置檢查
```bash
# 檢查 Node.js 版本 (需要 18+)
node --version

# 檢查 npm 版本
npm --version

# 檢查 Git 版本
git --version
```

### 一鍵啟動
```bash
# 1. 克隆項目
git clone <your-repo-url>
cd openbb-web-app

# 2. 運行設置腳本
chmod +x scripts/setup.sh
./scripts/setup.sh

# 3. 啟動開發環境
chmod +x scripts/dev.sh
./scripts/dev.sh
```

## 📋 核心概念速覽

### React Hooks 必知
```typescript
// 1. 狀態管理
const [count, setCount] = useState(0)

// 2. 副作用處理
useEffect(() => {
  // 組件掛載時執行
  fetchData()
}, []) // 空依賴數組

// 3. 自定義 Hook
const useStockData = (symbol: string) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchStockData(symbol).then(setData)
  }, [symbol])
  
  return { data, loading }
}
```

### Convex 基礎操作
```typescript
// 1. 查詢數據 (只讀)
export const getWatchlist = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("watchlists").collect()
  }
})

// 2. 修改數據 (寫入)
export const addStock = mutation({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("watchlists", {
      symbol: args.symbol,
      userId: "current-user-id"
    })
  }
})

// 3. 在組件中使用
const watchlist = useQuery(api.watchlists.getWatchlist)
const addStock = useMutation(api.watchlists.addStock)
```

### TypeScript 類型定義
```typescript
// 1. 基礎接口
interface Stock {
  symbol: string
  price: number
  change: number
  changePercent: number
}

// 2. 組件 Props
interface StockCardProps {
  stock: Stock
  onClick?: (symbol: string) => void
}

// 3. API 響應類型
interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}
```

## 🎯 30分鐘實戰教程

### 步驟 1: 創建股票卡片組件 (10分鐘)
```typescript
// components/StockCard.tsx
interface StockCardProps {
  symbol: string
  price: number
  change: number
}

export const StockCard: React.FC<StockCardProps> = ({ 
  symbol, 
  price, 
  change 
}) => {
  const isPositive = change >= 0
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-bold text-lg">{symbol}</h3>
      <p className="text-2xl font-semibold">${price.toFixed(2)}</p>
      <p className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? '+' : ''}{change.toFixed(2)}
      </p>
    </div>
  )
}
```

### 步驟 2: 創建 Convex 函數 (10分鐘)
```typescript
// convex/stocks.ts
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const getStocks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stocks").collect()
  }
})

export const addStock = mutation({
  args: {
    symbol: v.string(),
    price: v.number(),
    change: v.number()
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("stocks", args)
  }
})
```

### 步驟 3: 在頁面中使用 (10分鐘)
```typescript
// app/page.tsx
'use client'
import { useQuery, useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { StockCard } from "./components/StockCard"

export default function Home() {
  const stocks = useQuery(api.stocks.getStocks)
  const addStock = useMutation(api.stocks.addStock)
  
  const handleAddStock = () => {
    addStock({
      symbol: "AAPL",
      price: 150.00,
      change: 2.50
    })
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">股票監控</h1>
      
      <button 
        onClick={handleAddStock}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        添加股票
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stocks?.map((stock) => (
          <StockCard
            key={stock._id}
            symbol={stock.symbol}
            price={stock.price}
            change={stock.change}
          />
        ))}
      </div>
    </div>
  )
}
```

## 🔧 常用代碼片段

### 1. 數據獲取 Hook
```typescript
const useStockPrice = (symbol: string) => {
  const [price, setPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/stocks/${symbol}`)
        const data = await response.json()
        setPrice(data.price)
      } catch (err) {
        setError('獲取價格失敗')
      } finally {
        setLoading(false)
      }
    }
    
    fetchPrice()
  }, [symbol])
  
  return { price, loading, error }
}
```

### 2. 表單處理
```typescript
const StockForm = () => {
  const [symbol, setSymbol] = useState('')
  const addStock = useMutation(api.stocks.addStock)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (symbol.trim()) {
      await addStock({ symbol: symbol.toUpperCase() })
      setSymbol('')
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={symbol}
        onChange={(e) => setSymbol(e.target.value)}
        placeholder="輸入股票代碼"
        className="border rounded px-3 py-2"
      />
      <button 
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        添加
      </button>
    </form>
  )
}
```

### 3. 錯誤處理
```typescript
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('應用錯誤:', error)
      setHasError(true)
    }
    
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  if (hasError) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold text-red-600">出現錯誤</h2>
        <button 
          onClick={() => setHasError(false)}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
        >
          重試
        </button>
      </div>
    )
  }
  
  return <>{children}</>
}
```

## 🎨 樣式快速參考

### Tailwind CSS 常用類
```css
/* 布局 */
.container { @apply mx-auto px-4; }
.grid-cols-3 { display: grid; grid-template-columns: repeat(3, 1fr); }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }

/* 間距 */
.p-4 { padding: 1rem; }
.m-4 { margin: 1rem; }
.gap-4 { gap: 1rem; }

/* 顏色 */
.bg-blue-500 { background-color: #3b82f6; }
.text-white { color: #ffffff; }
.text-red-600 { color: #dc2626; }
.text-green-600 { color: #16a34a; }

/* 字體 */
.text-xl { font-size: 1.25rem; }
.font-bold { font-weight: 700; }

/* 邊框和圓角 */
.border { border-width: 1px; }
.rounded { border-radius: 0.25rem; }
.shadow { box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
```

### 響應式設計
```css
/* 移動端優先 */
.grid-cols-1        /* 默認 1 列 */
.md:grid-cols-2     /* 中等屏幕 2 列 */
.lg:grid-cols-3     /* 大屏幕 3 列 */

/* 斷點 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
```

## 🐛 常見問題解決

### 1. Convex 連接問題
```bash
# 檢查環境變量
echo $NEXT_PUBLIC_CONVEX_URL

# 重新啟動 Convex
npx convex dev --once
```

### 2. TypeScript 錯誤
```typescript
// 類型斷言
const data = response.data as StockData[]

// 可選鏈
const price = stock?.price ?? 0

// 類型守衛
const isStock = (obj: any): obj is Stock => {
  return obj && typeof obj.symbol === 'string'
}
```

### 3. 樣式不生效
```bash
# 檢查 Tailwind 配置
npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css --watch

# 清除緩存
rm -rf .next
npm run dev
```

## 📚 下一步學習

### 立即行動
1. **完成 30 分鐘教程** - 動手實踐基礎功能
2. **閱讀官方文檔** - 深入理解核心概念
3. **加入社區** - 獲取幫助和靈感

### 進階學習路徑
1. **第一週**: 掌握 React Hooks 和 TypeScript
2. **第二週**: 深入 Next.js 和 Convex
3. **第三週**: 實現完整的股票監控功能
4. **第四週**: 添加圖表和高級功能

### 推薦資源
- [React 官方教程](https://react.dev/learn)
- [Next.js 學習課程](https://nextjs.org/learn)
- [Convex 快速開始](https://docs.convex.dev/quickstart)
- [TypeScript 手冊](https://www.typescriptlang.org/docs/)

---

**記住**: 最好的學習方式就是動手實踐。現在就開始創建你的第一個組件吧！