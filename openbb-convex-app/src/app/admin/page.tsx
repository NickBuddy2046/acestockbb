"use client";

import { DataRefreshPanel } from "@/components/admin/DataRefreshPanel";
import { Settings, Shield } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Shield size={24} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">系統管理</h1>
          </div>
          <p className="text-gray-600">管理股票數據刷新和系統設置</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 數據刷新管理 */}
          <div className="lg:col-span-2">
            <DataRefreshPanel />
          </div>
          
          {/* 其他管理功能可以在這裡添加 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Settings size={20} />
              <h2 className="text-xl font-semibold">系統設置</h2>
            </div>
            <div className="text-gray-600">
              <p>更多管理功能即將推出...</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• 用戶管理</li>
                <li>• API 配置</li>
                <li>• 性能監控</li>
                <li>• 日誌查看</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">系統狀態</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">數據庫連接</span>
                <span className="text-green-600 font-medium">正常</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API 服務</span>
                <span className="text-green-600 font-medium">正常</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">緩存系統</span>
                <span className="text-green-600 font-medium">正常</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}