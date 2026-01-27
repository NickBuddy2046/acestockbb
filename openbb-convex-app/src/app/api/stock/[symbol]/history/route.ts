import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params;

  try {
    // 獲取過去30天的數據
    const endTime = Math.floor(Date.now() / 1000);
    const startTime = endTime - (30 * 24 * 60 * 60); // 30天前

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTime}&period2=${endTime}&interval=1d&includePrePost=false`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const chart = data.chart?.result?.[0];

    if (!chart || !chart.timestamp) {
      return NextResponse.json({ error: 'No historical data found' }, { status: 404 });
    }

    const timestamps = chart.timestamp;
    const quotes = chart.indicators?.quote?.[0];

    if (!quotes) {
      return NextResponse.json({ error: 'No quote data found' }, { status: 404 });
    }

    const historicalData = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (quotes.close[i] !== null) {
        historicalData.push({
          date: new Date(timestamps[i] * 1000).toISOString(),
          open: quotes.open[i] || quotes.close[i],
          high: quotes.high[i] || quotes.close[i],
          low: quotes.low[i] || quotes.close[i],
          close: quotes.close[i],
          volume: quotes.volume?.[i] || 0,
        });
      }
    }

    return NextResponse.json(historicalData);
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}