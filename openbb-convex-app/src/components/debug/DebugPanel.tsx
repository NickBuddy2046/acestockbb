"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Bug, RefreshCw } from "lucide-react";

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const watchlist = useQuery(api.watchlists.getPublicWatchlist);
  const initializeDemoData = useMutation(api.watchlists.initializeDemoData);

  const handleInitializeData = async () => {
    try {
      const result = await initializeDemoData({});
      console.log("Initialize result:", result);
      alert("Demo data initialized: " + result);
    } catch (error) {
      console.error("Initialize error:", error);
      alert("Error: " + error);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Debug Panel"
      >
        <Bug size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-3 text-sm">
        <div>
          <strong>Watchlist Items:</strong> {watchlist?.length || 0}
        </div>
        
        <button
          onClick={handleInitializeData}
          className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={14} />
          <span>Initialize Demo Data</span>
        </button>
        
        <div className="text-xs text-gray-500">
          <div>Convex Status: Connected</div>
          <div>Environment: Development</div>
        </div>
      </div>
    </div>
  );
}