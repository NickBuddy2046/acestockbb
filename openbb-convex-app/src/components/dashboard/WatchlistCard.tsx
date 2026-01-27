"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, Target, Bell, BellOff, Trash2 } from "lucide-react";
import { AddStockModal } from "./AddStockModal";
import { showToast } from "../ui/Toast";

export function WatchlistCard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // 使用公共監控列表進行演示
  const watchlist = useQuery(api.watchlists.getPublicWatchlist);
  const removeFromWatchlist = useMutation(api.watchlists.removeFromWatchlist);

  const handleRemoveStock = async (stockId: string) => {
    try {
      await removeFromWatchlist({ id: stockId as any });
      showToast.success("移除成功", "股票已從監控列表中移除");
    } catch (error) {
      console.error("Error removing stock from watchlist:", error);
      showToast.error("移除失敗", "請稍後再試");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">我的監控列表</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>添加</span>
        </button>
      </div>

      <div className="space-y-3">
        {watchlist === undefined ? (
          // Loading state
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-16 rounded"></div>
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          // Empty state
          <div className="text-center text-gray-500 py-8">
            還沒有添加任何股票到監控列表
          </div>
        ) : (
          // Watchlist items
          watchlist.map((item) => (
            <div
              key={item._id}
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
                    onClick={() => handleRemoveStock(item._id)}
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

      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Toast notification is handled in AddStockModal
        }}
      />
    </div>
  );
}