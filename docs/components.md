# 核心組件代碼示例

// ===== src/hooks/useStockData.ts =====
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAction } from "convex/react"

export function useStockData(symbol: string, interval: string = "1d") {
  // 首先嘗試從緩存獲取數據
  const cachedData = useQuery(api.stocks.getStockData, { symbol, interval })
  
  // 獲取新數據的 action
  const fetchData = useAction(api.stocks.fetchStockData)
  
  // 如果沒有緩存數據，觸發獲取
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!cachedData && !isLoading) {
      setIsLoading(true)
      fetchData({ symbol, interval })
        .then((result) => {
          setData(result)
          setError(null)
        })
        .catch((err) => {
          setError(err.message)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else if (cachedData) {
      setData(cachedData)
      setError(null)
      setIsLoading(false)
    }
  }, [cachedData, symbol, interval, fetchData, isLoading])

  return { data, isLoading, error, refetch: () => fetchData({ symbol, interval }) }
}

// ===== components/charts/ConvexStockChart.tsx =====
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useStockData } from '@/hooks/useStockData'
import { format } from 'date-fns'

interface ConvexStockChartProps {
  symbol: string
  interval?: string
  height?: number
}

export function ConvexStockChart({ symbol, interval = '1d', height = 400 }: ConvexStockChartProps) {
  const { data, isLoading, error } = useStockData(symbol, interval)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-red-500">載入圖表時發生錯誤: {error}</div>
      </div>
    )
  }

  const formatXAxisLabel = (tickItem: string) => {
    return format(new Date(tickItem), 'MM/dd')
  }

  const formatTooltipLabel = (label: string) => {
    return format(new Date(label), 'yyyy-MM-dd')
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data || []}>
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
            formatter={(value: number) => [`$${value.toFixed(2)}`, '收盤價']}
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
  )
}

// ===== components/dashboard/ConvexWatchlistCard.tsx =====
'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Plus, X, Target, Bell, BellOff } from 'lucide-react'
import { Id } from '../../../convex/_generated/dataModel'

interface WatchlistItem {
  _id: Id<"watchlists">
  symbol: string
  companyName?: string
  targetPrice?: number
  notes?: string
  alertEnabled?: boolean
}

export function ConvexWatchlistCard() {
  const [newSymbol, setNewSymbol] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  // 實時獲取監控列表 - Convex 自動處理實時更新
  const watchlist = useQuery(api.watchlists.getMyWatchlist)
  
  // Mutations - 樂觀更新
  const addToWatchlist = useMutation(api.watchlists.addToWatchlist)
  const removeFromWatchlist = useMutation(api.watchlists.removeFromWatchlist)
  const updateWatchlistItem = useMutation(api.watchlists.updateWatchlistItem)

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newSymbol.trim()) {
      try {
        await addToWatchlist({ symbol: newSymbol.trim().toUpperCase() })
        setNewSymbol('')
        setIsAdding(false)
      } catch (error) {
        console.error('Failed to add to watchlist:', error)
        // 可以添加 toast 通知
      }
    }
  }

  const handleRemove = async (id: Id<"watchlists">) => {
    try {
      await removeFromWatchlist({ id })
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
    }
  }

  const toggleAlert = async (item: WatchlistItem) => {
    try {
      await updateWatchlistItem({
        id: item._id,
        alertEnabled: !item.alertEnabled,
      })
    } catch (error) {
      console.error('Failed to toggle alert:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">我的監控列表</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span>添加</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddSymbol} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              placeholder="輸入股票代碼 (如: AAPL)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              添加
            </button>
          </div>
        </form>
      )}

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
            <WatchlistItemCard
              key={item._id}
              item={item}
              onRemove={handleRemove}
              onToggleAlert={toggleAlert}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ===== components/dashboard/WatchlistItemCard.tsx =====
interface WatchlistItemCardProps {
  item: WatchlistItem
  onRemove: (id: Id<"watchlists">) => void
  onToggleAlert: (item: WatchlistItem) => void
}

function WatchlistItemCard({ item, onRemove, onToggleAlert }: WatchlistItemCardProps) {
  const { data: stockData } = useStockData(item.symbol, '1d')
  
  const currentPrice = stockData?.[stockData.length - 1]?.close
  const previousPrice = stockData?.[stockData.length - 2]?.close
  const change = currentPrice && previousPrice ? currentPrice - previousPrice : 0
  const changePercent = previousPrice ? (change / previousPrice) * 100 : 0
  const isPositive = change >= 0

  const isNearTarget = item.targetPrice && currentPrice && 
    Math.abs(currentPrice - item.targetPrice) / item.targetPrice < 0.05 // 5% 範圍內

  return (
    <div className={`relative bg-gray-50 rounded-lg p-4 border-l-4 ${
      isNearTarget ? 'border-l-yellow-400' : 'border-l-transparent'
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">{item.symbol}</h3>
            {item.companyName && (
              <span className="text-sm text-gray-600">{item.companyName}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {currentPrice && (
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">${currentPrice.toFixed(2)}</span>
                <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}${change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {item.targetPrice && (
            <div className="flex items-center space-x-1 mt-2 text-sm text-gray-600">
              <Target size={14} />
              <span>目標價: ${item.targetPrice.toFixed(2)}</span>
              {isNearTarget && (
                <span className="text-yellow-600 font-medium">接近目標!</span>
              )}
            </div>
          )}

          {item.notes && (
            <p className="text-sm text-gray-600 mt-1">{item.notes}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleAlert(item)}
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
            onClick={() => onRemove(item._id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="移除"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== components/dashboard/ConvexPortfolioCard.tsx =====
'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function ConvexPortfolioCard() {
  const portfolios = useQuery(api.portfolios.getMyPortfolios)
  const defaultPortfolio = portfolios?.find(p => p.isDefault) || portfolios?.[0]
  
  const holdings = useQuery(
    api.portfolios.getPortfolioHoldings,
    defaultPortfolio ? { portfolioId: defaultPortfolio._id } : "skip"
  )

  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">我的投資組合</h2>
        <div className="text-center text-gray-500 py-8">
          還沒有創建投資組合
        </div>
      </div>
    )
  }

  const portfolioData = holdings?.map((holding, index) => ({
    name: holding.symbol,
    value: (holding.currentPrice || holding.averageCost || 0) * holding.quantity,
    color: COLORS[index % COLORS.length]
  })) || []

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">我的投資組合</h2>
      
      {defaultPortfolio && (
        <div className="mb-4">
          <h3 className="font-medium text-gray-700">{defaultPortfolio.name}</h3>
          <p className="text-2xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
        </div>
      )}

      {portfolioData.length > 0 && (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={portfolioData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {portfolioData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '價值']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {holdings?.map((holding) => (
          <div key={holding._id} className="flex justify-between items-center text-sm">
            <span className="font-medium">{holding.symbol}</span>
            <div className="text-right">
              <div>{holding.quantity} 股</div>
              <div className="text-gray-600">
                ${((holding.currentPrice || holding.averageCost || 0) * holding.quantity).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== app/dashboard/page.tsx =====
import { ConvexStockChart } from '@/components/charts/ConvexStockChart'
import { ConvexWatchlistCard } from '@/components/dashboard/ConvexWatchlistCard'
import { ConvexPortfolioCard } from '@/components/dashboard/ConvexPortfolioCard'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">投資儀表板</h1>
          <p className="text-gray-600 mt-2">實時數據，智能分析</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要圖表區域 */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">AAPL 股價走勢</h2>
              <ConvexStockChart symbol="AAPL" height={400} />
            </div>
          </div>
          
          {/* 側邊欄 */}
          <div className="space-y-6">
            <ConvexWatchlistCard />
            <ConvexPortfolioCard />
          </div>
        </div>
      </div>
    </div>
  )
}