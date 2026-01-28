"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Bell, BellOff, TrendingUp, TrendingDown, MapPin, RefreshCw } from "lucide-react";
import { TWStockApiService, TWStockPrice } from "@/lib/twStockApi";
import { showToast } from "../ui/Toast";

interface TWWatchlistItem {
  id: string;
  symbol: string;
  companyName: string;
  market: 'TSE' | 'OTC';
  alertEnabled: boolean;
  targetPrice?: number;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  lastUpdated: number;
}

export function TWWatchlistCard() {
  const [watchlist, setWatchlist] = useState<TWWatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');

  // 載入監控列表
  useEffect(() => {
    loadWatchlist();
  }, []);

  // 定期更新價格
  useEffect(() => {
    if (watchlist.length > 0) {
      updatePrices();
      const interval = setInterval(updatePrices, 30000); // 30秒更新一次
      return () => clearInterval(interval);
    }
  }, [watchlist.length]);

  const loadWatchlist = () => {
    const saved = localStorage.getItem('openbb-tw-watchlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWatchlist(parsed);
      } catch (error) {
        console.error('Error loading TW watchlist:', error);
        setWatchlist([]);
      }
    }
  };

  const saveWatchlist = (newWatchlist: TWWatchlistItem[]) => {
    localStorage.setItem('openbb-tw-watchlist', JSON.stringify(newWatchlist));
    setWatchlist(newWatchlist);
  };

  const updatePrices = async () => {
    if (watchlist.length === 0) return;

    setIsLoading(true);
    try {
      const symbols = watchlist.map(item => item.symbol);
      const stockData = await TWStockApiService.getMultiplePrices(symbols);
      
      const updatedWatchlist = watchlist.map(item => {
        const stockInfo = stockData.find(stock => stock.symbol === item.symbol);
        if (stockInfo) {
          return {
            ...item,
            currentPrice: stockInfo.price,
            change: stockInfo.change,
            changePercent: stockInfo.changePercent,
            volume: stockInfo.volume,
            lastUpdated: Date.now(),
          };
        }
        return item;
      });

      saveWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Error updating TW stock prices:', error);
      showToast.error("更新失敗", "無法更新台股價格");
    } finally {
      setIsLoading(false);
    }
  };

  const addStock = async () => {
    if (!newSymbol.trim()) {
      showToast.error("輸入錯誤", "請輸入股票代號");
      return;
    }

    const symbol = newSymbol.trim().toUpperCase();
    
    // 驗證台股代號格式
    if (!/^\d{4}$/.test(symbol)) {
      showToast.error("格式錯誤", "台股代號應為4位數字");
      return;
    }

    // 檢查是否已存在
    if (watchlist.find(item => item.symbol === symbol)) {
      showToast.warning("股票已存在", "該股票已在監控列表中");
      return;
    }

    try {
      setIsLoading(true);
      const stockData = await TWStockApiService.getRealTimePrice(symbol);
      
      if (!stockData) {
        showToast.error("添加失敗", "無法獲取股票資訊");
        return;
      }

      const newItem: TWWatchlistItem = {
        id: Date.now().toString(),
        symbol: stockData.symbol,
        companyName: stockData.companyName,
        market: stockData.market,
        alertEnabled: false,
        currentPrice: stockData.price,
        change: stockData.change,
        changePercent: stockData.changePercent,
        volume: stockData.volume,
        lastUpdated: Date.now(),
      };

      const newWatchlist = [...watchlist, newItem];
      saveWatchlist(newWatchlist);
      
      setNewSymbol('');
      setShowAddModal(false);
      showToast.success("添加成功", `${stockData.symbol} ${stockData.companyName} 已添加到監控列表`);
      
    } catch (error) {
      console.error('Error adding TW stock:', error);
      showToast.error("添加失敗", "無法添加股票到監控列表");
    } finally {
      setIsLoading(false);
    }
  };

  const removeStock = (id: string) => {
    const newWatchlist = watchlist.filter(item => item.id !== id);
    saveWatchlist(newWatchlist);
    showToast.success("移除成功", "股票已從監控列表中移除");
  };

  const toggleAlert = (id: string) => {
    const newWatchlist = watchlist.map(item => 
      item.id === id ? { ...item, alertEnabled: !item.alertEnabled } : item
    );
    saveWatchlist(newWatchlist);
  };

  const getMarketBadge = (market: 'TSE' | 'OTC') => {
    return market === 'TSE' ? (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
        上市
      </span>
    ) : (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
        上櫃
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <MapPin size={20} className="text-red-500" />
          <h2 className="text-xl font-semibold">台股監控</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={updatePrices}
            disabled={isLoading}
            className={`p-2 rounded-lg transition-colors ${
              isLoading 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title="刷新價格"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus size={16} />
            <span>添加</span>
          </button>
        </div>
      </div>

      {/* 監控列表 */}
      <div className="space-y-3">
        {watchlist.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MapPin size={48} className="mx-auto text-gray-300 mb-2" />
            <p>還沒有台股監控項目</p>
            <p className="text-sm">點擊「添加」按鈕開始監控台股</p>
          </div>
        ) : (
          watchlist.map((item) => {
            const isPositive = (item.changePercent || 0) >= 0;
            
            return (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{item.symbol}</h3>
                      {getMarketBadge(item.market)}
                    </div>
                    <p className="text-sm text-gray-600 truncate max-w-32">
                      {item.companyName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* 價格信息 */}
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${item.currentPrice?.toFixed(2) || '--'}
                    </div>
                    {item.changePercent !== undefined && (
                      <div className={`flex items-center space-x-1 text-sm ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        <span>
                          {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleAlert(item.id)}
                      className={`p-1.5 rounded transition-colors ${
                        item.alertEnabled
                          ? 'text-yellow-600 hover:bg-yellow-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={item.alertEnabled ? '關閉提醒' : '開啟提醒'}
                    >
                      {item.alertEnabled ? <Bell size={14} /> : <BellOff size={14} />}
                    </button>
                    <button
                      onClick={() => removeStock(item.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="移除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 添加股票模態框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">添加台股到監控列表</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  股票代號 (4位數字)
                </label>
                <input
                  type="text"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="例如: 2330"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  maxLength={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  範例：2330 (台積電)、0050 (元大台灣50)
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewSymbol('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={addStock}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isLoading ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部信息 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>監控 {watchlist.length} 支台股</span>
          <span>每30秒自動更新</span>
        </div>
      </div>
    </div>
  );
}