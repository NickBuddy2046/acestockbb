import { NextRequest, NextResponse } from 'next/server';
import { TWStockApiService } from '@/lib/twStockApi';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await context.params;
    const symbol = rawSymbol.toUpperCase();
    const { searchParams } = new URL(request.url);
    
    // 獲取查詢參數
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
    
    // 驗證股票代號格式
    if (!/^\d{4}$/.test(symbol)) {
      return NextResponse.json(
        { error: '無效的台股代號格式' },
        { status: 400 }
      );
    }

    const historicalData = await TWStockApiService.getHistoricalData(symbol, year, month);
    
    return NextResponse.json(historicalData);

  } catch (error) {
    console.error('TW Stock History API error:', error);
    return NextResponse.json(
      { error: '服務器錯誤' },
      { status: 500 }
    );
  }
}