#!/usr/bin/env node

/**
 * 觸發數據刷新腳本
 * 用於手動觸發數據刷新並監控進度
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

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

// HTTP POST 請求函數
function makePostRequest(url, data = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = client.request(options, (res) => {
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
    
    req.write(postData);
    req.end();
  });
}

// GET 請求函數
function makeGetRequest(url) {
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

// 觸發數據刷新
async function triggerRefresh() {
  log('🚀 觸發數據刷新...', 'blue');
  
  const url = `${BASE_URL}/api/refresh-daily-data`;
  
  try {
    const result = await makePostRequest(url);
    
    if (result.success && result.data.success) {
      log(`✅ 刷新觸發成功！`, 'green');
      log(`📊 ${result.data.message}`, 'green');
      log(`⏱️ 響應時間: ${result.responseTime}ms`, 'blue');
      return true;
    } else {
      log(`❌ 刷新觸發失敗`, 'red');
      log(`📝 錯誤信息: ${result.data?.message || result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ 請求失敗: ${error.error}`, 'red');
    return false;
  }
}

// 監控刷新狀態
async function monitorRefreshStatus(maxAttempts = 30) {
  log('\n📊 監控刷新進度...', 'blue');
  
  const url = `${BASE_URL}/api/refresh-daily-data`;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await makeGetRequest(url);
      
      if (result.success && result.data.lastRefresh) {
        const refresh = result.data.lastRefresh;
        
        log(`\n📈 刷新狀態 (檢查 ${attempt}/${maxAttempts}):`, 'yellow');
        log(`  • 狀態: ${refresh.status}`, refresh.status === 'success' ? 'green' : 
            refresh.status === 'failed' ? 'red' : 'yellow');
        log(`  • 已更新股票: ${refresh.symbolsUpdated}`);
        
        if (refresh.status === 'success') {
          const duration = refresh.endTime ? 
            Math.round((refresh.endTime - refresh.startTime) / 1000) : 
            Math.round((Date.now() - refresh.startTime) / 1000);
          
          log(`  • 耗時: ${duration} 秒`, 'green');
          log(`✅ 數據刷新完成！`, 'green');
          return true;
        } else if (refresh.status === 'failed') {
          log(`❌ 數據刷新失敗`, 'red');
          if (refresh.errorMessage) {
            log(`📝 錯誤: ${refresh.errorMessage}`, 'red');
          }
          return false;
        } else if (refresh.status === 'in_progress') {
          const elapsed = Math.round((Date.now() - refresh.startTime) / 1000);
          log(`  • 已運行: ${elapsed} 秒`, 'blue');
        }
      }
      
      // 等待 10 秒後再次檢查
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
    } catch (error) {
      log(`⚠️ 狀態檢查失敗: ${error.error}`, 'yellow');
    }
  }
  
  log(`⏰ 監控超時 (${maxAttempts * 10} 秒)`, 'yellow');
  return false;
}

// 主函數
async function main() {
  log('🔄 AceStockBB 數據刷新工具', 'bold');
  log(`🌐 目標環境: ${BASE_URL}`, 'blue');
  log(`📅 執行時間: ${new Date().toLocaleString('zh-CN')}`, 'blue');
  
  try {
    // 觸發刷新
    const triggered = await triggerRefresh();
    
    if (triggered) {
      // 監控進度
      const completed = await monitorRefreshStatus();
      
      if (completed) {
        log('\n🎉 數據刷新成功完成！', 'green');
        log('💡 現在可以測試緩存性能提升效果', 'blue');
      } else {
        log('\n⚠️ 數據刷新可能仍在進行中或已失敗', 'yellow');
        log('💡 請稍後手動檢查管理頁面', 'blue');
      }
    }
    
  } catch (error) {
    log(`\n❌ 執行過程中發生錯誤: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 運行腳本
if (require.main === module) {
  main();
}