"use client";

import { StockCard } from "@/components/dashboard/StockCard";
import { RealTimeStockCard } from "@/components/dashboard/RealTimeStockCard";
import { WatchlistCard } from "@/components/dashboard/WatchlistCard";
import { EnhancedWatchlistCard } from "@/components/dashboard/EnhancedWatchlistCard";
import { StockDiscovery } from "@/components/dashboard/StockDiscovery";
import { StockComparison } from "@/components/dashboard/StockComparison";
import { PortfolioCard } from "@/components/dashboard/PortfolioCard";
import { StockChart } from "@/components/charts/StockChart";
import { RealTimeStockChart } from "@/components/charts/RealTimeStockChart";

const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'TSLA', name: 'Tesla, Inc.' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">投資儀表板</h1>
          <p className="text-gray-600 mt-2">歡迎使用 OpenBB Web App - 現在使用實時股票數據和增強功能！</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要內容區域 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">AAPL 實時股價走勢</h2>
              <RealTimeStockChart symbol="AAPL" height={400} />
            </div>
            
            {/* 熱門股票 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">熱門股票 (實時數據)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockStocks.map((stock) => (
                  <RealTimeStockCard
                    key={stock.symbol}
                    symbol={stock.symbol}
                    companyName={stock.name}
                  />
                ))}
              </div>
            </div>

            {/* 股票發現 */}
            <StockDiscovery />

            {/* 股票比較 */}
            <StockComparison />
          </div>
          
          {/* 側邊欄 */}
          <div className="space-y-6">
            <EnhancedWatchlistCard />
            <PortfolioCard />
          </div>
        </div>
      </div>
    </div>
  );
}