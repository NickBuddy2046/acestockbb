"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Database, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { StockApiService } from "@/lib/stockApi";
import { showToast } from "../ui/Toast";

interface RefreshStatus {
  hasRefreshedToday: boolean;
  lastRefresh?: {
    date: string;
    status: string;
    symbolsUpdated: number;
    startTime: number;
    endTime?: number;
    errorMessage?: string;
  };
  timestamp: string;
}

export function DataRefreshPanel() {
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 檢查刷新狀態
  const checkStatus = async () => {
    try {
      const status = await StockApiService.checkDailyRefreshStatus();
      setRefreshStatus(status);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 觸發數據刷新
  const triggerRefresh = async () => {
    setIsRefreshing(true);
    try {
      const result = await StockApiService.triggerDailyRefresh();
      
      if (result.success) {
        showToast.success("刷新成功", result.message);
        // 重新檢查狀態
        setTimeout(() => checkStatus(), 1000);
      } else {
        showToast.error("刷新失敗", result.message);
      }
    } catch (error) {
      console.error('Error triggering refresh:', error);
      showToast.error("刷新失敗", "無法觸發數據刷新");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // 每30秒檢查一次狀態
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'in_progress':
        return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
      default:
        return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'success':
        return '成功';
      case 'failed':
        return '失敗';
      case 'in_progress':
        return '進行中';
      default:
        return '未知';
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    return `${Math.round(duration / 1000)}秒`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Database size={20} />
          <h2 className="text-xl font-semibold">數據刷新管理</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Database size={20} />
          <h2 className="text-xl font-semibold">數據刷新管理</h2>
        </div>
        <button
          onClick={checkStatus}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="刷新狀態"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 當前狀態 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">今日刷新狀態</h3>
        
        {refreshStatus?.hasRefreshedToday && refreshStatus.lastRefresh ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(refreshStatus.lastRefresh.status)}
                <span className="font-medium">
                  {getStatusText(refreshStatus.lastRefresh.status)}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {refreshStatus.lastRefresh.date}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">更新股票數</div>
                <div className="font-semibold">{refreshStatus.lastRefresh.symbolsUpdated}</div>
              </div>
              <div>
                <div className="text-gray-600">開始時間</div>
                <div className="font-semibold">
                  {formatTime(refreshStatus.lastRefresh.startTime)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">耗時</div>
                <div className="font-semibold">
                  {getDuration(refreshStatus.lastRefresh.startTime, refreshStatus.lastRefresh.endTime)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">狀態</div>
                <div className={`font-semibold ${
                  refreshStatus.lastRefresh.status === 'success' ? 'text-green-600' :
                  refreshStatus.lastRefresh.status === 'failed' ? 'text-red-600' :
                  'text-blue-600'
                }`}>
                  {getStatusText(refreshStatus.lastRefresh.status)}
                </div>
              </div>
            </div>

            {refreshStatus.lastRefresh.errorMessage && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-600">
                  <strong>錯誤信息:</strong> {refreshStatus.lastRefresh.errorMessage}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-yellow-700">
              <AlertCircle size={20} />
              <span>今日尚未刷新數據</span>
            </div>
          </div>
        )}
      </div>

      {/* 手動刷新按鈕 */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">手動刷新</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={triggerRefresh}
            disabled={isRefreshing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isRefreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? '刷新中...' : '立即刷新數據'}</span>
          </button>
          
          <div className="text-sm text-gray-600">
            <div>• 刷新所有預設股票的當日數據</div>
            <div>• 更新30天歷史價格數據</div>
            <div>• 預計耗時 2-5 分鐘</div>
          </div>
        </div>
      </div>

      {/* 說明信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <Clock size={16} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">自動刷新說明</div>
            <div>• 系統建議每日刷新一次數據以提高性能</div>
            <div>• 刷新後的數據會緩存在 Convex 數據庫中</div>
            <div>• 用戶訪問時優先使用緩存數據，提高載入速度</div>
            <div>• 如果緩存沒有數據，會自動回退到實時 API</div>
          </div>
        </div>
      </div>
    </div>
  );
}