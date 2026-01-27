"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { StockApiService, StockPrice } from "@/lib/stockApi";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ComparisonStock extends StockPrice {
  color: string;
  historicalData?: any[];
}

const stockColors = [
  '#2563eb', // blue
  '#dc2626', // red  
  '#16a34a', // green
  '#ca8a04', // yellow
  '#9333ea', // purple
];

export function StockComparison() {
  const [comparisonStocks, setComparisonStocks] = useState<ComparisonStock[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  // 熱門股票建議
  const suggestedStocks = [
    { symbol: "AAPL", name: "Apple Inc." },
    { symbol: "GOOGL", name: "Alphabet Inc." },
    { symbol: "MSFT", name: "Microsoft Corporation" },
    { symbol: "TSLA", name: "Tesla, Inc." },
    { symbol: "AMZN", name: "Amazon.com Inc." },
    { symbol: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "META", name: "Meta Platforms Inc." },
    { symbol: "NFLX", name: "Netflix Inc." },
  ];

  const filteredSuggestions = suggestedStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 添加股票到比較列表
  const addStock = async (symbol: string, name: string) => {
    if (comparisonStocks.length >= 5) {
      alert("最多只能比較5支股票");
      return;
    }

    if (comparisonStocks.find(stock => stock.symbol === symbol)) {
      alert("該股票已在比較列表中");
      return;
    }

    setIsLoading(true);
    try {
      const stockData = await StockApiService.getRealTimePrice(symbol);
      const historicalData = await StockApiService.getHistoricalData(symbol);

      if (stockData) {
        const newStock: ComparisonStock = {
          ...stockData,
          companyName: name,
          color: stockColors[comparisonStocks.length],
          historicalData,
        };

        setComparisonStocks(prev => [...prev, newStock]);
        setSearchTerm("");
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 移除股票
  const removeStock = (symbol: string) => {
    setComparisonStocks(prev => prev.filter(stock => stock.symbol !== symbol));
  };

  // 生成圖表數據
  useEffect(() => {
    if (comparisonStocks.length === 0) {
      setChartData([]);
      return;
    }

    // 找到所有股票的歷史數據中的共同日期
    const allDates = new Set<string>();
    comparisonStocks.forEach(stock => {
      if (stock.historicalData) {
        stock.historicalData.forEach((data: any) => {
          allDates.add(data.date.split('T')[0]);
        });
      }
    });

    const sortedDates = Array.from(allDates).sort();
    
    // 為每個日期創建數據點
    const chartData = sortedDates.map(date => {
      const dataPoint: any = { date };
      
      comparisonStocks.forEach(stock => {
        if (stock.historicalData) {
          const dayData = stock.historicalData.find((data: any) => 
            data.date.split('T')[0] === date
          );
          if (dayData) {
            dataPoint[stock.symbol] = dayData.close;
          }
        }
      });
      
      return dataPoint;
    });

    setChartData(chartData.slice(-30)); // 最近30天
  }, [comparisonStocks]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">股票比較分析</h2>
        <div className="text-sm text-gray-500">
          參考 OpenBB Compare 功能
        </div>
      </div>

      {/* 搜索和添加 */}
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索股票代碼或公司名稱..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 建議股票 */}
        {searchTerm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {filteredSuggestions.slice(0, 8).map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => addStock(stock.symbol, stock.name)}
                disabled={isLoading}
                className="p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <div className="font-semibold text-sm">{stock.symbol}</div>
                <div className="text-xs text-gray-600 truncate">{stock.name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 比較列表 */}
      {comparisonStocks.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">比較股票 ({comparisonStocks.length}/5)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonStocks.map((stock) => {
              const isPositive = (stock.changePercent || 0) >= 0;
              
              return (
                <div
                  key={stock.symbol}
                  className="p-4 border rounded-lg"
                  style={{ borderLeftColor: stock.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{stock.symbol}</h4>
                      <p className="text-sm text-gray-600 truncate">{stock.companyName}</p>
                    </div>
                    <button
                      onClick={() => removeStock(stock.symbol)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xl font-bold">${stock.price.toFixed(2)}</div>
                    <div className={`flex items-center space-x-1 text-sm ${
                      isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isPositive ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      <span>
                        {isPositive ? '+' : ''}${stock.change?.toFixed(2)}
                      </span>
                      <span>
                        ({isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%)
                      </span>
                    </div>

                    {stock.volume && (
                      <div className="text-xs text-gray-500">
                        成交量: {(stock.volume / 1000000).toFixed(1)}M
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 比較圖表 */}
      {chartData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4 flex items-center space-x-2">
            <BarChart3 size={20} />
            <span>價格走勢比較 (30天)</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleDateString('zh-CN')}
                  formatter={(value: any, name?: string) => [`$${value?.toFixed(2)}`, name || '']}
                />
                <Legend />
                {comparisonStocks.map((stock) => (
                  <Line
                    key={stock.symbol}
                    type="monotone"
                    dataKey={stock.symbol}
                    stroke={stock.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 比較表格 */}
      {comparisonStocks.length > 1 && (
        <div>
          <h3 className="text-lg font-medium mb-4">詳細比較</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">指標</th>
                  {comparisonStocks.map((stock) => (
                    <th key={stock.symbol} className="text-right py-2">{stock.symbol}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">當前價格</td>
                  {comparisonStocks.map((stock) => (
                    <td key={stock.symbol} className="text-right py-2">
                      ${stock.price.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">今日變化</td>
                  {comparisonStocks.map((stock) => {
                    const isPositive = (stock.changePercent || 0) >= 0;
                    return (
                      <td key={stock.symbol} className={`text-right py-2 ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">成交量</td>
                  {comparisonStocks.map((stock) => (
                    <td key={stock.symbol} className="text-right py-2">
                      {stock.volume ? `${(stock.volume / 1000000).toFixed(1)}M` : 'N/A'}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 font-medium">52週高點</td>
                  {comparisonStocks.map((stock) => (
                    <td key={stock.symbol} className="text-right py-2">
                      {stock.high52Week ? `$${stock.high52Week.toFixed(2)}` : 'N/A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 空狀態 */}
      {comparisonStocks.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">開始比較股票</h3>
          <p className="text-gray-500 mb-4">
            搜索並添加股票來進行並排比較分析
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestedStocks.slice(0, 4).map((stock) => (
              <button
                key={stock.symbol}
                onClick={() => addStock(stock.symbol, stock.name)}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
              >
                + {stock.symbol}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}