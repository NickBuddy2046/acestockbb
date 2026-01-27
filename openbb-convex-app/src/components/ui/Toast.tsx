"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

export interface ToastProps {
  id: string;
  type: "success" | "error" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastComponentProps extends ToastProps {
  onClose: (id: string) => void;
}

function ToastComponent({ id, type, title, message, duration = 5000, onClose }: ToastComponentProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  };

  const iconColors = {
    success: "text-green-600",
    error: "text-red-600",
    warning: "text-yellow-600",
  };

  const Icon = icons[type];

  return (
    <div className={`max-w-sm w-full ${colors[type]} border rounded-lg shadow-lg p-4 mb-4 animate-in slide-in-from-right duration-300`}>
      <div className="flex items-start">
        <Icon className={`${iconColors[type]} mr-3 mt-0.5`} size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
        </div>
        <button
          onClick={() => onClose(id)}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 全局暴露 addToast 函數
  useEffect(() => {
    (window as any).showToast = addToast;
    return () => {
      delete (window as any).showToast;
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50">
      {toasts.map(toast => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onClose={removeToast}
        />
      ))}
    </div>
  );
}

// 輔助函數
export const showToast = {
  success: (title: string, message?: string) => {
    if (typeof window !== "undefined" && (window as any).showToast) {
      (window as any).showToast({ type: "success", title, message });
    }
  },
  error: (title: string, message?: string) => {
    if (typeof window !== "undefined" && (window as any).showToast) {
      (window as any).showToast({ type: "error", title, message });
    }
  },
  warning: (title: string, message?: string) => {
    if (typeof window !== "undefined" && (window as any).showToast) {
      (window as any).showToast({ type: "warning", title, message });
    }
  },
};