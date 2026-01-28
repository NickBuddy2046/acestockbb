import { NextRequest, NextResponse } from 'next/server';
import { TWStockApiService } from '@/lib/twStockApi';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const symbol = params.symbol.toUpperCase();
    
    // 驗證股票代號格式
    if (!/^\d{4}$/.test(symbol)) {
      return NextResponse.json(
        { error: '無效的台股代號格式' },
        { status: 400 }
      );
    }

    const stockData = await TWStockApiService.getRealTimePrice(symbol);
    
    if (!stockData) {
      return NextResponse.json(
        { error: '無法獲取股票數據' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockData);

  } catch (error) {
    console.error('TW Stock API error:', error);
    return NextResponse.json(
      { error: '服務器錯誤' },
      { status: 500 }
    );
  }
}