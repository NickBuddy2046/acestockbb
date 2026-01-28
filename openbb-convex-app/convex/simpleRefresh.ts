import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// 簡化版本的數據刷新，用於測試
export const testRefresh = action({
  args: {},
  handler: async (ctx) => {
    try {
      // 簡單測試：只刷新一支股票
      const symbol = "AAPL";
      const today = new Date().toISOString().split('T')[0];
      
      // 模擬數據
      const mockData = {
        symbol: symbol,
        companyName: "Apple Inc.",
        price: 150.25,
        change: 2.15,
        changePercent: 1.45,
        volume: 50000000,
        date: today,
        lastUpdated: Date.now(),
      };
      
      // 存儲到數據庫
      await ctx.runMutation("simpleRefresh:storeMockData", mockData);
      
      return {
        success: true,
        message: `測試刷新成功: ${symbol}`,
        symbolsUpdated: 1,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        message: `測試刷新失敗: ${errorMessage}`,
        symbolsUpdated: 0,
      };
    }
  },
});

// 存儲模擬數據
export const storeMockData = mutation({
  args: {
    symbol: v.string(),
    companyName: v.string(),
    price: v.number(),
    change: v.number(),
    changePercent: v.number(),
    volume: v.number(),
    date: v.string(),
    lastUpdated: v.number(),
  },
  handler: async (ctx, args) => {
    // 檢查今日是否已有數據
    const existing = await ctx.db
      .query("dailyStockData")
      .withIndex("by_symbol_date", (q) => q.eq("symbol", args.symbol).eq("date", args.date))
      .first();
    
    if (existing) {
      // 更新現有數據
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      // 創建新數據
      return await ctx.db.insert("dailyStockData", args);
    }
  },
});

// 獲取測試數據
export const getTestData = query({
  args: { symbol: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    const data = await ctx.db
      .query("dailyStockData")
      .withIndex("by_symbol_date", (q) => q.eq("symbol", args.symbol).eq("date", today))
      .first();
    
    return data;
  },
});