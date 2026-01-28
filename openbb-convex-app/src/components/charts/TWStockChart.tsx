"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TWStockApiService, TWStockHistoricalData } from "@/lib/twStockApi";
import { MapPin, TrendingUp, TrendingDown } from "lucide-react";

interface TWStockChartProps {
  symbol: string;
  height?: number;
}

export function TWStockChart({ symbol, height = 300 }: TWStockChartProps) {
  const [data, setData] = useState<TWStockHistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // 獲取歷史數據
        const historicalData = await TWStockApiService.getHistoricalData(symbol);
        setData(historicalData);

        // 獲取當前價格
        const currentData = await TWStockApiService.getRealTimePrice(symbol);
        if (currentData) {
          setCurrentPrice(currentData.price);
          setPriceChange(currentData.changePercent);
        }

      } catch (error) {
        console.error('Error fetching TW stock chart data:', error);
        setError('無法載入圖表數據');
      } finally {
        setIsLoading(false);
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'close') {
      return [`$${value.toFixed(2)}`, '收盤價'];
    }
    return [value, name];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-gray-500">
          <MapPin size={48} className="mx-auto text-gray-300 mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isPositive = (priceChange || 0) >= 0;
  const lineColor = isPositive ? '#16a34a' : '#dc2626';

  return (
    <div>
      {/* 股票信息頭部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <MapPin size={16} className="text-red-500" />
          <h3 className="font-semibold text-gray-900">{symbol}</h3>
        </div>
        
        {currentPrice && (
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              ${currentPrice.toFixed(2)}
            </div>
            {priceChange !== null && (
              <div className={`flex items-center space-x-1 text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                <span>
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 圖表 */}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            stroke="#666"
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={(label) => `日期: ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 圖表底部信息 */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        台灣證券交易所歷史數據 • 最近 {data.length} 個交易日
      </div>
    </div>
  );
}