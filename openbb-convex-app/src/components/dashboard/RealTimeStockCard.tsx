"use client";

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { StockApiService, generateFallbackStockPrice, StockPrice } from '@/lib/stockApi';

interface RealTimeStockCardProps {
  symbol: string;
  companyName?: string;
}

export function RealTimeStockCard({ symbol, companyName }: RealTimeStockCardProps) {
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      try {
        const data = await StockApiService.getRealTimePrice(symbol);
        
        if (data) {
          setStockData(data);
          setIsUsingFallback(false);
        } else {
          // 使用備用數據
          const fallbackData = generateFallbackStockPrice(symbol);
          setStockData(fallbackData);
          setIsUsingFallback(true);
        }
      } catch (error) {
        console.error(`Error fetching real-time data for ${symbol}:`, error);
        const fallbackData = generateFallbackStockPrice(symbol);
        setStockData(fallbackData);
        setIsUsingFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // 每30秒更新一次
    const interval = setInterval(fetchData, 30 * 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-6 bg-gray-200 rounded mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-center text-gray-500">
          <div className="font-semibold">{symbol}</div>
          <div className="text-sm">數據載入失敗</div>
        </div>
      </div>
    );
  }

  const isPositive = stockData.change >= 0;

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      {/* 狀態指示器 */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-gray-900">{symbol}</div>
          {companyName && (
            <div className="text-xs text-gray-600 truncate">{companyName}</div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${isUsingFallback ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span className="text-xs text-gray-500">
            {isUsingFallback ? '模擬' : '實時'}
          </span>
        </div>
      </div>

      {/* 價格信息 */}
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">
          ${stockData.price.toFixed(2)}
        </div>
        
        <div className={`flex items-center space-x-1 text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? (
            <TrendingUp size={16} />
          ) : (
            <TrendingDown size={16} />
          )}
          <span>
            {isPositive ? '+' : ''}${stockData.change.toFixed(2)}
          </span>
          <span>
            ({isPositive ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
          </span>
        </div>

        {/* 額外信息 */}
        {stockData.volume && (
          <div className="text-xs text-gray-500 mt-2">
            成交量: {(stockData.volume / 1000000).toFixed(1)}M
          </div>
        )}
      </div>
    </div>
  );
}