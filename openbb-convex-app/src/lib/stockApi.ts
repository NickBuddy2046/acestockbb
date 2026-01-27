// 股票數據 API 服務

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
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

// 股票數據 API 服務

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

export class StockApiService {
  private static readonly CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

  // 獲取實時股票價格 - 優先使用緩存
  static async getRealTimePrice(symbol: string): Promise<StockPrice | null> {
    try {
      // 首先嘗試從 Convex 緩存獲取今日數據
      const cachedData = await this.getCachedStockData(symbol);
      if (cachedData) {
        return {
          symbol: cachedData.symbol,
          companyName: cachedData.companyName,
          price: cachedData.price,
          change: cachedData.change,
          changePercent: cachedData.changePercent,
          volume: cachedData.volume,
          marketCap: cachedData.marketCap,
          high: cachedData.high,
          low: cachedData.low,
          open: cachedData.open,
          previousClose: cachedData.previousClose,
        };
      }

      // 如果緩存沒有數據，回退到實時 API
      const response = await fetch(`/api/stock/${symbol}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    } catch (error) {
      console.error(`Error fetching real-time price for ${symbol}:`, error);
      return generateFallbackStockPrice(symbol);
    }
  }

  // 從 Convex 緩存獲取股票數據
  private static async getCachedStockData(symbol: string) {
    try {
      if (!this.CONVEX_URL) return null;
      
      const { ConvexHttpClient } = await import('convex/browser');
      const { api } = await import('../../convex/_generated/api');
      
      const convex = new ConvexHttpClient(this.CONVEX_URL);
      const data = await convex.query(api.dailyDataRefresh.getStockData, { symbol });
      return data;
    } catch (error) {
      console.error('Error fetching cached data:', error);
      return null;
    }
  }

  // 獲取歷史數據 - 優先使用緩存
  static async getHistoricalData(symbol: string, days: number = 30): Promise<StockHistoricalData[]> {
    try {
      // 首先嘗試從 Convex 緩存獲取歷史數據
      const cachedData = await this.getCachedHistoricalData(symbol, days);
      if (cachedData && cachedData.length > 0) {
        return cachedData.map(item => ({
          date: item.date,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
          volume: item.volume,
        }));
      }

      // 如果緩存沒有數據，回退到實時 API
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
      return generateFallbackHistoricalData(symbol);
    }
  }

  // 從 Convex 緩存獲取歷史數據
  private static async getCachedHistoricalData(symbol: string, days: number) {
    try {
      if (!this.CONVEX_URL) return null;
      
      const { ConvexHttpClient } = await import('convex/browser');
      const { api } = await import('../../convex/_generated/api');
      
      const convex = new ConvexHttpClient(this.CONVEX_URL);
      const data = await convex.query(api.dailyDataRefresh.getHistoricalData, { symbol, days });
      return data;
    } catch (error) {
      console.error('Error fetching cached historical data:', error);
      return null;
    }
  }

  // 批量獲取多個股票價格 - 優先使用緩存
  static async getMultiplePrices(symbols: string[]): Promise<StockPrice[]> {
    try {
      // 首先嘗試從 Convex 緩存批量獲取
      const cachedData = await this.getCachedMultipleStocks(symbols);
      if (cachedData && cachedData.length > 0) {
        return cachedData.map(stock => ({
          symbol: stock.symbol,
          companyName: stock.companyName,
          price: stock.price,
          change: stock.change,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          high: stock.high,
          low: stock.low,
          open: stock.open,
          previousClose: stock.previousClose,
        }));
      }

      // 如果緩存沒有足夠數據，回退到並行 API 調用
      const promises = symbols.map(symbol => this.getRealTimePrice(symbol));
      const results = await Promise.all(promises);
      return results.filter((result): result is StockPrice => result !== null);
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      return symbols.map(symbol => generateFallbackStockPrice(symbol));
    }
  }

  // 從 Convex 緩存批量獲取股票數據
  private static async getCachedMultipleStocks(symbols: string[]) {
    try {
      if (!this.CONVEX_URL) return null;
      
      const { ConvexHttpClient } = await import('convex/browser');
      const { api } = await import('../../convex/_generated/api');
      
      const convex = new ConvexHttpClient(this.CONVEX_URL);
      const data = await convex.query(api.dailyDataRefresh.getTodayStockData, { symbols });
      return data;
    } catch (error) {
      console.error('Error fetching cached multiple stocks:', error);
      return null;
    }
  }

  // 獲取股票發現數據 (漲跌榜等) - 僅使用緩存
  static async getDiscoveryStocks(type: 'gainers' | 'losers' | 'active' | 'trending'): Promise<StockPrice[]> {
    try {
      if (!this.CONVEX_URL) {
        // 如果沒有 Convex，回退到實時數據
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
        return await this.getMultiplePrices(symbols);
      }
      
      const { ConvexHttpClient } = await import('convex/browser');
      const { api } = await import('../../convex/_generated/api');
      
      const convex = new ConvexHttpClient(this.CONVEX_URL);
      const data = await convex.query(api.dailyDataRefresh.getDiscoveryData, { type });
      
      return data.map(stock => ({
        symbol: stock.symbol,
        companyName: stock.companyName,
        price: stock.price,
        change: stock.change,
        changePercent: stock.changePercent,
        volume: stock.volume,
        marketCap: stock.marketCap,
        high: stock.high,
        low: stock.low,
        open: stock.open,
        previousClose: stock.previousClose,
      }));
    } catch (error) {
      console.error(`Error fetching discovery data for ${type}:`, error);
      // 回退到備用數據
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
      return symbols.map(symbol => generateFallbackStockPrice(symbol));
    }
  }

  // 檢查今日數據刷新狀態
  static async checkDailyRefreshStatus() {
    try {
      const response = await fetch('/api/refresh-daily-data', {
        method: 'GET',
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Error checking refresh status:', error);
      return null;
    }
  }

  // 手動觸發數據刷新 (管理員功能)
  static async triggerDailyRefresh(authToken?: string) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch('/api/refresh-daily-data', {
        method: 'POST',
        headers,
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error('Error triggering refresh:', error);
      throw error;
    }
  }
}

// 備用數據生成器（當 API 失敗時使用）
export function generateFallbackStockPrice(symbol: string): StockPrice {
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
  };
}

export function generateFallbackHistoricalData(symbol: string): StockHistoricalData[] {
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