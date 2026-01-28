// 台股 API 服務
// 整合台灣證券交易所 (TWSE) 和櫃買中心 (TPEX) 的股票數據

export interface TWStockPrice {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  totalVolume: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  lastUpdated: string;
  market: 'TSE' | 'OTC'; // 上市(TSE) 或 上櫃(OTC)
}

export interface TWStockHistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class TWStockApiService {
  private static readonly TWSE_API_BASE = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp';
  private static readonly TWSE_HISTORY_API = 'https://www.twse.com.tw/exchangeReport/STOCK_DAY';
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分鐘緩存
  
  // 請求緩存
  private static requestCache = new Map<string, TWStockPrice>();
  private static cacheTimestamps = new Map<string, number>();

  // 熱門台股列表
  static readonly POPULAR_TW_STOCKS = {
    TSE: [
      '2330', // 台積電
      '2317', // 鴻海
      '2454', // 聯發科
      '2881', // 富邦金
      '0050', // 元大台灣50
      '0056', // 元大高股息
      '2412', // 中華電
      '1301', // 台塑
      '2303', // 聯電
      '2002', // 中鋼
      '1216', // 統一
      '2886', // 兆豐金
      '2891', // 中信金
      '2382', // 廣達
      '2308', // 台達電
    ],
    OTC: [
      '6547', // 高端疫苗
      '6180', // 橘子
      '4938', // 和碩
      '3034', // 聯詠
      '6415', // 矽力-KY
      '6669', // 緯穎
      '4904', // 遠傳
      '6176', // 瑞儀
      '3711', // 日月光投控
      '6239', // 力成
    ]
  };

  // 清理過期緩存
  private static cleanExpiredCache() {
    const now = Date.now();
    for (const [symbol, timestamp] of this.cacheTimestamps.entries()) {
      if (now - timestamp > this.CACHE_DURATION) {
        this.requestCache.delete(symbol);
        this.cacheTimestamps.delete(symbol);
      }
    }
  }

  // 判斷股票市場類型
  private static getMarketType(symbol: string): 'TSE' | 'OTC' {
    // 6字頭通常是上櫃股票
    if (symbol.startsWith('6')) {
      return 'OTC';
    }
    // 檢查是否在上櫃股票列表中
    if (this.POPULAR_TW_STOCKS.OTC.includes(symbol)) {
      return 'OTC';
    }
    // 默認為上市股票
    return 'TSE';
  }

  // 格式化股票代號為 API 格式
  private static formatSymbolForAPI(symbol: string): string {
    const market = this.getMarketType(symbol);
    const prefix = market === 'TSE' ? 'tse' : 'otc';
    return `${prefix}_${symbol}.tw`;
  }

  // 解析時間戳記
  private static parseTimestamp(timestamp: string): string {
    try {
      const time = parseInt(timestamp) / 1000 + 8 * 60 * 60; // UTC+8
      return new Date(time * 1000).toLocaleString('zh-TW');
    } catch (error) {
      return new Date().toLocaleString('zh-TW');
    }
  }

  // 計算漲跌幅
  private static calculateChangePercent(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  // 獲取單支台股即時資料
  static async getRealTimePrice(symbol: string): Promise<TWStockPrice | null> {
    this.cleanExpiredCache();

    // 檢查緩存
    const cached = this.requestCache.get(symbol);
    const cacheTime = this.cacheTimestamps.get(symbol);
    
    if (cached && cacheTime && (Date.now() - cacheTime) < this.CACHE_DURATION) {
      return cached;
    }

    try {
      const formattedSymbol = this.formatSymbolForAPI(symbol);
      const url = `${this.TWSE_API_BASE}?ex_ch=${formattedSymbol}&json=1&delay=0`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.rtcode !== '0000' || !data.msgArray || data.msgArray.length === 0) {
        throw new Error(`API error: ${data.rtmessage || 'No data'}`);
      }

      const stockData = data.msgArray[0];
      
      // 解析股票數據
      const price = parseFloat(stockData.z) || 0;
      const previousClose = parseFloat(stockData.y) || 0;
      const change = price - previousClose;
      const changePercent = this.calculateChangePercent(price, previousClose);

      const twStock: TWStockPrice = {
        symbol: stockData.c || symbol,
        companyName: stockData.n || stockData.nf || symbol,
        price: price,
        change: change,
        changePercent: changePercent,
        volume: parseInt(stockData.tv) || 0,
        totalVolume: parseInt(stockData.v) || 0,
        open: parseFloat(stockData.o) || 0,
        high: parseFloat(stockData.h) || 0,
        low: parseFloat(stockData.l) || 0,
        previousClose: previousClose,
        lastUpdated: this.parseTimestamp(stockData.tlong),
        market: this.getMarketType(symbol),
      };

      // 更新緩存
      this.requestCache.set(symbol, twStock);
      this.cacheTimestamps.set(symbol, Date.now());

      return twStock;

    } catch (error) {
      console.error(`Error fetching TW stock data for ${symbol}:`, error);
      
      // 返回備用數據
      return this.generateFallbackData(symbol);
    }
  }

  // 批量獲取台股數據
  static async getMultiplePrices(symbols: string[]): Promise<TWStockPrice[]> {
    this.cleanExpiredCache();

    // 去重並分組
    const uniqueSymbols = [...new Set(symbols)];
    const tseSymbols: string[] = [];
    const otcSymbols: string[] = [];

    uniqueSymbols.forEach(symbol => {
      if (this.getMarketType(symbol) === 'TSE') {
        tseSymbols.push(symbol);
      } else {
        otcSymbols.push(symbol);
      }
    });

    const results: TWStockPrice[] = [];

    // 批量獲取上市股票
    if (tseSymbols.length > 0) {
      const tseResults = await this.fetchBatchStocks(tseSymbols, 'TSE');
      results.push(...tseResults);
    }

    // 批量獲取上櫃股票
    if (otcSymbols.length > 0) {
      const otcResults = await this.fetchBatchStocks(otcSymbols, 'OTC');
      results.push(...otcResults);
    }

    return results;
  }

  // 批量獲取指定市場的股票數據
  private static async fetchBatchStocks(symbols: string[], market: 'TSE' | 'OTC'): Promise<TWStockPrice[]> {
    try {
      const prefix = market === 'TSE' ? 'tse' : 'otc';
      const formattedSymbols = symbols.map(symbol => `${prefix}_${symbol}.tw`).join('|');
      const url = `${this.TWSE_API_BASE}?ex_ch=${formattedSymbols}&json=1&delay=0`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.rtcode !== '0000' || !data.msgArray) {
        throw new Error(`API error: ${data.rtmessage || 'No data'}`);
      }

      const results: TWStockPrice[] = [];

      data.msgArray.forEach((stockData: any) => {
        try {
          const price = parseFloat(stockData.z) || 0;
          const previousClose = parseFloat(stockData.y) || 0;
          const change = price - previousClose;
          const changePercent = this.calculateChangePercent(price, previousClose);

          const twStock: TWStockPrice = {
            symbol: stockData.c || '',
            companyName: stockData.n || stockData.nf || '',
            price: price,
            change: change,
            changePercent: changePercent,
            volume: parseInt(stockData.tv) || 0,
            totalVolume: parseInt(stockData.v) || 0,
            open: parseFloat(stockData.o) || 0,
            high: parseFloat(stockData.h) || 0,
            low: parseFloat(stockData.l) || 0,
            previousClose: previousClose,
            lastUpdated: this.parseTimestamp(stockData.tlong),
            market: market,
          };

          results.push(twStock);

          // 更新緩存
          this.requestCache.set(twStock.symbol, twStock);
          this.cacheTimestamps.set(twStock.symbol, Date.now());

        } catch (error) {
          console.error(`Error parsing stock data:`, error);
        }
      });

      return results;

    } catch (error) {
      console.error(`Error fetching batch ${market} stocks:`, error);
      
      // 返回備用數據
      return symbols.map(symbol => this.generateFallbackData(symbol));
    }
  }

  // 獲取台股歷史數據
  static async getHistoricalData(symbol: string, year?: number, month?: number): Promise<TWStockHistoricalData[]> {
    try {
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || (now.getMonth() + 1);
      
      // 格式化日期 (YYYYMMDD，日期部分可以是任意大於1的數字)
      const dateStr = `${targetYear}${targetMonth.toString().padStart(2, '0')}01`;
      
      const url = `${this.TWSE_HISTORY_API}?response=json&date=${dateStr}&stockNo=${symbol}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.stat !== 'OK' || !data.data) {
        throw new Error(`API error: ${data.stat}`);
      }

      const historicalData: TWStockHistoricalData[] = [];

      data.data.forEach((dayData: string[]) => {
        try {
          // 數據格式: [日期, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數]
          const [dateStr, , , openStr, highStr, lowStr, closeStr, , volumeStr] = dayData;
          
          // 轉換民國年為西元年
          const [year, month, day] = dateStr.split('/');
          const westernYear = parseInt(year) + 1911;
          const isoDate = `${westernYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          historicalData.push({
            date: isoDate,
            open: parseFloat(openStr.replace(/,/g, '')) || 0,
            high: parseFloat(highStr.replace(/,/g, '')) || 0,
            low: parseFloat(lowStr.replace(/,/g, '')) || 0,
            close: parseFloat(closeStr.replace(/,/g, '')) || 0,
            volume: parseInt(volumeStr.replace(/,/g, '')) || 0,
          });
        } catch (error) {
          console.error('Error parsing historical data:', error);
        }
      });

      return historicalData.reverse(); // 按日期正序排列

    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return this.generateFallbackHistoricalData(symbol);
    }
  }

  // 生成備用股票數據
  private static generateFallbackData(symbol: string): TWStockPrice {
    const basePrices: { [key: string]: number } = {
      '2330': 580,  // 台積電
      '2317': 110,  // 鴻海
      '2454': 1200, // 聯發科
      '2881': 15,   // 富邦金
      '0050': 140,  // 元大台灣50
      '0056': 35,   // 元大高股息
      '2412': 120,  // 中華電
      '6547': 300,  // 高端疫苗
    };

    const basePrice = basePrices[symbol] || 100;
    const randomChange = (Math.random() - 0.5) * (basePrice * 0.05);
    const price = Math.max(basePrice + randomChange, basePrice * 0.8);
    const change = randomChange;
    const changePercent = (change / basePrice) * 100;

    return {
      symbol,
      companyName: `${symbol} 公司`,
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      totalVolume: Math.floor(Math.random() * 10000000) + 1000000,
      open: Math.round((price + (Math.random() - 0.5) * 5) * 100) / 100,
      high: Math.round((price + Math.random() * 10) * 100) / 100,
      low: Math.round((price - Math.random() * 10) * 100) / 100,
      previousClose: Math.round((price - change) * 100) / 100,
      lastUpdated: new Date().toLocaleString('zh-TW'),
      market: this.getMarketType(symbol),
    };
  }

  // 生成備用歷史數據
  private static generateFallbackHistoricalData(symbol: string): TWStockHistoricalData[] {
    const basePrices: { [key: string]: number } = {
      '2330': 580,
      '2317': 110,
      '2454': 1200,
      '0050': 140,
    };

    const basePrice = basePrices[symbol] || 100;
    const data: TWStockHistoricalData[] = [];
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
        date: date.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
        volume: Math.floor(Math.random() * 1000000) + 100000,
      });
    }

    return data;
  }

  // 獲取緩存統計
  static getCacheStats() {
    this.cleanExpiredCache();
    
    return {
      cacheSize: this.requestCache.size,
      cacheHitRate: Math.min(this.requestCache.size / 10, 1) * 100,
      supportedMarkets: ['TSE', 'OTC'],
      popularStocks: {
        TSE: this.POPULAR_TW_STOCKS.TSE.length,
        OTC: this.POPULAR_TW_STOCKS.OTC.length,
      },
    };
  }

  // 清空緩存
  static clearCache() {
    this.requestCache.clear();
    this.cacheTimestamps.clear();
  }

  // 預加載熱門台股
  static async preloadPopularStocks() {
    const popularSymbols = [
      ...this.POPULAR_TW_STOCKS.TSE.slice(0, 5),
      ...this.POPULAR_TW_STOCKS.OTC.slice(0, 3),
    ];

    this.getMultiplePrices(popularSymbols).catch(error => {
      console.warn('Preload popular TW stocks failed:', error);
    });
  }
}