"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Volume2, Building2, Star, Plus, MapPin } from "lucide-react";
import { TWStockApiService, TWStockPrice } from "@/lib/twStockApi";
import { showToast } from "../ui/Toast";

export function TWStockDiscovery() {
  const [activeTab, setActiveTab] = useState<'popular' | 'tse' | 'otc' | 'etf'>('popular');
  const [stocks, setStocks] = useState<TWStockPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheStats, setCacheStats] = useState<any>(null);

  // 預定義的台股列表
  const stockLists = {
    popular: ['2330', '2317', '2454', '2881', '0050', '0056', '2412', '6547'],
    tse: ['2330', '2317', '2454', '2881', '2412', '1301', '2303', '2002'],
    otc: ['6547', '6180', '4938', '3034', '6415', '6669', '4904', '6176'],
    etf: ['0050', '0056', '00878', '00881', '00692', '00713', '00757', '006208'],
  };

  const tabLabels = {
    popular: '熱門台股',
    tse: '上市股票',
    otc: '上櫃股票',
    etf: 'ETF基金',
  };

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      try {
        const symbols = stockLists[activeTab];
        
        // 使用台股批量 API
        const stockData = await TWStockApiService.getMultiplePrices(symbols);
        
        // 根據漲跌幅排序
        const sortedStocks = stockData.sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
        setStocks(sortedStocks);
        
        // 更新緩存統計
        setCacheStats(TWStockApiService.getCacheStats());
        
      } catch (error) {
        console.error('Error fetching TW stocks:', error);
        showToast.error("載入失敗", "無法獲取台股數據");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, [activeTab]);

  // 預加載熱門台股
  useEffect(() => {
    TWStockApiService.preloadPopularStocks();
  }, []);

  const addToWatchlist = (stock: TWStockPrice) => {
    // 獲取現有監控列表
    const saved = localStorage.getItem('openbb-tw-watchlist');
    let watchlist = [];
    
    if (saved) {
      try {
        watchlist = JSON.parse(saved);
      } catch (error) {
        watchlist = [];
      }
    }

    // 檢查是否已存在
    const exists = watchlist.find((item: any) => 
      item.symbol === stock.symbol
    );

    if (exists) {
      showToast.warning("股票已存在", `${stock.symbol} ${stock.companyName} 已經在您的台股監控列表中`);
      return;
    }

    // 添加到監控列表
    const newItem = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      companyName: stock.companyName,
      market: stock.market,
      alertEnabled: false,
      currentPrice: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      lastUpdated: Date.now(),
    };

    watchlist.push(newItem);
    localStorage.setItem('openbb-tw-watchlist', JSON.stringify(watchlist));
    showToast.success("添加成功", `${stock.symbol} ${stock.companyName} 已添加到台股監控列表`);
  };

  const getMarketBadge = (market: 'TSE' | 'OTC') => {
    return market === 'TSE' ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        上市
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        上櫃
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <MapPin size={20} className="text-red-500" />
            <span>台股發現</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            台灣證券交易所即時數據
          </p>
        </div>
        
        {/* 緩存統計 */}
        {cacheStats && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
            <div>緩存: {cacheStats.cacheSize} 項</div>
            <div>命中率: {Math.round(cacheStats.cacheHitRate)}%</div>
            <div>支援: {cacheStats.supportedMarkets.join(', ')}</div>
          </div>
        )}
      </div>

      {/* 標籤切換 */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {Object.entries(tabLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 股票列表 */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-16 rounded-lg"></div>
            ))}
          </div>
        ) : stocks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            暫無數據
          </div>
        ) : (
          stocks.map((stock, index) => {
            const isPositive = (stock.changePercent || 0) >= 0;
            const rank = index + 1;

            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* 排名 */}
                  <div className="flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full text-sm font-bold">
                    {rank}
                  </div>

                  {/* 股票信息 */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{stock.symbol}</h3>
                      <span className="text-sm text-gray-600 max-w-32 truncate">
                        {stock.companyName}
                      </span>
                      {getMarketBadge(stock.market)}
                    </div>
                    
                    {/* 額外信息 */}
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Volume2 size={12} />
                        <span>{(stock.volume / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Building2 size={12} />
                        <span>總量 {(stock.totalVolume / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 價格和變化 */}
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${stock.price.toFixed(2)}
                    </div>
                    <div className={`flex items-center space-x-1 text-sm ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      <span>
                        {isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {isPositive ? '+' : ''}{stock.change?.toFixed(2)}
                    </div>
                  </div>

                  {/* 添加按鈕 */}
                  <button
                    onClick={() => addToWatchlist(stock)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="添加到台股監控列表"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部說明 */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <MapPin size={14} className="text-red-500" />
            <span>台灣證券交易所 (TWSE) 即時數據</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star size={14} />
            <span>支援上市、上櫃股票</span>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          數據來源：台灣證券交易所、證券櫃台買賣中心
        </div>
      </div>
    </div>
  );
}