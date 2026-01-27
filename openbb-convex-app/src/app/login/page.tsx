"use client";

import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 pt-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">OpenBB Web App</h1>
          <p className="text-gray-600">專業的投資數據分析平台</p>
        </div>
        
        <LoginForm onSuccess={handleLoginSuccess} />
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 OpenBB Web App. 基於 OpenBB Platform 構建</p>
        </div>
      </div>
    </div>
  );
}