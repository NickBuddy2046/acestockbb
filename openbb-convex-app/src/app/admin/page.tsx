"use client";

import { ApiOptimizationPanel } from "@/components/admin/ApiOptimizationPanel";
import { DataRefreshPanel } from "@/components/admin/DataRefreshPanel";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系統管理</h1>
          <p className="text-gray-600 mt-2">監控系統性能和管理數據刷新</p>
        </div>
        
        <div className="space-y-8">
          {/* API 優化監控面板 */}
          <ApiOptimizationPanel />
          
          {/* 數據刷新管理面板 */}
          <DataRefreshPanel />
        </div>
      </div>
    </div>
  );
}