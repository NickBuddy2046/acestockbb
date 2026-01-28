#!/usr/bin/env node

/**
 * API 優化效果測試
 * 比較優化前後的 API 性能
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
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(responseData);
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
            rawData: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      reject({
        success: false,
        error: error.message,
        responseTime: endTime - startTime
      });
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 測試原始 API (單個請求)
async function testOriginalAPI() {
  log('\n🔄 測試原始 API (單個請求)...', 'blue');
  log('=' .repeat(50), 'blue');
  
  const startTime = Date.now();
  const results = [];
  
  // 順序請求每個股票
  for (const symbol of TEST_SYMBOLS) {
    try {
      const result = await makeRequest(`${BASE_URL}/api/stock/${symbol}`);
      results.push({
        symbol,
        success: result.success,
        responseTime: result.responseTime,
        hasData: result.success && result.data && result.data.price
      });
      
      log(`  ${symbol}: ${result.responseTime}ms`, result.success ? 'green' : 'red');
    } catch (error) {
      results.push({
        symbol,
        success: false,
        responseTime: error.responseTime || 0,
        error: error.error
      });
      log(`  ${symbol}: 失敗 (${error.error})`, 'red');
    }
  }
  
  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = results.filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / successCount;
  
  return {
    method: '原始 API (順序)',
    totalTime,
    successCount,
    totalCount: TEST_SYMBOLS.length,
    avgResponseTime: Math.round(avgResponseTime),
    results
  };
}

// 測試並發 API
async function testConcurrentAPI() {
  log('\n⚡ 測試並發 API...', 'blue');
  log('=' .repeat(50), 'blue');
  
  const startTime = Date.now();
  
  // 並發請求所有股票
  const promises = TEST_SYMBOLS.map(symbol => 
    makeRequest(`${BASE_URL}/api/stock/${symbol}`)
      .catch(error => ({ success: false, error: error.error, symbol }))
  );
  
  const results = await Promise.all(promises);
  const totalTime = Date.now() - startTime;
  
  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = results.filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / successCount;
  
  results.forEach((result, index) => {
    const symbol = TEST_SYMBOLS[index];
    log(`  ${symbol}: ${result.responseTime || 0}ms`, result.success ? 'green' : 'red');
  });
  
  return {
    method: '並發 API',
    totalTime,
    successCount,
    totalCount: TEST_SYMBOLS.length,
    avgResponseTime: Math.round(avgResponseTime),
    results
  };
}

// 測試批量 API
async function testBatchAPI() {
  log('\n🚀 測試批量 API...', 'blue');
  log('=' .repeat(50), 'blue');
  
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(
      `${BASE_URL}/api/stocks/batch`,
      'POST',
      { symbols: TEST_SYMBOLS }
    );
    
    const totalTime = Date.now() - startTime;
    
    if (result.success) {
      const data = result.data;
      log(`  批量請求完成: ${totalTime}ms`, 'green');
      log(`  成功獲取: ${data.successCount}/${data.total}`, 'green');
      log(`  失敗數量: ${data.errorCount}`, data.errorCount > 0 ? 'yellow' : 'green');
      
      return {
        method: '批量 API',
        totalTime,
        successCount: data.successCount,
        totalCount: data.total,
        avgResponseTime: Math.round(totalTime / data.total), // 平均每個股票的時間
        results: data.success
      };
    } else {
      log(`  批量請求失敗: ${result.error}`, 'red');
      return {
        method: '批量 API',
        totalTime,
        successCount: 0,
        totalCount: TEST_SYMBOLS.length,
        avgResponseTime: 0,
        results: []
      };
    }
  } catch (error) {
    log(`  批量請求異常: ${error.error}`, 'red');
    return {
      method: '批量 API',
      totalTime: Date.now() - startTime,
      successCount: 0,
      totalCount: TEST_SYMBOLS.length,
      avgResponseTime: 0,
      results: []
    };
  }
}

// 生成對比報告
function generateComparisonReport(originalResult, concurrentResult, batchResult) {
  log('\n📊 API 優化效果對比報告', 'bold');
  log('=' .repeat(60), 'blue');
  
  const results = [originalResult, concurrentResult, batchResult];
  
  log('\n📈 性能對比:', 'bold');
  log('方法'.padEnd(15) + '總時間'.padEnd(10) + '成功率'.padEnd(10) + '平均響應'.padEnd(12) + '效率評級');
  log('-'.repeat(60));
  
  results.forEach(result => {
    const successRate = Math.round(result.successCount / result.totalCount * 100);
    const efficiency = result.totalTime < 500 ? 'A' : 
                      result.totalTime < 1000 ? 'B' : 
                      result.totalTime < 2000 ? 'C' : 'D';
    
    const line = result.method.padEnd(15) + 
                `${result.totalTime}ms`.padEnd(10) + 
                `${successRate}%`.padEnd(10) + 
                `${result.avgResponseTime}ms`.padEnd(12) + 
                efficiency;
    
    const color = efficiency === 'A' ? 'green' : 
                  efficiency === 'B' ? 'yellow' : 'red';
    
    log(line, color);
  });
  
  // 性能提升分析
  log('\n🚀 性能提升分析:', 'bold');
  
  const originalTime = originalResult.totalTime;
  const concurrentImprovement = Math.round((originalTime - concurrentResult.totalTime) / originalTime * 100);
  const batchImprovement = Math.round((originalTime - batchResult.totalTime) / originalTime * 100);
  
  log(`• 並發 API 相比原始 API: ${concurrentImprovement > 0 ? '提升' : '降低'} ${Math.abs(concurrentImprovement)}%`, 
      concurrentImprovement > 0 ? 'green' : 'red');
  log(`• 批量 API 相比原始 API: ${batchImprovement > 0 ? '提升' : '降低'} ${Math.abs(batchImprovement)}%`, 
      batchImprovement > 0 ? 'green' : 'red');
  
  // 最佳方案推薦
  const bestResult = results.reduce((best, current) => 
    current.totalTime < best.totalTime ? current : best
  );
  
  log(`\n🏆 推薦方案: ${bestResult.method}`, 'green');
  log(`  • 總時間: ${bestResult.totalTime}ms`);
  log(`  • 成功率: ${Math.round(bestResult.successCount / bestResult.totalCount * 100)}%`);
  log(`  • 平均響應: ${bestResult.avgResponseTime}ms`);
  
  // 優化建議
  log('\n💡 優化建議:', 'bold');
  
  if (batchResult.totalTime < originalTime * 0.5) {
    log('  • 批量 API 效果顯著，建議在生產環境中使用', 'green');
  }
  
  if (concurrentResult.successCount < originalResult.successCount) {
    log('  • 並發請求可能導致 API 限制，建議控制並發數量', 'yellow');
  }
  
  if (batchResult.successCount < TEST_SYMBOLS.length) {
    log('  • 批量 API 有失敗請求，建議添加重試機制', 'yellow');
  }
}

// 主函數
async function main() {
  log('🧪 API 優化效果測試', 'bold');
  log(`🌐 測試環境: ${BASE_URL}`, 'blue');
  log(`📅 測試時間: ${new Date().toLocaleString('zh-CN')}`, 'blue');
  log(`🎯 測試股票: ${TEST_SYMBOLS.join(', ')}`, 'blue');
  
  try {
    // 執行三種測試
    const originalResult = await testOriginalAPI();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 間隔1秒
    
    const concurrentResult = await testConcurrentAPI();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 間隔1秒
    
    const batchResult = await testBatchAPI();
    
    // 生成對比報告
    generateComparisonReport(originalResult, concurrentResult, batchResult);
    
    log('\n✅ API 優化測試完成！', 'green');
    
  } catch (error) {
    log(`\n❌ 測試過程中發生錯誤: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 運行測試
if (require.main === module) {
  main();
}