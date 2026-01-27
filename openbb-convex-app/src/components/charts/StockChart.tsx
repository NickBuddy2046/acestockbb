"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

interface StockChartProps {
  symbol: string;
  interval?: string;
  height?: number;
}

export function StockChart({ symbol, interval = "1d", height = 400 }: StockChartProps) {
  const [fallbackData, setFallbackData] = useState<any[] | null>(null);
  
  // 使用模擬數據進行演示
  const data = useQuery(api.stocks.getMockStockData, { symbol });

  // 生成備用數據
  useEffect(() => {
    const generateFallbackData = () => {
      const basePrice = symbol === 'AAPL' ? 150 : symbol === 'GOOGL' ? 2750 : symbol === 'MSFT' ? 310 : 245;
      const fallback = [];
      const now = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        const randomChange = (Math.random() - 0.5) * (basePrice * 0.05);
        const price = Math.max(basePrice + randomChange, basePrice * 0.8);
        
        fallback.push({
          date: date.toISOString(),
          close: Math.round(price * 100) / 100,
        });
      }
      
      return fallback;
    };

    // 5秒後如果還沒有數據，設置備用數據
    const timer = setTimeout(() => {
      if (!data) {
        setFallbackData(generateFallbackData());
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [data, symbol]);

  // 使用 Convex 數據或備用數據
  const chartData = data || fallbackData;

  if (!chartData) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <div className="text-gray-500">載入 {symbol} 數據中...</div>
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

  const formatTooltipValue = (value: any) => {
    if (typeof value === 'number') {
      return [`$${value.toFixed(2)}`, '收盤價'];
    }
    return [value, '收盤價'];
  };

  return (
    <div style={{ height }} className="w-full">
      {!data && fallbackData && (
        <div className="text-xs text-gray-500 mb-2 text-center">
          使用模擬數據 - Convex 連接中
        </div>
      )}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
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
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, stroke: '#2563eb', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}