import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";

// 預定義的股票列表 - 可以根據需要擴展
const STOCK_SYMBOLS = [
  // 熱門美股
  'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX',
  // 科技股
  'AMD', 'INTC', 'CRM', 'ADBE', 'PYPL', 'ORCL', 'IBM',
  // 其他熱門股
  'BABA', 'COIN', 'SQ', 'HOOD', 'PLTR', 'RIVN', 'LCID', 'SOFI',
  // 傳統股票
  'GE', 'F', 'T', 'VZ', 'XOM', 'CVX', 'JPM', 'BAC',
];

// 獲取今日股票數據
export const getTodayStockData = query({
  args: { symbols: v.optional(v.array(v.string())) },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    const symbols = args.symbols || STOCK_SYMBOLS;
    
    const stockData = [];
    
    for (const symbol of symbols) {
      const data = await ctx.db
        .query("dailyStockData")
        .withIndex("by_symbol_date", (q) => q.eq("symbol", symbol).eq("date", today))
        .first();
      
      if (data) {
        stockData.push(data);
      }
    }
    
    return stockData;
  },
});

// 獲取單個股票的今日數據
export const getStockData = query({
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

// 獲取股票的歷史數據 (用於圖表)
export const getHistoricalData = query({
  args: { symbol: v.string(), days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const days = args.days || 30;
    
    const data = await ctx.db
      .query("historicalPrices")
      .withIndex("by_symbol", (q) => q.eq("symbol", args.symbol))
      .order("desc")
      .take(days);
    
    return data.reverse(); // 按日期正序返回
  },
});

// 檢查今日是否已刷新數據
export const checkTodayRefreshStatus = query({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    const log = await ctx.db
      .query("dataRefreshLog")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    
    return log;
  },
});

// 存儲股票數據到數據庫
export const storeDailyStockData = mutation({
  args: {
    symbol: v.string(),
    companyName: v.string(),
    price: v.number(),
    change: v.number(),
    changePercent: v.number(),
    volume: v.optional(v.number()),
    marketCap: v.optional(v.number()),
    high: v.optional(v.number()),
    low: v.optional(v.number()),
    open: v.optional(v.number()),
    previousClose: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // 檢查今日是否已有數據
    const existing = await ctx.db
      .query("dailyStockData")
      .withIndex("by_symbol_date", (q) => q.eq("symbol", args.symbol).eq("date", today))
      .first();
    
    const data = {
      symbol: args.symbol,
      companyName: args.companyName,
      price: args.price,
      change: args.change,
      changePercent: args.changePercent,
      volume: args.volume,
      marketCap: args.marketCap,
      high: args.high,
      low: args.low,
      open: args.open,
      previousClose: args.previousClose,
      date: today,
      lastUpdated: Date.now(),
    };
    
    if (existing) {
      // 更新現有數據
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      // 創建新數據
      return await ctx.db.insert("dailyStockData", data);
    }
  },
});

// 存儲歷史價格數據
export const storeHistoricalData = mutation({
  args: {
    symbol: v.string(),
    historicalData: v.array(v.object({
      date: v.string(),
      open: v.number(),
      high: v.number(),
      low: v.number(),
      close: v.number(),
      volume: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const dayData of args.historicalData) {
      // 檢查是否已存在
      const existing = await ctx.db
        .query("historicalPrices")
        .withIndex("by_symbol_date", (q) => q.eq("symbol", args.symbol).eq("date", dayData.date))
        .first();
      
      const data = {
        symbol: args.symbol,
        date: dayData.date,
        open: dayData.open,
        high: dayData.high,
        low: dayData.low,
        close: dayData.close,
        volume: dayData.volume,
        lastUpdated: Date.now(),
      };
      
      if (existing) {
        await ctx.db.patch(existing._id, data);
        results.push(existing._id);
      } else {
        const id = await ctx.db.insert("historicalPrices", data);
        results.push(id);
      }
    }
    
    return results;
  },
});

// 記錄數據刷新日誌
export const logDataRefresh = mutation({
  args: {
    status: v.string(),
    symbolsUpdated: v.number(),
    errorMessage: v.optional(v.string()),
    endTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    // 檢查今日是否已有日誌
    const existing = await ctx.db
      .query("dataRefreshLog")
      .withIndex("by_date", (q) => q.eq("date", today))
      .first();
    
    const data = {
      date: today,
      status: args.status,
      symbolsUpdated: args.symbolsUpdated,
      errorMessage: args.errorMessage,
      startTime: existing?.startTime || Date.now(),
      endTime: args.endTime || Date.now(),
    };
    
    if (existing) {
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      return await ctx.db.insert("dataRefreshLog", data);
    }
  },
});

// Action: 執行每日數據刷新
export const performDailyRefresh = action({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split('T')[0];
    
    // 檢查今日是否已刷新
    const existingLog = await ctx.runQuery("dailyDataRefresh:checkTodayRefreshStatus");
    if (existingLog && existingLog.status === "success") {
      return { 
        success: true, 
        message: "今日數據已刷新", 
        symbolsUpdated: existingLog.symbolsUpdated 
      };
    }
    
    // 開始刷新
    await ctx.runMutation("dailyDataRefresh:logDataRefresh", {
      status: "in_progress",
      symbolsUpdated: 0,
    });
    
    let successCount = 0;
    let errorMessage = "";
    
    try {
      // 批量獲取股票數據
      for (const symbol of STOCK_SYMBOLS) {
        try {
          // 調用外部 API 獲取數據
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stock/${symbol}`);
          
          if (response.ok) {
            const stockData = await response.json();
            
            // 存儲當日數據
            await ctx.runMutation("dailyDataRefresh:storeDailyStockData", {
              symbol: symbol,
              companyName: stockData.companyName || symbol,
              price: stockData.price,
              change: stockData.change || 0,
              changePercent: stockData.changePercent || 0,
              volume: stockData.volume,
              marketCap: stockData.marketCap,
              high: stockData.high,
              low: stockData.low,
              open: stockData.open,
              previousClose: stockData.previousClose,
            });
            
            // 獲取並存儲歷史數據
            const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/stock/${symbol}/history`);
            if (historyResponse.ok) {
              const historyData = await historyResponse.json();
              if (historyData.length > 0) {
                await ctx.runMutation("dailyDataRefresh:storeHistoricalData", {
                  symbol: symbol,
                  historicalData: historyData,
                });
              }
            }
            
            successCount++;
          }
          
          // 避免 API 限制，每個請求間隔 100ms
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error);
          errorMessage += `${symbol}: ${error.message}; `;
        }
      }
      
      // 記錄成功
      await ctx.runMutation("dailyDataRefresh:logDataRefresh", {
        status: "success",
        symbolsUpdated: successCount,
        errorMessage: errorMessage || undefined,
        endTime: Date.now(),
      });
      
      return {
        success: true,
        message: `成功刷新 ${successCount}/${STOCK_SYMBOLS.length} 支股票數據`,
        symbolsUpdated: successCount,
      };
      
    } catch (error) {
      // 記錄失敗
      await ctx.runMutation("dailyDataRefresh:logDataRefresh", {
        status: "failed",
        symbolsUpdated: successCount,
        errorMessage: error.message,
        endTime: Date.now(),
      });
      
      return {
        success: false,
        message: `數據刷新失敗: ${error.message}`,
        symbolsUpdated: successCount,
      };
    }
  },
});

// 獲取股票發現數據 (漲跌榜等)
export const getDiscoveryData = query({
  args: { type: v.string() }, // "gainers", "losers", "active", "trending"
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];
    
    let stocks = await ctx.db
      .query("dailyStockData")
      .withIndex("by_date", (q) => q.eq("date", today))
      .collect();
    
    // 根據類型排序
    switch (args.type) {
      case "gainers":
        stocks = stocks
          .filter(s => s.changePercent > 0)
          .sort((a, b) => b.changePercent - a.changePercent)
          .slice(0, 10);
        break;
      case "losers":
        stocks = stocks
          .filter(s => s.changePercent < 0)
          .sort((a, b) => a.changePercent - b.changePercent)
          .slice(0, 10);
        break;
      case "active":
        stocks = stocks
          .filter(s => s.volume)
          .sort((a, b) => (b.volume || 0) - (a.volume || 0))
          .slice(0, 10);
        break;
      case "trending":
        // 簡單的熱門股票邏輯：價格變化幅度大的股票
        stocks = stocks
          .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
          .slice(0, 10);
        break;
      default:
        stocks = stocks.slice(0, 10);
    }
    
    return stocks;
  },
});