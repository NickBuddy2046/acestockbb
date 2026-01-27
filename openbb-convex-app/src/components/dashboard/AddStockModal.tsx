"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Search, Plus } from "lucide-react";
import { showToast } from "../ui/Toast";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

export function AddStockModal({ isOpen, onClose, onSuccess }: AddStockModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStock, setSelectedStock] = useState<{ symbol: string; name: string } | null>(null);
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addToWatchlist = useMutation(api.watchlists.addToWatchlist);

  const filteredStocks = popularStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    setIsLoading(true);
    try {
      const result = await addToWatchlist({
        symbol: selectedStock.symbol,
        companyName: selectedStock.name,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        notes: notes || undefined,
      });

      console.log("Add result:", result);
      showToast.success("添加成功", `${selectedStock.symbol} 已添加到監控列表`);
      onSuccess?.();
      onClose();
      
      // 重置表單
      setSelectedStock(null);
      setTargetPrice("");
      setNotes("");
      setSearchTerm("");
    } catch (error: any) {
      console.error("Error adding stock to watchlist:", error);
      
      let errorMessage = "請稍後再試";
      if (error?.message) {
        if (error.message.includes("已經在監控列表中")) {
          errorMessage = `${selectedStock.symbol} 已經在您的監控列表中`;
          showToast.warning("股票已存在", errorMessage);
        } else {
          errorMessage = error.message;
          showToast.error("添加失敗", errorMessage);
        }
      } else {
        showToast.error("添加失敗", errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
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
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 股票搜索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              搜索股票
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="輸入股票代碼或公司名稱"
              />
            </div>
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
                      <div className="text-blue-600">
                        <Plus size={20} />
                      </div>
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