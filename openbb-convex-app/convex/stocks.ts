import { action, query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getStockData = query({
  args: {
    symbol: v.string(),
    interval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const interval = args.interval || "1d";
    
    // 查找緩存的數據
    const cached = await ctx.db
      .query("stockData")
      .withIndex("by_symbol_interval", (q) => 
        q.eq("symbol", args.symbol.toUpperCase()).eq("interval", interval)
      )
      .first();

    // 如果數據存在且不超過 5 分鐘，返回緩存數據
    if (cached && Date.now() - cached.lastUpdated < 5 * 60 * 1000) {
      return cached.data;
    }

    return null; // 需要通過 action 獲取新數據
  },
});

// 為了演示，創建一個返回模擬數據的函數
export const getMockStockData = query({
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    // 根據股票代碼設置基礎價格
    let basePrice = 100;
    switch (args.symbol.toUpperCase()) {
      case 'AAPL':
        basePrice = 150;
        break;
      case 'GOOGL':
        basePrice = 2750;
        break;
      case 'MSFT':
        basePrice = 310;
        break;
      case 'TSLA':
        basePrice = 245;
        break;
      default:
        basePrice = 100;
    }
    
    const data = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // 生成更真實的價格變化
      const variation = (Math.random() - 0.5) * (basePrice * 0.05); // 5% 變化範圍
      const price = Math.max(basePrice + variation, basePrice * 0.8); // 確保價格不會太低
      
      data.push({
        date: date.toISOString(),
        close: Math.round(price * 100) / 100, // 保留兩位小數
      });
    }
    
    return data;
  },
});

// 使用 mutation 而不是 action 來訪問數據庫
export const updateStockData = mutation({
  args: {
    symbol: v.string(),
    interval: v.optional(v.string()),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const interval = args.interval || "1d";
    
    // 更新緩存
    const existing = await ctx.db
      .query("stockData")
      .withIndex("by_symbol_interval", (q) => 
        q.eq("symbol", args.symbol.toUpperCase()).eq("interval", interval)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert("stockData", {
        symbol: args.symbol.toUpperCase(),
        interval,
        data: args.data,
        lastUpdated: Date.now(),
      });
    }

    return args.data;
  },
});

export const fetchStockData = action({
  args: {
    symbol: v.string(),
    interval: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // 這裡將來會調用 OpenBB API
      // 現在先返回模擬數據
      const mockData = [];
      const basePrice = Math.random() * 200 + 50;
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const variation = (Math.random() - 0.5) * 10;
        const price = Math.max(basePrice + variation, 10);
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          open: price + (Math.random() - 0.5) * 2,
          high: price + Math.random() * 3,
          low: price - Math.random() * 3,
          close: price,
          volume: Math.floor(Math.random() * 1000000) + 100000,
        });
      }

      return mockData;
    } catch (error) {
      console.error("Failed to fetch stock data:", error);
      throw new Error(`Failed to fetch data for ${args.symbol}`);
    }
  },
});