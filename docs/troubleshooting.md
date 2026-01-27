# 故障排除指南

## 🚨 常見問題及解決方案

### 環境配置問題

#### 1. Node.js 版本不兼容
**問題**: `Error: Node.js version 16.x is not supported`

**解決方案**:
```bash
# 檢查當前版本
node --version

# 使用 nvm 安裝 Node.js 18+
nvm install 18
nvm use 18

# 或直接從官網下載安裝
# https://nodejs.org/
```

#### 2. npm 權限問題
**問題**: `EACCES: permission denied`

**解決方案**:
```bash
# 方法 1: 使用 npx
npx create-next-app@latest

# 方法 2: 修改 npm 全局目錄
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# 方法 3: 使用 yarn
npm install -g yarn
yarn create next-app
```

### Convex 相關問題

#### 1. Convex URL 未設置
**問題**: `ConvexError: NEXT_PUBLIC_CONVEX_URL environment variable not set`

**解決方案**:
```bash
# 1. 檢查 .env.local 文件
cat .env.local

# 2. 確保包含正確的 URL
echo "NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud" >> .env.local

# 3. 重啟開發服務器
npm run dev
```

#### 2. Convex 函數調用失敗
**問題**: `ConvexError: Function not found`

**解決方案**:
```typescript
// 1. 檢查函數導出
// convex/stocks.ts
export const getStocks = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("stocks").collect()
  }
})

// 2. 檢查 API 路徑
import { api } from "../convex/_generated/api"
const stocks = useQuery(api.stocks.getStocks) // 確保路徑正確

// 3. 重新生成類型
npx convex dev --once
```

#### 3. 認證問題
**問題**: `ConvexError: Unauthenticated`

**解決方案**:
```typescript
// 1. 檢查認證狀態
const identity = await ctx.auth.getUserIdentity()
if (!identity) {
  throw new Error("需要登錄")
}

// 2. 在組件中檢查登錄狀態
const { isLoading, isAuthenticated } = useConvexAuth()

if (isLoading) return <div>載入中...</div>
if (!isAuthenticated) return <div>請先登錄</div>
```

### Next.js 相關問題

#### 1. 路由問題
**問題**: `404 - This page could not be found`

**解決方案**:
```bash
# 1. 檢查文件結構 (App Router)
app/
├── page.tsx          # /
├── about/
│   └── page.tsx      # /about
└── dashboard/
    └── page.tsx      # /dashboard

# 2. 檢查文件命名
# 正確: page.tsx, layout.tsx, loading.tsx
# 錯誤: index.tsx, _app.tsx (這些是 Pages Router)
```

#### 2. 樣式不生效
**問題**: Tailwind CSS 樣式沒有應用

**解決方案**:
```javascript
// 1. 檢查 tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ...
}

// 2. 檢查 globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

// 3. 重新構建
rm -rf .next
npm run dev
```

#### 3. 服務端渲染錯誤
**問題**: `Hydration failed because the initial UI does not match`

**解決方案**:
```typescript
// 1. 使用 useEffect 處理客戶端專用邏輯
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) return null

// 2. 使用動態導入
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
)
```

### TypeScript 相關問題

#### 1. 類型錯誤
**問題**: `Type 'string | undefined' is not assignable to type 'string'`

**解決方案**:
```typescript
// 1. 使用可選鏈和空值合併
const symbol = stock?.symbol ?? ''

// 2. 類型守衛
if (stock && stock.symbol) {
  // 這裡 stock.symbol 確定是 string
}

// 3. 類型斷言 (謹慎使用)
const symbol = stock.symbol as string

// 4. 非空斷言 (確定不為空時使用)
const symbol = stock.symbol!
```

#### 2. 模塊導入問題
**問題**: `Cannot find module '@/components/StockCard'`

**解決方案**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// 或使用相對路徑
import { StockCard } from '../components/StockCard'
```

### 數據獲取問題

#### 1. API 調用失敗
**問題**: `Failed to fetch data from OpenBB API`

**解決方案**:
```typescript
// 1. 檢查 API URL
const OPENBB_API_URL = process.env.OPENBB_API_URL || 'http://localhost:8000'

// 2. 添加錯誤處理
const fetchStockData = async (symbol: string) => {
  try {
    const response = await fetch(`${OPENBB_API_URL}/api/v1/equity/price/historical?symbol=${symbol}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API 調用失敗:', error)
    throw new Error(`無法獲取 ${symbol} 的數據`)
  }
}

// 3. 檢查 CORS 設置
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/openbb/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ]
  },
}
```

#### 2. 數據格式問題
**問題**: `Cannot read property 'close' of undefined`

**解決方案**:
```typescript
// 1. 數據驗證
const validateStockData = (data: any): data is StockData => {
  return data && 
         typeof data.close === 'number' &&
         typeof data.open === 'number'
}

// 2. 安全訪問
const currentPrice = stockData?.[stockData.length - 1]?.close ?? 0

// 3. 默認值處理
const formatPrice = (price: number | undefined) => {
  return price ? `$${price.toFixed(2)}` : 'N/A'
}
```

### 性能問題

#### 1. 組件重複渲染
**問題**: 組件頻繁重新渲染導致性能下降

**解決方案**:
```typescript
// 1. 使用 React.memo
const StockCard = React.memo(({ stock }: StockCardProps) => {
  return <div>{/* 組件內容 */}</div>
})

// 2. 使用 useMemo
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data)
}, [data])

// 3. 使用 useCallback
const handleClick = useCallback((symbol: string) => {
  onStockSelect(symbol)
}, [onStockSelect])
```

#### 2. 內存洩漏
**問題**: 組件卸載後仍有異步操作

**解決方案**:
```typescript
useEffect(() => {
  let cancelled = false
  
  const fetchData = async () => {
    const data = await api.getData()
    if (!cancelled) {
      setData(data)
    }
  }
  
  fetchData()
  
  return () => {
    cancelled = true
  }
}, [])
```

## 🔧 調試工具和技巧

### 1. 瀏覽器開發者工具
```javascript
// Console 調試
console.log('數據:', data)
console.table(stockList) // 表格形式顯示數組
console.time('API 調用') // 開始計時
console.timeEnd('API 調用') // 結束計時

// 斷點調試
debugger; // 在此處暫停執行
```

### 2. React Developer Tools
- 安裝瀏覽器擴展
- 檢查組件樹
- 查看 Props 和 State
- 性能分析

### 3. Convex Dashboard
```bash
# 打開 Convex 控制台
npx convex dashboard

# 查看函數日誌
# 在 Dashboard 中查看 Logs 標籤
```

### 4. 網絡請求調試
```typescript
// 攔截 fetch 請求
const originalFetch = window.fetch
window.fetch = (...args) => {
  console.log('Fetch 請求:', args)
  return originalFetch(...args)
}
```

## 📋 問題排查清單

### 環境檢查
- [ ] Node.js 版本 >= 18
- [ ] npm/yarn 可正常使用
- [ ] Git 已配置
- [ ] VS Code 已安裝推薦擴展

### 項目配置檢查
- [ ] package.json 依賴完整
- [ ] .env.local 環境變量正確
- [ ] tsconfig.json 路徑配置
- [ ] tailwind.config.js 內容路徑

### Convex 檢查
- [ ] Convex 項目已創建
- [ ] 函數正確導出
- [ ] 數據庫模式定義
- [ ] 認證配置正確

### 代碼檢查
- [ ] 導入路徑正確
- [ ] 類型定義完整
- [ ] 錯誤處理到位
- [ ] 異步操作正確

## 🆘 獲取幫助

### 官方資源
- [Next.js 討論區](https://github.com/vercel/next.js/discussions)
- [Convex Discord](https://discord.gg/convex)
- [React 社區](https://reactjs.org/community/support.html)

### 中文社區
- [掘金](https://juejin.cn/)
- [思否](https://segmentfault.com/)
- [V2EX](https://www.v2ex.com/)

### 提問技巧
1. **描述問題**: 清楚說明遇到的問題
2. **提供代碼**: 包含相關的代碼片段
3. **錯誤信息**: 完整的錯誤堆棧
4. **環境信息**: 操作系統、Node.js 版本等
5. **重現步驟**: 如何重現問題

### 問題模板
```markdown
## 問題描述
簡要描述遇到的問題

## 環境信息
- 操作系統: Windows 11
- Node.js: v18.17.0
- Next.js: 14.0.0
- Convex: 1.5.0

## 重現步驟
1. 執行 npm run dev
2. 訪問 /dashboard
3. 點擊添加股票按鈕
4. 出現錯誤

## 錯誤信息
```
ConvexError: Function not found: api.stocks.addStock
```

## 相關代碼
[粘貼相關代碼]

## 嘗試過的解決方案
- 重啟開發服務器
- 清除 .next 緩存
```

---

**記住**: 遇到問題是學習過程的一部分，保持耐心，善用搜索引擎和社區資源！