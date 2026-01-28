import { NextRequest, NextResponse } from 'next/server';
import { TWStockApiService } from '@/lib/twStockApi';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: '請提供有效的股票代號陣列' },
        { status: 400 }
      );
    }

    // 驗證股票代號格式
    const validSymbols = symbols.filter((symbol: string) => 
      typeof symbol === 'string' && /^\d{4}$/.test(symbol.toUpperCase())
    );

    if (validSymbols.length === 0) {
      return NextResponse.json(
        { error: '沒有有效的台股代號' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const stockData = await TWStockApiService.getMultiplePrices(validSymbols);
    const endTime = Date.now();

    const response = {
      success: stockData,
      total: validSymbols.length,
      successCount: stockData.length,
      errorCount: validSymbols.length - stockData.length,
      responseTime: endTime - startTime,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('TW Stocks Batch API error:', error);
    return NextResponse.json(
      { error: '服務器錯誤' },
      { status: 500 }
    );
  }
}