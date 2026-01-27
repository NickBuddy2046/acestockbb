import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-16">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OpenBB Web App
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            基於 OpenBB 的現代化金融數據分析平台
          </p>
          <div className="space-x-4">
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              進入儀表板
            </Link>
            <Link
              href="/login"
              className="inline-block border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              登錄 / 註冊
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}