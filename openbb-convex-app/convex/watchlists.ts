import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getMyWatchlist = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return [];

    return await ctx.db
      .query("watchlists")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// 為了演示，我們創建一個不需要認證的公共監控列表
export const getPublicWatchlist = query({
  args: {},
  handler: async (ctx) => {
    // First, try to get the demo user's watchlist
    const demoUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@openbb.com"))
      .first();

    if (demoUser) {
      const watchlist = await ctx.db
        .query("watchlists")
        .withIndex("by_user", (q) => q.eq("userId", demoUser._id))
        .collect();
      
      if (watchlist.length > 0) {
        return watchlist;
      }
    }

    // If no demo user or empty watchlist, return some default examples
    return [
      {
        _id: "demo1" as any,
        symbol: "AAPL",
        companyName: "Apple Inc.",
        targetPrice: 160.00,
        notes: "關注新產品發布",
        alertEnabled: true,
      },
      {
        _id: "demo2" as any,
        symbol: "GOOGL",
        companyName: "Alphabet Inc.",
        targetPrice: 2800.00,
        notes: "AI 發展前景看好",
        alertEnabled: false,
      },
      {
        _id: "demo3" as any,
        symbol: "MSFT",
        companyName: "Microsoft Corporation",
        targetPrice: 320.00,
        notes: "雲服務增長強勁",
        alertEnabled: true,
      },
    ];
  },
});

export const addToWatchlist = mutation({
  args: {
    symbol: v.string(),
    companyName: v.optional(v.string()),
    targetPrice: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 簡化版本：直接使用演示用戶，不做複雜的認證檢查
    let demoUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@openbb.com"))
      .first();
    
    let userId;
    if (!demoUser) {
      // 創建演示用戶
      userId = await ctx.db.insert("users", {
        email: "demo@openbb.com",
        name: "演示用戶",
      });
    } else {
      userId = demoUser._id;
    }

    // 簡單的重複檢查
    const existingItems = await ctx.db
      .query("watchlists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const duplicate = existingItems.find(item => 
      item.symbol.toUpperCase() === args.symbol.toUpperCase()
    );

    if (duplicate) {
      throw new Error(`${args.symbol} 已經在監控列表中`);
    }

    // 插入新項目
    const newItem = await ctx.db.insert("watchlists", {
      userId: userId,
      symbol: args.symbol.toUpperCase(),
      companyName: args.companyName || args.symbol,
      targetPrice: args.targetPrice,
      notes: args.notes,
      alertEnabled: !!args.targetPrice,
    });

    return newItem;
  },
});

export const removeFromWatchlist = mutation({
  args: { id: v.id("watchlists") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    
    const watchlistItem = await ctx.db.get(args.id);
    if (!watchlistItem) throw new Error("Item not found");

    if (identity) {
      // User is authenticated, check ownership
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user || watchlistItem.userId !== user._id) {
        throw new Error("Unauthorized");
      }
    } else {
      // For demo purposes, allow deletion if it belongs to demo user
      const demoUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", "demo@openbb.com"))
        .first();
      
      if (!demoUser || watchlistItem.userId !== demoUser._id) {
        throw new Error("Unauthorized - demo mode");
      }
    }

    await ctx.db.delete(args.id);
  },
});

// Helper function to initialize demo data
export const initializeDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create demo user if doesn't exist
    let demoUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", "demo@openbb.com"))
      .first();
    
    if (!demoUser) {
      const userId = await ctx.db.insert("users", {
        email: "demo@openbb.com",
        name: "演示用戶",
      });
      
      // Add some initial watchlist items
      await ctx.db.insert("watchlists", {
        userId: userId,
        symbol: "AAPL",
        companyName: "Apple Inc.",
        targetPrice: 160.00,
        notes: "關注新產品發布",
        alertEnabled: true,
      });
      
      await ctx.db.insert("watchlists", {
        userId: userId,
        symbol: "GOOGL",
        companyName: "Alphabet Inc.",
        targetPrice: 2800.00,
        notes: "AI 發展前景看好",
        alertEnabled: false,
      });
      
      await ctx.db.insert("watchlists", {
        userId: userId,
        symbol: "MSFT",
        companyName: "Microsoft Corporation",
        targetPrice: 320.00,
        notes: "雲服務增長強勁",
        alertEnabled: true,
      });
      
      return "Demo data initialized successfully";
    }
    
    return "Demo user already exists";
  },
});