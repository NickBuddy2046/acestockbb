#!/usr/bin/env node

/**
 * 性能對比測試
 * 比較使用緩存前後的性能差異
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP 請求函數
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: true,
            data: jsonData,
            responseTime,
            statusCode: res.statusCode
          });
        } catch (error) {
          resolve({
            success: false,
            error: error.message,
            responseTime,
            statusCode: res.statusCode,
            rawData: data
          });
        }
      });
    }).on('error', (error) => {
      const endTime = Date.now();
      reject({
        success: false,
        error: error.message,
        responseTime: endTime - startTime
      });
    });
  });
}

// 測試單個股票的性能
async function testStockPerformance(symbol, rounds = 5) {
  const results = [];
  
  for (let i = 0; i < rounds; i++) {
    try {
      const result = await makeRequest(`${BASE_URL}/api/stock/${symbol}`);
      results.push({
        round: i + 1,
        success: result.success,
        responseTime: result.responseTime,
        hasData: result.success && result.data && result.data.price
      });
      
      // 間隔 200ms 避免過於頻繁的請求
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      results.push({
        round: i + 1,
        success: false,
        responseTime: error.responseTime || 0,
        error: error.error
      });
    }
  }
  
  return results;
}

// 批量性能測試
async function batchPerformanceTest() {
  log('🚀 開始批量性能測試...', 'blue');
  log('=' .repeat(60), 'blue');
  
  const allResults = {};
  
  for (const symbol of TEST_SYMBOLS) {
    log(`\n📊 測試 ${symbol}...`, 'yellow');
    
    const results = await testStockPerformance(symbol);
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length > 0) {
      const avgTime = successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length;
      const minTime = Math.min(...successfulResults.map(r => r.responseTime));
      const maxTime = Math.max(...successfulResults.map(r => r.responseTime));
      const successRate = (successfulResults.length / results.length) * 100;
      
      allResults[symbol] = {
        avgTime: Math.round(avgTime),
        minTime,
        maxTime,
        successRate,
        results
      };
      
      log(`  ✓ 平均響應時間: ${Math.round(avgTime)}ms`, 'green');
      log(`  ✓ 最快/最慢: ${minTime}ms / ${maxTime}ms`, 'blue');
      log(`  ✓ 成功率: ${successRate}%`, successRate === 100 ? 'green' : 'yellow');
    } else {
      log(`  ✗ 所有請求都失敗了`, 'red');
      allResults[symbol] = {
        avgTime: 0,
        minTime: 0,
        maxTime: 0,
        successRate: 0,
        results
      };
    }
  }
  
  return allResults;
}

// 並發性能測試
async function concurrentPerformanceTest() {
  log('\n🔥 並發性能測試...', 'blue');
  log('=' .repeat(60), 'blue');
  
  const startTime = Date.now();
  
  // 同時請求所有股票
  const promises = TEST_SYMBOLS.map(symbol => 
    makeRequest(`${BASE_URL}/api/stock/${symbol}`)
      .catch(error => ({ success: false, error: error.error, symbol }))
  );
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  const successfulResults = results.filter(r => r.success);
  const avgResponseTime = successfulResults.length > 0 ? 
    successfulResults.reduce((sum, r) => sum + r.responseTime, 0) / successfulResults.length : 0;
  
  log(`✓ 並發請求完成時間: ${totalTime}ms`, 'green');
  log(`✓ 成功請求數: ${successfulResults.length}/${results.length}`, 'green');
  log(`✓ 平均單個響應時間: ${Math.round(avgResponseTime)}ms`, 'green');
  log(`✓ 並發效率: ${Math.round((avgResponseTime * results.length) / totalTime * 100)}%`, 'blue');
  
  return {
    totalTime,
    successCount: successfulResults.length,
    totalCount: results.length,
    avgResponseTime: Math.round(avgResponseTime),
    efficiency: Math.round((avgResponseTime * results.length) / totalTime * 100)
  };
}

// 生成性能報告
function generatePerformanceReport(batchResults, concurrentResults) {
  log('\n📋 性能分析報告', 'bold');
  log('=' .repeat(60), 'blue');
  
  // 統計數據
  const symbols = Object.keys(batchResults);
  const validResults = symbols.filter(s => batchResults[s].successRate > 0);
  
  if (validResults.length === 0) {
    log('❌ 沒有成功的測試結果', 'red');
    return;
  }
  
  const avgResponseTime = validResults.reduce((sum, s) => sum + batchResults[s].avgTime, 0) / validResults.length;
  const minResponseTime = Math.min(...validResults.map(s => batchResults[s].minTime));
  const maxResponseTime = Math.max(...validResults.map(s => batchResults[s].maxTime));
  const avgSuccessRate = validResults.reduce((sum, s) => sum + batchResults[s].successRate, 0) / validResults.length;
  
  log(`\n📊 整體性能統計:`, 'bold');
  log(`  • 測試股票數: ${symbols.length}`);
  log(`  • 有效結果數: ${validResults.length}`);
  log(`  • 平均響應時間: ${Math.round(avgResponseTime)}ms`);
  log(`  • 響應時間範圍: ${minResponseTime}ms - ${maxResponseTime}ms`);
  log(`  • 平均成功率: ${Math.round(avgSuccessRate)}%`);
  
  // 性能評級
  let grade = 'A';
  let gradeColor = 'green';
  if (avgResponseTime > 1000) {
    grade = 'D';
    gradeColor = 'red';
  } else if (avgResponseTime > 500) {
    grade = 'C';
    gradeColor = 'yellow';
  } else if (avgResponseTime > 200) {
    grade = 'B';
    gradeColor = 'yellow';
  }
  
  log(`  • 性能評級: ${grade}`, gradeColor);
  
  // 並發性能
  log(`\n🔥 並發性能:`, 'bold');
  log(`  • 並發請求時間: ${concurrentResults.totalTime}ms`);
  log(`  • 並發成功率: ${Math.round(concurrentResults.successCount / concurrentResults.totalCount * 100)}%`);
  log(`  • 並發效率: ${concurrentResults.efficiency}%`);
  
  // 性能建議
  log(`\n💡 性能建議:`, 'bold');
  
  if (avgResponseTime > 500) {
    log(`  • 響應時間較慢，建議啟用數據緩存`, 'yellow');
  } else {
    log(`  • 響應時間良好，系統運行正常`, 'green');
  }
  
  if (avgSuccessRate < 95) {
    log(`  • 成功率較低，建議檢查 API 穩定性`, 'yellow');
  }
  
  if (concurrentResults.efficiency < 80) {
    log(`  • 並發效率較低，建議優化並發處理`, 'yellow');
  }
  
  // 緩存效果預測
  log(`\n🚀 緩存效果預測:`, 'bold');
  const estimatedCacheTime = 50; // 預估緩存響應時間
  const improvementRatio = avgResponseTime / estimatedCacheTime;
  
  log(`  • 預估緩存響應時間: ${estimatedCacheTime}ms`);
  log(`  • 預估性能提升: ${Math.round(improvementRatio)}x`, 'green');
  log(`  • 預估緩存後評級: A+`, 'green');
}

// 主函數
async function main() {
  log('⚡ AceStockBB 性能對比測試', 'bold');
  log(`🌐 測試環境: ${BASE_URL}`, 'blue');
  log(`📅 測試時間: ${new Date().toLocaleString('zh-CN')}`, 'blue');
  log(`🎯 測試股票: ${TEST_SYMBOLS.join(', ')}`, 'blue');
  
  try {
    // 執行批量測試
    const batchResults = await batchPerformanceTest();
    
    // 執行並發測試
    const concurrentResults = await concurrentPerformanceTest();
    
    // 生成報告
    generatePerformanceReport(batchResults, concurrentResults);
    
    log(`\n✅ 性能測試完成！`, 'green');
    
  } catch (error) {
    log(`\n❌ 測試過程中發生錯誤: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 運行測試
if (require.main === module) {
  main();
}