#!/usr/bin/env node

/**
 * 台股 API 測試腳本
 * 測試台灣證券交易所 API 的功能和性能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_TW_SYMBOLS = ['2330', '2317', '2454', '0050', '0056', '6547', '6180', '4938'];

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
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

// 測試單個台股 API
async function testSingleTWStock() {
  log('\n🏮 測試單個台股 API...', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const results = [];
  
  for (const symbol of TEST_TW_SYMBOLS.slice(0, 5)) {
    try {
      const result = await makeRequest(`${BASE_URL}/api/tw-stock/${symbol}`);
      results.push({
        symbol,
        success: result.success,
        responseTime: result.responseTime,
        hasData: result.success && result.data && result.data.price,
        market: result.data?.market,
        companyName: result.data?.companyName
      });
      
      const status = result.success ? '✓' : '✗';
      const market = result.data?.market || '--';
      const company = result.data?.companyName || '--';
      
      log(`  ${status} ${symbol} (${market}): ${result.responseTime}ms - ${company}`, 
          result.success ? 'green' : 'red');
    } catch (error) {
      results.push({
        symbol,
        success: false,
        responseTime: error.responseTime || 0,
        error: error.error
      });
      log(`  ✗ ${symbol}: 失敗 (${error.error})`, 'red');
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const avgResponseTime = results.filter(r => r.success)
    .reduce((sum, r) => sum + r.responseTime, 0) / successCount;
  
  return {
    method: '單個台股 API',
    results,
    successCount,
    totalCount: results.length,
    avgResponseTime: Math.round(avgResponseTime),
  };
}

// 測試台股批量 API
async function testBatchTWStock() {
  log('\n🚀 測試台股批量 API...', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const startTime = Date.now();
  
  try {
    const result = await makeRequest(
      `${BASE_URL}/api/tw-stocks/batch`,
      'POST',
      { symbols: TEST_TW_SYMBOLS }
    );
    
    const totalTime = Date.now() - startTime;
    
    if (result.success) {
      const data = result.data;
      log(`  ✓ 批量請求完成: ${totalTime}ms`, 'green');
      log(`  ✓ 成功獲取: ${data.successCount}/${data.total}`, 'green');
      log(`  ✓ 失敗數量: ${data.errorCount}`, data.errorCount > 0 ? 'yellow' : 'green');
      
      // 顯示部分股票信息
      if (data.success && data.success.length > 0) {
        log('\n  📊 股票詳情:', 'blue');
        data.success.slice(0, 5).forEach(stock => {
          const change = stock.changePercent >= 0 ? '+' : '';
          log(`    ${stock.symbol} (${stock.market}): $${stock.price} ${change}${stock.changePercent.toFixed(2)}%`, 
              stock.changePercent >= 0 ? 'green' : 'red');
        });
      }
      
      return {
        method: '台股批量 API',
        totalTime,
        successCount: data.successCount,
        totalCount: data.total,
        avgResponseTime: Math.round(totalTime / data.total),
        results: data.success
      };
    } else {
      log(`  ✗ 批量請求失敗: ${result.error}`, 'red');
      return {
        method: '台股批量 API',
        totalTime,
        successCount: 0,
        totalCount: TEST_TW_SYMBOLS.length,
        avgResponseTime: 0,
        results: []
      };
    }
  } catch (error) {
    log(`  ✗ 批量請求異常: ${error.error}`, 'red');
    return {
      method: '台股批量 API',
      totalTime: Date.now() - startTime,
      successCount: 0,
      totalCount: TEST_TW_SYMBOLS.length,
      avgResponseTime: 0,
      results: []
    };
  }
}

// 測試台股歷史數據 API
async function testTWStockHistory() {
  log('\n📈 測試台股歷史數據 API...', 'magenta');
  log('=' .repeat(50), 'magenta');
  
  const testSymbol = '2330'; // 台積電
  
  try {
    const result = await makeRequest(`${BASE_URL}/api/tw-stock/${testSymbol}/history`);
    
    if (result.success && result.data && Array.isArray(result.data)) {
      const historyData = result.data;
      log(`  ✓ ${testSymbol} 歷史數據: ${result.responseTime}ms`, 'green');
      log(`  ✓ 數據筆數: ${historyData.length} 天`, 'green');
      
      if (historyData.length > 0) {
        const latest = historyData[historyData.length - 1];
        log(`  ✓ 最新數據: ${latest.date} 收盤 $${latest.close}`, 'green');
      }
      
      return {
        success: true,
        responseTime: result.responseTime,
        dataCount: historyData.length
      };
    } else {
      log(`  ✗ 歷史數據獲取失敗`, 'red');
      return {
        success: false,
        responseTime: result.responseTime
      };
    }
  } catch (error) {
    log(`  ✗ 歷史數據請求異常: ${error.error}`, 'red');
    return {
      success: false,
      responseTime: error.responseTime || 0
    };
  }
}

// 生成台股測試報告
function generateTWStockReport(singleResult, batchResult, historyResult) {
  log('\n📊 台股 API 測試報告', 'bold');
  log('=' .repeat(60), 'magenta');
  
  log('\n📈 性能對比:', 'bold');
  log('方法'.padEnd(15) + '總時間'.padEnd(10) + '成功率'.padEnd(10) + '平均響應'.padEnd(12) + '效率評級');
  log('-'.repeat(60));
  
  const results = [singleResult, batchResult];
  
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
  
  // 歷史數據測試結果
  log('\n📈 歷史數據測試:', 'bold');
  if (historyResult.success) {
    log(`  ✓ 響應時間: ${historyResult.responseTime}ms`, 'green');
    log(`  ✓ 數據筆數: ${historyResult.dataCount} 天`, 'green');
  } else {
    log(`  ✗ 測試失敗`, 'red');
  }
  
  // 性能提升分析
  if (singleResult.totalTime && batchResult.totalTime) {
    const improvement = Math.round((singleResult.totalTime - batchResult.totalTime) / singleResult.totalTime * 100);
    log('\n🚀 性能提升分析:', 'bold');
    log(`• 批量 API 相比單個 API: ${improvement > 0 ? '提升' : '降低'} ${Math.abs(improvement)}%`, 
        improvement > 0 ? 'green' : 'red');
  }
  
  // 台股特色功能
  log('\n🏮 台股特色功能:', 'bold');
  log('  • 支援上市 (TSE) 和上櫃 (OTC) 股票', 'green');
  log('  • 即時價格和成交量數據', 'green');
  log('  • 歷史價格數據 (月度)', 'green');
  log('  • 中文公司名稱顯示', 'green');
  log('  • 台股代號格式驗證', 'green');
  
  // 推薦使用方式
  log('\n💡 使用建議:', 'bold');
  log('  • 建議使用批量 API 獲取多支股票數據', 'yellow');
  log('  • 歷史數據適合用於圖表展示', 'yellow');
  log('  • 支援台積電 (2330)、鴻海 (2317) 等熱門股票', 'yellow');
}

// 主函數
async function main() {
  log('🏮 台股 API 功能測試', 'bold');
  log(`🌐 測試環境: ${BASE_URL}`, 'magenta');
  log(`📅 測試時間: ${new Date().toLocaleString('zh-TW')}`, 'magenta');
  log(`🎯 測試股票: ${TEST_TW_SYMBOLS.join(', ')}`, 'magenta');
  
  try {
    // 執行測試
    const singleResult = await testSingleTWStock();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 間隔1秒
    
    const batchResult = await testBatchTWStock();
    await new Promise(resolve => setTimeout(resolve, 1000)); // 間隔1秒
    
    const historyResult = await testTWStockHistory();
    
    // 生成測試報告
    generateTWStockReport(singleResult, batchResult, historyResult);
    
    log('\n✅ 台股 API 測試完成！', 'green');
    
  } catch (error) {
    log(`\n❌ 測試過程中發生錯誤: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 運行測試
if (require.main === module) {
  main();
}