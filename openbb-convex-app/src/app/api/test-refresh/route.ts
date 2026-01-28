import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    console.log('Testing simple refresh...');
    
    // 執行簡單的測試刷新
    const result = await convex.action(api.simpleRefresh.testRefresh, {});
    
    console.log('Test refresh result:', result);
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      symbolsUpdated: result.symbolsUpdated,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Test refresh error:', error);
    return NextResponse.json(
      { 
        error: '測試刷新失敗', 
        details: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 檢查測試數據
    const testData = await convex.query(api.simpleRefresh.getTestData, { symbol: 'AAPL' });
    
    return NextResponse.json({
      hasTestData: !!testData,
      testData: testData,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Get test data error:', error);
    return NextResponse.json(
      { 
        error: '獲取測試數據失敗', 
        details: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}