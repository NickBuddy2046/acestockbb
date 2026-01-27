"use client";

import { useState, useEffect } from "react";
import { Plus, Target, Bell, BellOff, Trash2 } from "lucide-react";
import { AddStockModal } from "./AddStockModal";
import { showToast } from "../ui/Toast";

interface WatchlistItem {
  id: string;
  symbol: string;
  companyName?: string;
  targetPrice?: number;
  notes?: string;
  alertEnabled?: boolean;
}

export function LocalWatchlistCard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

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
    return true;
  };

  // 移除股票
  const handleRemoveStock = (stockId: string) => {
    const newWatchlist = watchlist.filter(item => item.id !== stockId);
    saveWatchlist(newWatchlist);
    showToast.success("移除成功", "股票已從監控列表中移除");
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">我的監控列表 (本地版)</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>添加</span>
        </button>
      </div>

      <div className="space-y-3">
        {watchlist.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            還沒有添加任何股票到監控列表
          </div>
        ) : (
          watchlist.map((item) => (
            <div
              key={item.id}
              className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-blue-400"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{item.symbol}</h3>
                    {item.companyName && (
                      <span className="text-sm text-gray-600">{item.companyName}</span>
                    )}
                  </div>

                  {item.targetPrice && (
                    <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600">
                      <Target size={14} />
                      <span>目標價: ${item.targetPrice.toFixed(2)}</span>
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
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
          ))
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

  const popularStocks = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "TSLA", name: "Tesla, Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "NFLX", name: "Netflix Inc." },
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