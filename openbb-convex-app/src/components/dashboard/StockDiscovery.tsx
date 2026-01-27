"use client";

import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Volume2, DollarSign, Star, Plus } from "lucide-react";
import { StockApiService, StockPrice } from "@/lib/stockApi";
import { showToast } from "../ui/Toast";

interface DiscoveryStock extends StockPrice {
  marketCap?: number;
  volume?: number;
  high52Week?: number;
  low52Week?: number;
}

export function StockDiscovery() {
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'active' | 'trending'>('gainers');
  const [stocks, setStocks] = useState<DiscoveryStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 參考 OpenBB 的熱門股票列表
  const stockLists = {
    gainers: ['NVDA', 'AMD', 'TSLA', 'META', 'NFLX', 'CRM', 'ADBE', 'PYPL'],
    losers: ['INTC', 'IBM', 'GE', 'F', 'T', 'VZ', 'XOM', 'CVX'],
    active: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX'],
    trending: ['AI', 'PLTR', 'RIVN', 'LCID', 'SOFI', 'HOOD', 'COIN', 'SQ'],
  };

  const tabLabels = {
    gainers: '今日漲幅榜',
    losers: '今日跌幅榜', 
    active: '成交活躍',
    trending: '熱門關注',
  };

  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoading(true);
      try {
        // 使用新的發現數據 API，優先從緩存獲取
        const stockData = await StockApiService.getDiscoveryStocks(activeTab);
        setStocks(stockData);
      } catch (error) {
        console.error('Error fetching discovery stocks:', error);
        showToast.error("載入失敗", "無法獲取股票發現數據");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, [activeTab]);

  const addToWatchlist = (stock: DiscoveryStock) => {
    // 獲取現有監控列表
    const saved = localStorage.getItem('openbb-watchlist');
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
      item.symbol.toUpperCase() === stock.symbol.toUpperCase()
    );

    if (exists) {
      showToast.warning("股票已存在", `${stock.symbol} 已經在您的監控列表中`);
      return;
    }

    // 添加到監控列表
    const newItem = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      companyName: stock.companyName || stock.symbol,
      alertEnabled: false,
      currentPrice: stock.price,
      change: stock.change,
      changePercent: stock.changePercent,
      volume: stock.volume,
      lastUpdated: Date.now(),
    };

    watchlist.push(newItem);
    localStorage.setItem('openbb-watchlist', JSON.stringify(watchlist));
    showToast.success("添加成功", `${stock.symbol} 已添加到監控列表`);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">股票發現</h2>
        <div className="text-sm text-gray-500">
          參考 OpenBB Discovery 功能
        </div>
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
          stocks.slice(0, 8).map((stock, index) => {
            const isPositive = (stock.changePercent || 0) >= 0;
            const rank = index + 1;

            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* 排名 */}
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
                    {rank}
                  </div>

                  {/* 股票信息 */}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{stock.symbol}</h3>
                      {stock.companyName && (
                        <span className="text-sm text-gray-600 truncate max-w-32">
                          {stock.companyName}
                        </span>
                      )}
                    </div>
                    
                    {/* 額外信息 */}
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      {stock.volume && (
                        <div className="flex items-center space-x-1">
                          <Volume2 size={12} />
                          <span>{(stock.volume / 1000000).toFixed(1)}M</span>
                        </div>
                      )}
                      {stock.marketCap && (
                        <div className="flex items-center space-x-1">
                          <DollarSign size={12} />
                          <span>{(stock.marketCap / 1000000000).toFixed(1)}B</span>
                        </div>
                      )}
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
                  </div>

                  {/* 添加按鈕 */}
                  <button
                    onClick={() => addToWatchlist(stock)}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="添加到監控列表"
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
            <Star size={14} />
            <span>數據來源: Yahoo Finance API</span>
          </div>
          <div>
            每30秒自動更新
          </div>
        </div>
      </div>
    </div>
  );
}