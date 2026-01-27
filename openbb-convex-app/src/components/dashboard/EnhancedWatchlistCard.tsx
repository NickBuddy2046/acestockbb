"use client";

import { useState, useEffect } from "react";
import { Plus, Target, Bell, BellOff, Trash2, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { AddStockModal } from "./AddStockModal";
import { showToast } from "../ui/Toast";
import { StockApiService, StockPrice } from "@/lib/stockApi";

interface WatchlistItem {
  id: string;
  symbol: string;
  companyName?: string;
  targetPrice?: number;
  notes?: string;
  alertEnabled?: boolean;
  // 實時數據
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  lastUpdated?: number;
}

export function EnhancedWatchlistCard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  // 從本地存儲載入數據
  useEffect(() => {
    const saved = localStorage.getItem('openbb-watchlist');
    if (saved) {
      try {
        setWatchlist(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to parse watchlist:', error);
        setWatchlist([]);
      }
    } else {
      // 初始化一些演示數據
      const initialData = [
        {
          id: "demo1",
          symbol: "AAPL",
          companyName: "Apple Inc.",
          targetPrice: 160.00,
          notes: "關注新產品發布",
          alertEnabled: true,
        },
        {
          id: "demo2",
          symbol: "GOOGL",
          companyName: "Alphabet Inc.",
          targetPrice: 2800.00,
          notes: "AI 發展前景看好",
          alertEnabled: false,
        },
      ];
      setWatchlist(initialData);
      localStorage.setItem('openbb-watchlist', JSON.stringify(initialData));
    }
  }, []);

  // 更新實時價格數據
  const updatePrices = async () => {
    if (watchlist.length === 0) return;

    setIsUpdating(true);
    try {
      const symbols = watchlist.map(item => item.symbol);
      const prices = await StockApiService.getMultiplePrices(symbols);
      
      const updatedWatchlist = watchlist.map(item => {
        const priceData = prices.find(p => p.symbol === item.symbol);
        if (priceData) {
          return {
            ...item,
            currentPrice: priceData.price,
            change: priceData.change,
            changePercent: priceData.changePercent,
            volume: priceData.volume,
            lastUpdated: Date.now(),
          };
        }
        return item;
      });

      setWatchlist(updatedWatchlist);
      localStorage.setItem('openbb-watchlist', JSON.stringify(updatedWatchlist));
      setLastUpdateTime(new Date());

      // 檢查價格提醒
      checkPriceAlerts(updatedWatchlist);
    } catch (error) {
      console.error('Error updating prices:', error);
      showToast.error("更新失敗", "無法獲取最新價格數據");
    } finally {
      setIsUpdating(false);
    }
  };

  // 檢查價格提醒
  const checkPriceAlerts = (items: WatchlistItem[]) => {
    items.forEach(item => {
      if (item.alertEnabled && item.targetPrice && item.currentPrice) {
        const priceDiff = Math.abs(item.currentPrice - item.targetPrice);
        const threshold = item.targetPrice * 0.02; // 2% 閾值

        if (priceDiff <= threshold) {
          showToast.success(
            "價格提醒", 
            `${item.symbol} 已接近目標價格 $${item.targetPrice.toFixed(2)}`
          );
        }
      }
    });
  };

  // 自動更新價格
  useEffect(() => {
    if (watchlist.length > 0) {
      updatePrices(); // 立即更新一次
      
      // 每30秒更新一次
      const interval = setInterval(updatePrices, 30000);
      return () => clearInterval(interval);
    }
  }, [watchlist.length]);

  // 保存到本地存儲
  const saveWatchlist = (newWatchlist: WatchlistItem[]) => {
    setWatchlist(newWatchlist);
    localStorage.setItem('openbb-watchlist', JSON.stringify(newWatchlist));
  };

  // 添加股票
  const handleAddStock = (stockData: {
    symbol: string;
    companyName: string;
    targetPrice?: number;
    notes?: string;
  }) => {
    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      symbol: stockData.symbol.toUpperCase(),
      companyName: stockData.companyName,
      targetPrice: stockData.targetPrice,
      notes: stockData.notes,
      alertEnabled: !!stockData.targetPrice,
    };

    // 檢查重複
    const exists = watchlist.find(item => 
      item.symbol.toUpperCase() === stockData.symbol.toUpperCase()
    );

    if (exists) {
      showToast.warning("股票已存在", `${stockData.symbol} 已經在您的監控列表中`);
      return false;
    }

    const newWatchlist = [...watchlist, newItem];
    saveWatchlist(newWatchlist);
    showToast.success("添加成功", `${stockData.symbol} 已添加到監控列表`);
    
    // 立即獲取新股票的價格
    setTimeout(() => updatePrices(), 1000);
    
    return true;
  };

  // 移除股票
  const handleRemoveStock = (stockId: string) => {
    const newWatchlist = watchlist.filter(item => item.id !== stockId);
    saveWatchlist(newWatchlist);
    showToast.success("移除成功", "股票已從監控列表中移除");
  };

  // 切換提醒狀態
  const toggleAlert = (stockId: string) => {
    const newWatchlist = watchlist.map(item => 
      item.id === stockId 
        ? { ...item, alertEnabled: !item.alertEnabled }
        : item
    );
    saveWatchlist(newWatchlist);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">我的監控列表</h2>
          {lastUpdateTime && (
            <p className="text-xs text-gray-500 mt-1">
              最後更新: {lastUpdateTime.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={updatePrices}
            disabled={isUpdating}
            className={`p-2 rounded-lg transition-colors ${
              isUpdating 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="刷新價格"
          >
            <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>添加</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {watchlist.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            還沒有添加任何股票到監控列表
          </div>
        ) : (
          watchlist.map((item) => {
            const hasRealTimeData = item.currentPrice !== undefined;
            const isPositive = (item.change || 0) >= 0;
            const isNearTarget = item.targetPrice && item.currentPrice && 
              Math.abs(item.currentPrice - item.targetPrice) <= (item.targetPrice * 0.05);

            return (
              <div
                key={item.id}
                className={`bg-gray-50 rounded-lg p-4 border-l-4 transition-colors ${
                  isNearTarget ? 'border-l-yellow-400 bg-yellow-50' : 'border-l-blue-400'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.symbol}</h3>
                      {item.companyName && (
                        <span className="text-sm text-gray-600">{item.companyName}</span>
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        hasRealTimeData ? 'bg-green-500' : 'bg-gray-400'
                      }`} title={hasRealTimeData ? '實時數據' : '等待數據'}></div>
                    </div>

                    {/* 當前價格 */}
                    {hasRealTimeData && (
                      <div className="mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${item.currentPrice!.toFixed(2)}
                          </span>
                          <div className={`flex items-center space-x-1 text-sm ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isPositive ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            <span>
                              {isPositive ? '+' : ''}${item.change!.toFixed(2)}
                            </span>
                            <span>
                              ({isPositive ? '+' : ''}{item.changePercent!.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                        {item.volume && (
                          <div className="text-xs text-gray-500">
                            成交量: {(item.volume / 1000000).toFixed(1)}M
                          </div>
                        )}
                      </div>
                    )}

                    {/* 目標價格 */}
                    {item.targetPrice && (
                      <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600">
                        <Target size={14} />
                        <span>目標價: ${item.targetPrice.toFixed(2)}</span>
                        {hasRealTimeData && (
                          <span className={`ml-2 ${
                            isNearTarget ? 'text-yellow-600 font-medium' : 'text-gray-500'
                          }`}>
                            {isNearTarget ? '接近目標!' : 
                             `差距: $${Math.abs(item.currentPrice! - item.targetPrice).toFixed(2)}`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 備註 */}
                    {item.notes && (
                      <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleAlert(item.id)}
                      className={`p-1 rounded ${
                        item.alertEnabled 
                          ? 'text-blue-600 hover:text-blue-700' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={item.alertEnabled ? '關閉提醒' : '開啟提醒'}
                    >
                      {item.alertEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                    
                    <button
                      onClick={() => handleRemoveStock(item.id)}
                      className="p-1 rounded text-red-400 hover:text-red-600 transition-colors"
                      title="從監控列表中移除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <LocalAddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddStock}
      />
    </div>
  );
}

// 本地版本的添加股票模態框
interface LocalAddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stockData: {
    symbol: string;
    companyName: string;
    targetPrice?: number;
    notes?: string;
  }) => boolean;
}

function LocalAddStockModal({ isOpen, onClose, onAdd }: LocalAddStockModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 擴展的股票列表，參考 OpenBB 的熱門股票
  const popularStocks = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "TSLA", name: "Tesla, Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "NFLX", name: "Netflix Inc." },
    { symbol: "AMD", name: "Advanced Micro Devices" },
    { symbol: "BABA", name: "Alibaba Group" },
    { symbol: "CRM", name: "Salesforce Inc." },
    { symbol: "ORCL", name: "Oracle Corporation" },
  ];

  const filteredStocks = popularStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    setIsLoading(true);
    
    // 模擬網絡延遲
    setTimeout(() => {
      const success = onAdd({
        symbol: selectedStock.symbol,
        companyName: selectedStock.name,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        notes: notes || undefined,
      });

      if (success) {
        onClose();
        // 重置表單
        setSelectedStock(null);
        setTargetPrice("");
        setNotes("");
        setSearchTerm("");
      }
      
      setIsLoading(false);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">添加股票到監控列表</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 股票搜索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜索股票
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="輸入股票代碼或公司名稱"
            />
          </div>

          {/* 股票選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇股票
            </label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  type="button"
                  onClick={() => setSelectedStock(stock)}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                    selectedStock?.symbol === stock.symbol ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{stock.symbol}</div>
                      <div className="text-sm text-gray-600">{stock.name}</div>
                    </div>
                    {selectedStock?.symbol === stock.symbol && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedStock && (
            <>
              {/* 目標價格 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目標價格 (可選)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: 150.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  設置目標價格後將自動啟用價格提醒
                </p>
              </div>

              {/* 備註 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  備註 (可選)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="添加您的投資備註或分析..."
                />
              </div>
            </>
          )}

          {/* 提交按鈕 */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!selectedStock || isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "添加中..." : "添加到監控列表"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}