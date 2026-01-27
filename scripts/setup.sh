# 項目創建腳本

這個腳本會自動創建一個基於 Convex 的 OpenBB Web App 項目。

echo "🚀 創建 OpenBB Web App (Convex 版本)..."

# 創建 Next.js 項目
npx create-next-app@latest openbb-convex-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd openbb-convex-app

# 安裝 Convex 和核心依賴
echo "📦 安裝 Convex 和相關依賴..."
npm install convex

# 安裝認證相關
npm install @convex-dev/auth
npm install @auth/core

# 安裝 UI 和圖表庫
npm install recharts lucide-react 
npm install @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-toast @radix-ui/react-tabs

# 安裝工具庫
npm install date-fns clsx tailwind-merge
npm install class-variance-authority

# 安裝開發依賴
npm install -D @types/node

# 初始化 Convex
echo "🔧 初始化 Convex..."
npx convex dev --once

# 創建基本目錄結構
echo "📁 創建目錄結構..."
mkdir -p src/components/{ui,charts,dashboard,forms,auth}
mkdir -p src/lib
mkdir -p src/hooks
mkdir -p src/types

# 創建基本的 Convex 函數文件
echo "📝 創建 Convex 函數文件..."

# Schema
cat > convex/schema.ts << 'EOF'
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

  stockData: defineTable({
    symbol: v.string(),
    data: v.any(),
    interval: v.string(),
    lastUpdated: v.number(),
  }).index("by_symbol_interval", ["symbol", "interval"]),
})
EOF

# 基本用戶函數
cat > convex/users.ts << 'EOF'
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

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
EOF

# 監控列表函數
cat > convex/watchlists.ts << 'EOF'
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
EOF

# 創建環境變量模板
cat > .env.local.example << 'EOF'
# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# OpenBB API
OPENBB_API_URL=http://localhost:8000

# Auth (可選)
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
EOF

# 創建 Convex 客戶端配置
cat > src/lib/convex.ts << 'EOF'
import { ConvexReactClient } from "convex/react"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export { convex }
EOF

# 更新 layout.tsx
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ConvexProvider } from "convex/react"
import { convex } from "@/lib/convex"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OpenBB Web App",
  description: "基於 OpenBB 的金融數據分析平台",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className={inter.className}>
        <ConvexProvider client={convex}>
          {children}
        </ConvexProvider>
      </body>
    </html>
  )
}
EOF

# 創建基本的首頁
cat > src/app/page.tsx << 'EOF'
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OpenBB Web App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            基於 OpenBB 的現代化金融數據分析平台
          </p>
          <div className="space-x-4">
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              進入儀表板
            </Link>
            <Link
              href="/auth/login"
              className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              登錄
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
EOF

echo "✅ 項目創建完成！"
echo ""
echo "下一步："
echo "1. cd openbb-convex-app"
echo "2. 複製 .env.local.example 為 .env.local 並填入配置"
echo "3. 運行 npx convex dev 啟動 Convex 開發服務器"
echo "4. 在另一個終端運行 npm run dev 啟動前端"
echo ""
echo "🔧 Convex 配置："
echo "- 訪問 https://dashboard.convex.dev 創建項目"
echo "- 獲取 CONVEX_URL 和 DEPLOY_KEY"
echo "- 配置認證提供商（可選）"
echo ""
echo "📚 文檔："
echo "- Convex: https://docs.convex.dev"
echo "- OpenBB: https://docs.openbb.co"