"use client";

import { StockCard } from "@/components/dashboard/StockCard";
import { RealTimeStockCard } from "@/components/dashboard/RealTimeStockCard";
import { WatchlistCard } from "@/components/dashboard/WatchlistCard";
import { EnhancedWatchlistCard } from "@/components/dashboard/EnhancedWatchlistCard";
import { StockDiscovery } from "@/components/dashboard/StockDiscovery";
import { OptimizedStockDiscovery } from "@/components/dashboard/OptimizedStockDiscovery";
import { TWStockDiscovery } from "@/components/dashboard/TWStockDiscovery";
import { TWWatchlistCard } from "@/components/dashboard/TWWatchlistCard";
import { StockComparison } from "@/components/dashboard/StockComparison";
import { PortfolioCard } from "@/components/dashboard/PortfolioCard";
import { StockChart } from "@/components/charts/StockChart";
import { RealTimeStockChart } from "@/components/charts/RealTimeStockChart";
import { TWStockChart } from "@/components/charts/TWStockChart";

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
          <p className="text-gray-600 mt-2">歡迎使用 AceStockBB - 現在支援美股和台股數據！</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要內容區域 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 雙圖表展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">AAPL 美股走勢</h2>
                <RealTimeStockChart symbol="AAPL" height={300} />
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">2330 台積電走勢</h2>
                <TWStockChart symbol="2330" height={300} />
              </div>
            </div>
            
            {/* 熱門美股 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">熱門美股 (實時數據)</h2>
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

            {/* 美股發現 - 優化版 */}
            <OptimizedStockDiscovery />

            {/* 台股發現 */}
            <TWStockDiscovery />

            {/* 股票比較 */}
            <StockComparison />
          </div>
          
          {/* 側邊欄 */}
          <div className="space-y-6">
            <EnhancedWatchlistCard />
            <TWWatchlistCard />
            <PortfolioCard />
          </div>
        </div>
      </div>
    </div>
  );
}