"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { StockApiService, generateFallbackHistoricalData } from '@/lib/stockApi';

interface RealTimeStockChartProps {
  symbol: string;
  height?: number;
}

export function RealTimeStockChart({ symbol, height = 400 }: RealTimeStockChartProps) {
  const [data, setData] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log(`Fetching real-time data for ${symbol}...`);
        const historicalData = await StockApiService.getHistoricalData(symbol);

        if (historicalData && historicalData.length > 0) {
          console.log(`Successfully fetched ${historicalData.length} data points for ${symbol}`);
          setData(historicalData);
          setIsUsingFallback(false);
        } else {
          console.log(`No real data available for ${symbol}, using fallback`);
          const fallbackData = generateFallbackHistoricalData(symbol);
          setData(fallbackData);
          setIsUsingFallback(true);
        }
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        const fallbackData = generateFallbackHistoricalData(symbol);
        setData(fallbackData);
        setIsUsingFallback(true);
        setError('使用模擬數據 - API 暫時不可用');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // 每5分鐘更新一次數據
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-gray-500">載入 {symbol} 實時數據中...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height }}>
        <div className="text-gray-500 mb-4">無法載入 {symbol} 數據</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          重新載入
        </button>
      </div>
    );
  }

  const formatXAxisLabel = (tickItem: string) => {
    try {
      return format(new Date(tickItem), 'MM/dd');
    } catch {
      return tickItem;
    }
  };

  const formatTooltipLabel = (label: any) => {
    try {
      return format(new Date(label), 'yyyy-MM-dd');
    } catch {
      return label;
    }
  };

  const formatTooltipValue = (value: any, name?: string) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, name === 'close' ? '收盤價' : (name || 'value')];
    }
    return [value, name || 'value'];
  };

  // 計算價格變化
  const firstPrice = data[0]?.close || 0;
  const lastPrice = data[data.length - 1]?.close || 0;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

  return (
    <div style={{ height }} className="w-full">
      {/* 狀態指示器 */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isUsingFallback ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          <span className="text-xs text-gray-600">
            {isUsingFallback ? '模擬數據' : '實時數據'}
          </span>
          {error && (
            <span className="text-xs text-yellow-600">({error})</span>
          )}
        </div>
        
        {/* 價格變化指示 */}
        <div className="text-sm">
          <span className="text-gray-600">30天變化: </span>
          <span className={priceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
            {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} 
            ({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height - 40}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxisLabel}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip 
            labelFormatter={formatTooltipLabel}
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke={priceChange >= 0 ? "#10b981" : "#ef4444"}
            strokeWidth={2}
            dot={false}
            activeDot={{ 
              r: 4, 
              stroke: priceChange >= 0 ? "#10b981" : "#ef4444", 
              strokeWidth: 2 
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}