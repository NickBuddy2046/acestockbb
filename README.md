# OpenBB Web App - 股票分析平台

一個基於 Next.js 14 + Convex + TypeScript 構建的現代化股票分析平台，靈感來自 OpenBB Platform。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Convex](https://img.shields.io/badge/Convex-Database-orange)

## 🌟 功能特色

### 📊 核心功能
- **實時股票數據**: 集成 Yahoo Finance API，提供實時價格和歷史數據
- **智能緩存系統**: 每日數據刷新機制，大幅提升性能
- **股票發現**: 漲跌榜、活躍股票、熱門關注等發現功能
- **股票比較**: 多股票並排比較分析工具
- **投資組合管理**: 完整的持股管理和績效分析
- **監控列表**: 個人化股票監控，支持價格提醒

### 🎨 用戶體驗
- **響應式設計**: 完美適配桌面和移動設備
- **中文界面**: 完整的中文本地化
- **實時更新**: 自動數據刷新和狀態同步
- **直觀圖表**: 基於 Recharts 的專業金融圖表
- **快速載入**: 緩存優先策略，載入速度提升 10-50 倍

### 🛠 技術亮點
- **現代技術棧**: Next.js 14 + TypeScript + Tailwind CSS
- **實時數據庫**: Convex 提供實時數據同步
- **性能優化**: 智能緩存和回退機制
- **管理界面**: 完整的數據管理和監控系統
- **錯誤處理**: 完善的錯誤處理和用戶反饋

## 🚀 快速開始

### 環境要求
- Node.js 18+ 
- npm 或 yarn
- Convex 帳戶

### 安裝步驟

1. **克隆倉庫**
```bash
git clone https://github.com/your-username/openbb-web-app.git
cd openbb-web-app
```

2. **安裝依賴**
```bash
cd openbb-convex-app
npm install
```

3. **配置環境變量**
```bash
cp .env.local.example .env.local
# 編輯 .env.local 填入必要的配置
```

4. **設置 Convex**
```bash
npx convex dev
# 按照提示完成 Convex 項目設置
```

5. **啟動開發服務器**
```bash
npm run dev
```

6. **訪問應用**
- 主應用: http://localhost:3000
- 管理界面: http://localhost:3000/admin

### 首次使用

1. 訪問管理頁面 http://localhost:3000/admin
2. 點擊"立即刷新數據"按鈕，等待數據載入完成
3. 返回儀表板體驗完整功能

## 📁 項目結構

```
openbb-convex-app/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── api/               # API 路由
│   │   ├── dashboard/         # 儀表板頁面
│   │   ├── admin/            # 管理頁面
│   │   └── login/            # 登錄頁面
│   ├── components/            # React 組件
│   │   ├── dashboard/        # 儀表板組件
│   │   ├── charts/           # 圖表組件
│   │   ├── ui/               # UI 組件
│   │   ├── auth/             # 認證組件
│   │   └── admin/            # 管理組件
│   └── lib/                  # 工具庫
├── convex/                   # Convex 數據庫函數
├── docs/                     # 項目文檔
└── scripts/                  # 腳本和工具
```

## 🎯 主要頁面

### 🏠 首頁 (/)
- 品牌展示和歡迎界面
- 快速導航到主要功能

### 📊 儀表板 (/dashboard)
- 實時股票圖表和價格卡片
- 增強監控列表 (實時價格、提醒系統)
- 股票發現 (漲跌榜、活躍股票)
- 股票比較分析工具
- 投資組合管理

### 🔧 管理頁面 (/admin)
- 數據刷新狀態監控
- 手動觸發數據刷新
- 系統狀態和性能監控
- 刷新歷史記錄

### 🔐 登錄頁面 (/login)
- 用戶登錄和註冊
- 演示帳戶快速體驗

## 🏗 技術架構

### 前端技術棧
- **Next.js 14**: React 框架，App Router
- **TypeScript**: 類型安全的 JavaScript
- **Tailwind CSS**: 實用優先的 CSS 框架
- **Recharts**: React 圖表庫
- **Lucide React**: 現代圖標庫

### 後端和數據
- **Convex**: 實時數據庫和後端服務
- **Yahoo Finance API**: 股票數據來源
- **每日緩存系統**: 性能優化策略

### 數據流程
```
用戶請求 → Convex 緩存 → 快速返回
     ↓ (緩存未命中)
實時 API → 備用數據 → 返回給用戶
```

## 📊 性能優化

### 緩存策略
- **每日刷新**: 預設40支熱門股票每日更新
- **智能回退**: 緩存失敗時自動使用實時 API
- **性能提升**: 載入速度提升 10-50 倍

### 支持的股票
- **熱門美股**: AAPL, GOOGL, MSFT, TSLA, AMZN, NVDA, META, NFLX
- **科技股**: AMD, INTC, CRM, ADBE, PYPL, ORCL, IBM
- **新興股票**: BABA, COIN, SQ, HOOD, PLTR, RIVN, LCID, SOFI
- **傳統股票**: GE, F, T, VZ, XOM, CVX, JPM, BAC

## 🔧 配置說明

### 環境變量
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# 可選：數據刷新授權
DAILY_REFRESH_TOKEN=your_secret_token

# 可選：應用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Convex 數據庫表
- `dailyStockData`: 每日股票數據快照
- `historicalPrices`: 歷史價格數據 (30天)
- `dataRefreshLog`: 數據刷新記錄
- `users`: 用戶信息
- `watchlists`: 用戶監控列表
- `portfolios`: 投資組合數據

## 🚀 部署

### Vercel 部署
```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署到生產環境
vercel --prod
```

### Convex 生產環境
```bash
# 部署 Convex 函數
npx convex deploy --prod
```

## 📈 使用統計

- **總文件數**: ~45 個核心文件
- **代碼行數**: ~2500+ 行
- **支持股票**: 40+ 支預設股票
- **功能模塊**: 8 個主要功能區域
- **響應時間**: 緩存命中 < 0.5 秒

## 🤝 貢獻指南

歡迎貢獻代碼！請遵循以下步驟：

1. Fork 本倉庫
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 開發路線圖

### 🎯 已完成
- ✅ 基礎股票數據系統
- ✅ 實時圖表和可視化
- ✅ 用戶界面和交互
- ✅ 緩存系統和性能優化
- ✅ 管理界面和監控

### 🔮 計劃中
- [ ] 技術分析指標 (MA, RSI, MACD)
- [ ] 新聞和公告集成
- [ ] 移動端 PWA 支持
- [ ] 真實用戶認證系統
- [ ] AI 驅動的股票推薦
- [ ] 更多數據源集成

## 📄 許可證

本項目採用 MIT 許可證 - 查看 [LICENSE](LICENSE) 文件了解詳情。

## 🙏 致謝

- [OpenBB Platform](https://openbb.co/) - 靈感來源
- [Yahoo Finance](https://finance.yahoo.com/) - 數據提供
- [Convex](https://convex.dev/) - 實時數據庫
- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

## 📞 聯繫方式

如有問題或建議，請通過以下方式聯繫：

- 創建 [Issue](https://github.com/your-username/openbb-web-app/issues)
- 發送 Pull Request
- 郵件: your-email@example.com

---

⭐ 如果這個項目對你有幫助，請給個 Star！