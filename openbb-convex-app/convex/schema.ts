import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

  // 每日股票數據快照 - 每天刷新一次
  dailyStockData: defineTable({
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
    date: v.string(), // YYYY-MM-DD 格式
    lastUpdated: v.number(),
  }).index("by_symbol", ["symbol"])
    .index("by_date", ["date"])
    .index("by_symbol_date", ["symbol", "date"]),

  // 歷史價格數據 (用於圖表) - 30天數據
  historicalPrices: defineTable({
    symbol: v.string(),
    date: v.string(), // YYYY-MM-DD 格式
    open: v.number(),
    high: v.number(),
    low: v.number(),
    close: v.number(),
    volume: v.number(),
    lastUpdated: v.number(),
  }).index("by_symbol", ["symbol"])
    .index("by_symbol_date", ["symbol", "date"]),

  // 數據刷新記錄
  dataRefreshLog: defineTable({
    date: v.string(), // YYYY-MM-DD 格式
    status: v.string(), // "success", "failed", "in_progress"
    symbolsUpdated: v.number(),
    errorMessage: v.optional(v.string()),
    startTime: v.number(),
    endTime: v.optional(v.number()),
  }).index("by_date", ["date"]),
});