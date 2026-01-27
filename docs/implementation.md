# 實施計劃與開發指南

## 階段 1: 項目初始化 (1-2 天)

### 1.1 創建 Next.js 項目
```bash
npx create-next-app@latest openbb-web-app --typescript --tailwind --eslint --app
cd openbb-web-app
```

### 1.2 安裝 Convex 和相關依賴
```bash
# 安裝 Convex
npm install convex

# 安裝 UI 和圖表庫
npm install recharts lucide-react @radix-ui/react-select @radix-ui/react-dialog
npm install date-fns clsx tailwind-merge

# 安裝認證相關
npm install @auth/core @convex-dev/auth

# 初始化 Convex
npx convex dev
```

### 1.3 項目結構設置
```bash
# Convex 會自動創建 convex/ 目錄
mkdir -p src/components/{ui,charts,dashboard,forms}
mkdir -p src/lib
mkdir -p src/hooks
```

## 階段 2: Convex 後端設置 (2-3 天)

### 2.1 數據庫模式定義
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.string(),
    image: v.optional(v.string()),
    apiKeys: v.optional(v.object({
      alphaVantage: v.optional(v.string()),
      polygon: v.optional(v.string()),
      fmp: v.optional(v.string()),
    })),
    preferences: v.optional(v.object({
      defaultInterval: v.optional(v.string()),
      theme: v.optional(v.string()),
    })),
  }).index("by_email", ["email"]),

  portfolios: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    totalValue: v.optional(v.number()),
    isDefault: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  holdings: defineTable({
    portfolioId: v.id("portfolios"),
    symbol: v.string(),
    companyName: v.optional(v.string()),
    quantity: v.number(),
    averageCost: v.optional(v.number()),
    currentPrice: v.optional(v.number()),
    purchaseDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  }).index("by_portfolio", ["portfolioId"])
    .index("by_symbol", ["symbol"]),

  watchlists: defineTable({
    userId: v.id("users"),
    symbol: v.string(),
    companyName: v.optional(v.string()),
    targetPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
    alertEnabled: v.optional(v.boolean()),
  }).index("by_user", ["userId"])
    .index("by_user_symbol", ["userId", "symbol"]),

  priceAlerts: defineTable({
    userId: v.id("users"),
    symbol: v.string(),
    alertType: v.union(v.literal("above"), v.literal("below")),
    targetPrice: v.number(),
    isActive: v.boolean(),
    triggeredAt: v.optional(v.number()),
  }).index("by_user", ["userId"])
    .index("by_symbol_active", ["symbol", "isActive"]),

  stockData: defineTable({
    symbol: v.string(),
    data: v.any(), // 存儲股票數據
    interval: v.string(),
    lastUpdated: v.number(),
  }).index("by_symbol_interval", ["symbol", "interval"]),
})
```

### 2.2 用戶管理函數
```typescript
// convex/users.ts
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first()

    if (existingUser) {
      return existingUser._id
    }

    return await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      image: args.image,
    })
  },
})

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()
  },
})

export const updateUserPreferences = mutation({
  args: {
    preferences: v.object({
      defaultInterval: v.optional(v.string()),
      theme: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user) throw new Error("User not found")

    await ctx.db.patch(user._id, {
      preferences: args.preferences,
    })
  },
})
```

### 2.3 監控列表函數
```typescript
// convex/watchlists.ts
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const getMyWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user) return []

    return await ctx.db
      .query("watchlists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()
  },
})

export const addToWatchlist = mutation({
  args: {
    symbol: v.string(),
    companyName: v.optional(v.string()),
    targetPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user) throw new Error("User not found")

    // 檢查是否已存在
    const existing = await ctx.db
      .query("watchlists")
      .withIndex("by_user_symbol", (q) => 
        q.eq("userId", user._id).eq("symbol", args.symbol.toUpperCase())
      )
      .first()

    if (existing) {
      throw new Error("Stock already in watchlist")
    }

    return await ctx.db.insert("watchlists", {
      userId: user._id,
      symbol: args.symbol.toUpperCase(),
      companyName: args.companyName,
      targetPrice: args.targetPrice,
      notes: args.notes,
      alertEnabled: false,
    })
  },
})

export const removeFromWatchlist = mutation({
  args: { id: v.id("watchlists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const watchlistItem = await ctx.db.get(args.id)
    if (!watchlistItem) throw new Error("Item not found")

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user || watchlistItem.userId !== user._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.delete(args.id)
  },
})

export const updateWatchlistItem = mutation({
  args: {
    id: v.id("watchlists"),
    targetPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
    alertEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Not authenticated")

    const watchlistItem = await ctx.db.get(args.id)
    if (!watchlistItem) throw new Error("Item not found")

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first()

    if (!user || watchlistItem.userId !== user._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(args.id, {
      targetPrice: args.targetPrice,
      notes: args.notes,
      alertEnabled: args.alertEnabled,
    })
  },
})
```

### 2.4 股票數據函數
```typescript
// convex/stocks.ts
import { action, query } from "./_generated/server"
import { v } from "convex/values"

export const getStockData = query({
  args: {
    symbol: v.string(),
    interval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interval = args.interval || "1d"
    
    // 查找緩存的數據
    const cached = await ctx.db
      .query("stockData")
      .withIndex("by_symbol_interval", (q) => 
        q.eq("symbol", args.symbol.toUpperCase()).eq("interval", interval)
      )
      .first()

    // 如果數據存在且不超過 5 分鐘，返回緩存數據
    if (cached && Date.now() - cached.lastUpdated < 5 * 60 * 1000) {
      return cached.data
    }

    return null // 需要通過 action 獲取新數據
  },
})

export const fetchStockData = action({
  args: {
    symbol: v.string(),
    interval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interval = args.interval || "1d"
    
    try {
      // 調用 OpenBB API
      const response = await fetch(
        `${process.env.OPENBB_API_URL}/api/v1/equity/price/historical?symbol=${args.symbol}&interval=${interval}&provider=yfinance`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // 更新緩存
      const existing = await ctx.db
        .query("stockData")
        .withIndex("by_symbol_interval", (q) => 
          q.eq("symbol", args.symbol.toUpperCase()).eq("interval", interval)
        )
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
          data: data.results,
          lastUpdated: Date.now(),
        })
      } else {
        await ctx.db.insert("stockData", {
          symbol: args.symbol.toUpperCase(),
          interval,
          data: data.results,
          lastUpdated: Date.now(),
        })
      }

      return data.results
    } catch (error) {
      console.error("Failed to fetch stock data:", error)
      throw new Error(`Failed to fetch data for ${args.symbol}`)
    }
  },
})
```

## 階段 3: 前端集成 (1-2 週)

### 3.1 Convex 客戶端設置
```typescript
// src/lib/convex.ts
import { ConvexProvider, ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export { convex }

// src/app/layout.tsx
import { ConvexProvider } from "convex/react"
import { convex } from "@/lib/convex"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body>
        <ConvexProvider client={convex}>
          {children}
        </ConvexProvider>
      </body>
    </html>
  )
}
```

### 3.2 認證設置
```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: process.env.AUTH0_DOMAIN,
      applicationId: process.env.AUTH0_CLIENT_ID,
    },
  ],
}
```

## 階段 4: 部署配置 (1 天)

### 4.1 環境變量
```bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
OPENBB_API_URL=http://localhost:8000
```

### 4.2 部署命令
```bash
# 部署 Convex 後端
npx convex deploy

# 部署到 Vercel
vercel --prod
```

## 成本對比

| 服務 | Convex | Supabase |
|------|--------|----------|
| 免費額度 | 1M 函數調用/月 | 500MB 數據庫 |
| 付費起點 | $25/月 | $25/月 |
| 實時功能 | 包含 | 包含 |
| 文件存儲 | 1GB 免費 | 1GB 免費 |

## Convex 的獨特優勢

1. **開發體驗**：無需寫 SQL，類型安全
2. **實時性能**：自動優化的實時查詢
3. **簡化架構**：函數即 API，無需額外路由
4. **樂觀更新**：更好的用戶體驗
5. **自動緩存**：智能緩存策略