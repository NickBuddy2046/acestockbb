"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";

// 模擬投資組合數據
const mockPortfolio = [
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    quantity: 10,
    averageCost: 145.50,
    currentPrice: 150.25,
    totalValue: 1502.50,
    gainLoss: 47.50,
    gainLossPercent: 3.26,
  },
  {
    symbol: "GOOGL",
    companyName: "Alphabet Inc.",
    quantity: 2,
    averageCost: 2800.00,
    currentPrice: 2750.80,
    totalValue: 5501.60,
    gainLoss: -98.40,
    gainLossPercent: -1.76,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    quantity: 5,
    averageCost: 305.20,
    currentPrice: 310.45,
    totalValue: 1552.25,
    gainLoss: 26.25,
    gainLossPercent: 1.72,
  },
];

export function PortfolioCard() {
  const [selectedView, setSelectedView] = useState<"holdings" | "performance">("holdings");

  const totalValue = mockPortfolio.reduce((sum, holding) => sum + holding.totalValue, 0);
  const totalGainLoss = mockPortfolio.reduce((sum, holding) => sum + holding.gainLoss, 0);
  const totalGainLossPercent = (totalGainLoss / (totalValue - totalGainLoss)) * 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">我的投資組合</h2>
        <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors">
          <Plus size={16} />
          <span>添加持股</span>
        </button>
      </div>

      {/* 投資組合總覽 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign size={20} className="text-green-600" />
            <span className="text-sm font-medium text-gray-600">總價值</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            {totalGainLoss >= 0 ? (
              <TrendingUp size={20} className="text-green-600" />
            ) : (
              <TrendingDown size={20} className="text-red-600" />
            )}
            <span className="text-sm font-medium text-gray-600">總損益</span>
          </div>
          <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)}
          </div>
          <div className={`text-sm ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ({totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* 視圖切換 */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setSelectedView("holdings")}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedView === "holdings"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          持股明細
        </button>
        <button
          onClick={() => setSelectedView("performance")}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            selectedView === "performance"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          績效分析
        </button>
      </div>

      {/* 持股明細 */}
      {selectedView === "holdings" && (
        <div className="space-y-3">
          {mockPortfolio.map((holding) => (
            <div
              key={holding.symbol}
              className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-blue-400"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{holding.symbol}</h3>
                    <span className="text-sm text-gray-600">{holding.companyName}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {holding.quantity} 股 @ ${holding.averageCost.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${holding.totalValue.toFixed(2)}
                  </div>
                  <div className={`text-sm ${holding.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)}
                    ({holding.gainLoss >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>當前價格: ${holding.currentPrice.toFixed(2)}</span>
                <span>成本基礎: ${(holding.averageCost * holding.quantity).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 績效分析 */}
      {selectedView === "performance" && (
        <div className="space-y-4">
          <div className="text-center py-8">
            <PieChart size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">績效分析圖表即將推出</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-green-800 font-semibold">最佳表現</div>
                <div className="text-green-600">AAPL (+3.26%)</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-red-800 font-semibold">最差表現</div>
                <div className="text-red-600">GOOGL (-1.76%)</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}