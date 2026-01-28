#!/usr/bin/env node

/**
 * 緩存系統測試腳本
 * 用於測試和驗證每日數據緩存系統的性能和功能
 */

const https = require('https');
const http = require('http');

// 配置
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];

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
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
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

// 測試單個股票 API
async function testStockAPI(symbol) {
  const url = `${BASE_URL}/api/stock/${symbol}`;
  
  try {
    const result = await makeRequest(url);
    return {
      symbol,
      success: result.success,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      hasData: result.success && result.data && result.data.price,
      error: result.error
    };
  } catch (error) {
    return {
      symbol,
      success: false,
      responseTime: error.responseTime || 0,
      error: error.error || error.message
    };
  }
}

// 測試數據刷新狀態
async function testRefreshStatus() {
  const url = `${BASE_URL}/api/refresh-daily-data`;
  
  try {
    const result = await makeRequest(url);
    return {
      success: result.success,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      data: result.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.error || error.message
    };
  }
}

// 性能測試
async function performanceTest() {
  log('\n🚀 開始性能測試...', 'blue');
  log('=' .repeat(50), 'blue');
  
  const results = [];
  
  for (const symbol of TEST_SYMBOLS) {
    log(`測試 ${symbol}...`, 'yellow');
    
    // 測試多次以獲得平均值
    const tests = [];
    for (let i = 0; i < 3; i++) {
      const result = await testStockAPI(symbol);
      tests.push(result);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 間隔
    }
    
    const avgResponseTime = tests.reduce((sum, test) => sum + test.responseTime, 0) / tests.length;
    const successRate = tests.filter(test => test.success).length / tests.length * 100;
    
    results.push({
      symbol,
      avgResponseTime: Math.round(avgResponseTime),
      successRate,
      tests
    });
    
    log(`  ✓ 平均響應時間: ${Math.round(avgResponseTime)}ms`, 'green');
    log(`  ✓ 成功率: ${successRate}%`, successRate === 100 ? 'green' : 'red');
  }
  
  return results;
}

// 緩存狀態測試
async function cacheStatusTest() {
  log('\n📊 檢查緩存狀態...', 'blue');
  log('=' .repeat(50), 'blue');
  
  const statusResult = await testRefreshStatus();
  
  if (statusResult.success) {
    const data = statusResult.data;
    log(`✓ API 響應時間: ${statusResult.responseTime}ms`, 'green');
    log(`✓ 今日已刷新: ${data.hasRefreshedToday ? '是' : '否'}`, data.hasRefreshedToday ? 'green' : 'yellow');
    
    if (data.lastRefresh) {
      log(`✓ 最後刷新: ${data.lastRefresh.date}`, 'green');
      log(`✓ 刷新狀態: ${data.lastRefresh.status}`, data.lastRefresh.status === 'success' ? 'green' : 'red');
      log(`✓ 更新股票數: ${data.lastRefresh.symbolsUpdated}`, 'green');
    }
  } else {
    log(`✗ 緩存狀態檢查失敗: ${statusResult.error}`, 'red');
  }
  
  return statusResult;
}

// 生成測試報告
function generateReport(performanceResults, cacheStatus) {
  log('\n📋 測試報告', 'bold');
  log('=' .repeat(50), 'blue');
  
  // 性能統計
  const totalTests = performanceResults.length * 3;
  const successfulTests = performanceResults.reduce((sum, result) => 
    sum + result.tests.filter(test => test.success).length, 0);
  const avgResponseTime = performanceResults.reduce((sum, result) => 
    sum + result.avgResponseTime, 0) / performanceResults.length;
  
  log(`\n📊 性能統計:`, 'bold');
  log(`  • 測試股票數: ${performanceResults.length}`);
  log(`  • 總測試次數: ${totalTests}`);
  log(`  • 成功測試: ${successfulTests}`);
  log(`  • 整體成功率: ${Math.round(successfulTests / totalTests * 100)}%`);
  log(`  • 平均響應時間: ${Math.round(avgResponseTime)}ms`);
  
  // 性能評級
  let performanceGrade = 'A';
  if (avgResponseTime > 1000) performanceGrade = 'C';
  else if (avgResponseTime > 500) performanceGrade = 'B';
  
  log(`  • 性能評級: ${performanceGrade}`, performanceGrade === 'A' ? 'green' : 'yellow');
  
  // 緩存狀態
  log(`\n🗄️ 緩存狀態:`, 'bold');
  if (cacheStatus.success && cacheStatus.data) {
    log(`  • 緩存系統: 正常`, 'green');
    log(`  • 今日刷新: ${cacheStatus.data.hasRefreshedToday ? '已完成' : '未完成'}`, 
        cacheStatus.data.hasRefreshedToday ? 'green' : 'yellow');
  } else {
    log(`  • 緩存系統: 異常`, 'red');
  }
  
  // 建議
  log(`\n💡 建議:`, 'bold');
  if (!cacheStatus.data?.hasRefreshedToday) {
    log(`  • 建議觸發一次數據刷新以啟用緩存`, 'yellow');
  }
  if (avgResponseTime > 500) {
    log(`  • 響應時間較慢，建議檢查 API 或網絡狀況`, 'yellow');
  }
  if (successfulTests / totalTests < 0.9) {
    log(`  • 成功率較低，建議檢查 API 配置`, 'yellow');
  }
  
  log(`\n✅ 測試完成！`, 'green');
}

// 主函數
async function main() {
  log('🧪 AceStockBB 緩存系統測試', 'bold');
  log(`🌐 測試環境: ${BASE_URL}`, 'blue');
  log(`📅 測試時間: ${new Date().toLocaleString('zh-CN')}`, 'blue');
  
  try {
    // 執行測試
    const performanceResults = await performanceTest();
    const cacheStatus = await cacheStatusTest();
    
    // 生成報告
    generateReport(performanceResults, cacheStatus);
    
  } catch (error) {
    log(`\n❌ 測試過程中發生錯誤: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 運行測試
if (require.main === module) {
  main();
}

module.exports = {
  testStockAPI,
  testRefreshStatus,
  performanceTest,
  cacheStatusTest
};