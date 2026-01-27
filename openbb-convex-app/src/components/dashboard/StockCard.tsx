interface StockCardProps {
  symbol: string
  price: number
  change: number
  changePercent: number
}

export function StockCard({ symbol, price, change, changePercent }: StockCardProps) {
  const isPositive = change >= 0

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{symbol}</h3>
        <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '↗' : '↘'}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="text-2xl font-bold text-gray-900">
          ${price.toFixed(2)}
        </div>
        <div className={`text-sm flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          <span>{isPositive ? '+' : ''}${change.toFixed(2)}</span>
          <span>({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  )
}