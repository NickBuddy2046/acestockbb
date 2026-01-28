// 優化版股票 API 服務
// 實現批量請求、去重、重試等優化策略

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  companyName?: string;
}

export interface StockHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 請求狀態管理
interface RequestState {
  promise: Promise<StockPrice | null>;
  timestamp: number;
  retryCount: number;
}

// 批量請求結果
interface BatchRequestResult {
  success: StockPrice[];
  failed: { symbol: string; error: string }[];
  fromCache: StockPrice[];
}

export class OptimizedStockApiService {
  private static readonly CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分鐘緩存
  private static readonly MAX_CONCURRENT_REQUESTS = 5; // 最大並發請求數
  private static readonly MAX_RETRY_ATTEMPTS = 3; // 最大重試次數
  private static readonly RETRY_DELAY = 1000; // 重試延遲 (毫秒)
  private static readonly BATCH_SIZE = 10; // 批量請求大小

  // 請求緩存和狀態管理
  private static requestCache = new Map<string, StockPrice>();
  private static requestStates = new Map<string, RequestState>();
  private static requestQueue: string[] = [];
  private static isProcessingQueue = false;

  // 清理過期緩存
  private static cleanExpiredCache() {
    const now = Date.now();
    for (const [symbol, state] of this.requestStates.entries()) {
      if (now - state.timestamp > this.CACHE_DURATION) {
        this.requestStates.delete(symbol);
        this.requestCache.delete(symbol);
      }
    }
  }

  // 延遲函數
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 帶重試的請求函數
  private static async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = this.MAX_RETRY_ATTEMPTS,
    delayMs: number = this.RETRY_DELAY
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // 指數退避延遲
        const delay = delayMs * Math.pow(2, attempt - 1);
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  // 批量獲取股票數據 (Yahoo Finance API)
  private static async fetchBatchStockData(symbols: string[]): Promise<BatchRequestResult> {
    const result: BatchRequestResult = {
      success: [],
      failed: [],
      fromCache: []
    };

    try {
      // 構建批量請求 URL (Yahoo Finance 支持多個股票)
      const symbolsStr = symbols.join(',');
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsStr}`;

      const response = await this.requestWithRetry(async () => {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        return res;
      });

      const data = await response.json();
      const quotes = data.quoteResponse?.result || [];

      // 處理每個股票的數據
      for (const symbol of symbols) {
        const quote = quotes.find((q: any) => q.symbol === symbol);

        if (quote) {
          const stockData: StockPrice = {
            symbol: quote.symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume,
            marketCap: quote.marketCap,
            high52Week: quote.fiftyTwoWeekHigh,
            low52Week: quote.fiftyTwoWeekLow,
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            open: quote.regularMarketOpen,
            previousClose: quote.regularMarketPreviousClose,
            companyName: quote.longName || quote.shortName,
          };

          result.success.push(stockData);
          
          // 更新緩存
          this.requestCache.set(symbol, stockData);
        } else {
          result.failed.push({
            symbol,
            error: 'Stock not found in batch response'
          });
        }
      }

    } catch (error) {
      // 如果批量請求失敗，將所有股票標記為失敗
      for (const symbol of symbols) {
        result.failed.push({
          symbol,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return result;
  }

  // 處理請求隊列
  private static async processRequestQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.requestQueue.length > 0) {
        // 取出一批請求
        const batch = this.requestQueue.splice(0, this.BATCH_SIZE);
        
        // 過濾出需要實際請求的股票 (不在緩存中的)
        const symbolsToFetch = batch.filter(symbol => {
          const cached = this.requestCache.get(symbol);
          const state = this.requestStates.get(symbol);
          
          // 如果有緩存且未過期，跳過
          if (cached && state && (Date.now() - state.timestamp) < this.CACHE_DURATION) {
            return false;
          }
          
          return true;
        });

        if (symbolsToFetch.length > 0) {
          // 批量獲取數據
          const batchResult = await this.fetchBatchStockData(symbolsToFetch);
          
          // 更新請求狀態
          const now = Date.now();
          for (const symbol of symbolsToFetch) {
            this.requestStates.set(symbol, {
              promise: Promise.resolve(this.requestCache.get(symbol) || null),
              timestamp: now,
              retryCount: 0
            });
          }

          // 處理失敗的請求 - 生成備用數據
          for (const failed of batchResult.failed) {
            const fallbackData = this.generateFallbackStockPrice(failed.symbol);
            this.requestCache.set(failed.symbol, fallbackData);
          }
        }

        // 控制請求頻率，避免 API 限制
        if (this.requestQueue.length > 0) {
          await this.delay(200); // 200ms 間隔
        }
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  // 獲取單個股票數據 (優化版)
  static async getRealTimePrice(symbol: string): Promise<StockPrice | null> {
    this.cleanExpiredCache();

    // 檢查緩存
    const cached = this.requestCache.get(symbol);
    const state = this.requestStates.get(symbol);

    if (cached && state && (Date.now() - state.timestamp) < this.CACHE_DURATION) {
      return cached;
    }

    // 檢查是否已在請求中
    if (state && state.promise) {
      return await state.promise;
    }

    // 添加到請求隊列
    if (!this.requestQueue.includes(symbol)) {
      this.requestQueue.push(symbol);
    }

    // 創建請求 Promise
    const requestPromise = new Promise<StockPrice | null>((resolve) => {
      // 設置一個檢查間隔，等待批量處理完成
      const checkInterval = setInterval(() => {
        const result = this.requestCache.get(symbol);
        if (result) {
          clearInterval(checkInterval);
          resolve(result);
        }
      }, 100);

      // 超時處理
      setTimeout(() => {
        clearInterval(checkInterval);
        const fallback = this.generateFallbackStockPrice(symbol);
        this.requestCache.set(symbol, fallback);
        resolve(fallback);
      }, 10000); // 10秒超時
    });

    // 更新請求狀態
    this.requestStates.set(symbol, {
      promise: requestPromise,
      timestamp: Date.now(),
      retryCount: 0
    });

    // 觸發隊列處理
    this.processRequestQueue();

    return await requestPromise;
  }

  // 批量獲取多個股票價格 (優化版)
  static async getMultiplePrices(symbols: string[]): Promise<StockPrice[]> {
    this.cleanExpiredCache();

    // 去重
    const uniqueSymbols = [...new Set(symbols)];
    
    // 分離緩存命中和需要請求的股票
    const cachedResults: StockPrice[] = [];
    const symbolsToFetch: string[] = [];

    for (const symbol of uniqueSymbols) {
      const cached = this.requestCache.get(symbol);
      const state = this.requestStates.get(symbol);

      if (cached && state && (Date.now() - state.timestamp) < this.CACHE_DURATION) {
        cachedResults.push(cached);
      } else {
        symbolsToFetch.push(symbol);
      }
    }

    // 如果所有數據都在緩存中，直接返回
    if (symbolsToFetch.length === 0) {
      return cachedResults;
    }

    // 批量獲取未緩存的數據
    const batchResult = await this.fetchBatchStockData(symbolsToFetch);
    
    // 處理失敗的請求
    for (const failed of batchResult.failed) {
      const fallbackData = this.generateFallbackStockPrice(failed.symbol);
      batchResult.success.push(fallbackData);
    }

    // 合併結果
    return [...cachedResults, ...batchResult.success];
  }

  // 智能預加載 (預測用戶可能需要的股票數據)
  static async preloadPopularStocks() {
    const popularStocks = [
      'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 
      'NVDA', 'META', 'NFLX', 'AMD', 'CRM'
    ];

    // 在後台預加載，不阻塞主要操作
    this.getMultiplePrices(popularStocks).catch(error => {
      console.warn('Preload popular stocks failed:', error);
    });
  }

  // 獲取緩存統計信息
  static getCacheStats() {
    this.cleanExpiredCache();
    
    return {
      cacheSize: this.requestCache.size,
      queueSize: this.requestQueue.length,
      isProcessing: this.isProcessingQueue,
      cacheHitRate: this.calculateCacheHitRate(),
    };
  }

  // 計算緩存命中率
  private static calculateCacheHitRate(): number {
    // 這裡可以實現更複雜的統計邏輯
    // 暫時返回基於緩存大小的估算
    return Math.min(this.requestCache.size / 20, 1) * 100;
  }

  // 清空緩存
  static clearCache() {
    this.requestCache.clear();
    this.requestStates.clear();
    this.requestQueue.length = 0;
  }

  // 生成備用數據
  private static generateFallbackStockPrice(symbol: string): StockPrice {
    const basePrices: { [key: string]: number } = {
      'AAPL': 150,
      'GOOGL': 2750,
      'MSFT': 310,
      'TSLA': 245,
      'AMZN': 3100,
      'NVDA': 500,
      'META': 280,
      'NFLX': 400,
    };

    const basePrice = basePrices[symbol] || 100;
    const randomChange = (Math.random() - 0.5) * (basePrice * 0.05);
    const price = Math.max(basePrice + randomChange, basePrice * 0.8);
    const change = randomChange;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      companyName: `${symbol} Inc.`,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    };
  }

  // 獲取歷史數據 (保持原有邏輯)
  static async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoricalData[]> {
    try {
      const response = await fetch(`/api/stock/${symbol}/history`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return this.generateFallbackHistoricalData(symbol);
    }
  }

  // 生成備用歷史數據
  private static generateFallbackHistoricalData(symbol: string): StockHistoricalData[] {
    const basePrices: { [key: string]: number } = {
      'AAPL': 150,
      'GOOGL': 2750,
      'MSFT': 310,
      'TSLA': 245,
      'AMZN': 3100,
      'NVDA': 500,
      'META': 280,
      'NFLX': 400,
    };

    const basePrice = basePrices[symbol] || 100;
    const data: StockHistoricalData[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const randomChange = (Math.random() - 0.5) * (basePrice * 0.05);
      const close = Math.max(basePrice + randomChange, basePrice * 0.8);
      const open = close + (Math.random() - 0.5) * (close * 0.02);
      const high = Math.max(open, close) + Math.random() * (close * 0.01);
      const low = Math.min(open, close) - Math.random() * (close * 0.01);

      data.push({
        date: date.toISOString(),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
      });
    }

    return data;
  }
}