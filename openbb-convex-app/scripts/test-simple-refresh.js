#!/usr/bin/env node

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ success: true, data: jsonData, statusCode: res.statusCode });
        } catch (error) {
          resolve({ success: false, error: error.message, rawData: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject({ success: false, error: error.message });
    });
    
    if (method === 'POST') {
      req.write('{}');
    }
    req.end();
  });
}

async function testSimpleRefresh() {
  console.log('🧪 測試簡化版數據刷新...');
  
  try {
    // 觸發測試刷新
    console.log('📤 觸發測試刷新...');
    const refreshResult = await makeRequest(`${BASE_URL}/api/test-refresh`, 'POST');
    
    if (refreshResult.success) {
      console.log('✅ 測試刷新成功:', refreshResult.data.message);
    } else {
      console.log('❌ 測試刷新失敗:', refreshResult.error);
      return;
    }
    
    // 等待一秒
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 檢查測試數據
    console.log('📥 檢查測試數據...');
    const dataResult = await makeRequest(`${BASE_URL}/api/test-refresh`, 'GET');
    
    if (dataResult.success) {
      console.log('✅ 測試數據檢查成功');
      console.log('📊 有測試數據:', dataResult.data.hasTestData);
      if (dataResult.data.testData) {
        console.log('📈 測試數據:', {
          symbol: dataResult.data.testData.symbol,
          price: dataResult.data.testData.price,
          change: dataResult.data.testData.change,
          date: dataResult.data.testData.date
        });
      }
    } else {
      console.log('❌ 測試數據檢查失敗:', dataResult.error);
    }
    
  } catch (error) {
    console.log('❌ 測試過程中發生錯誤:', error.error || error.message);
  }
}

testSimpleRefresh();