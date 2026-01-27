import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    // 檢查是否有授權 (可選，用於安全性)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.DAILY_REFRESH_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: '未授權訪問' },
        { status: 401 }
      );
    }
    
    // 執行每日數據刷新
    const result = await convex.action(api.dailyDataRefresh.performDailyRefresh, {});
    
    return NextResponse.json({
      success: result.success,
      message: result.message,
      symbolsUpdated: result.symbolsUpdated,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Daily refresh error:', error);
    return NextResponse.json(
      { 
        error: '數據刷新失敗', 
        details: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 檢查今日刷新狀態
    const status = await convex.query(api.dailyDataRefresh.checkTodayRefreshStatus, {});
    
    return NextResponse.json({
      hasRefreshedToday: !!status,
      lastRefresh: status,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Check refresh status error:', error);
    return NextResponse.json(
      { 
        error: '檢查狀態失敗', 
        details: error instanceof Error ? error.message : '未知錯誤' 
      },
      { status: 500 }
    );
  }
}