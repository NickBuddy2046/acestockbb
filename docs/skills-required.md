# 項目所需技能清單

## 🎯 核心技能要求

### 必備技能 (Essential)

#### 1. 前端開發
- **React 18+** - 函數組件、Hooks、狀態管理
- **Next.js 14** - App Router、服務端渲染、API Routes
- **TypeScript** - 類型定義、接口、泛型
- **Tailwind CSS** - 響應式設計、組件樣式

#### 2. 後端開發
- **Convex** - 數據庫操作、實時訂閱、認證
- **Node.js** - 異步編程、模塊系統
- **API 設計** - RESTful 設計、錯誤處理

#### 3. 數據處理
- **JSON 操作** - 數據解析、轉換
- **時間序列數據** - 股票價格數據處理
- **數據可視化** - Recharts 圖表庫

### 推薦技能 (Recommended)

#### 1. 金融知識
- **股票市場基礎** - 價格、成交量、技術指標
- **財務數據** - 財報、比率分析
- **投資組合管理** - 資產配置、風險管理

#### 2. 開發工具
- **Git** - 版本控制、分支管理
- **VS Code** - 開發環境配置
- **Chrome DevTools** - 調試、性能分析

#### 3. 部署運維
- **Vercel** - 前端部署、環境變量
- **域名管理** - DNS 配置、SSL 證書
- **監控日誌** - 錯誤追蹤、性能監控

## 📚 學習資源

### React & Next.js
```bash
# 官方文檔
https://react.dev/
https://nextjs.org/docs

# 推薦教程
- Next.js 14 App Router 完整指南
- React Hooks 深入理解
- TypeScript 與 React 最佳實踐
```

### Convex
```bash
# 官方文檔
https://docs.convex.dev/

# 核心概念
- 查詢 (Queries) 和變更 (Mutations)
- 實時訂閱 (Subscriptions)
- 認證和權限控制
- 數據建模
```

### 金融數據
```bash
# OpenBB 文檔
https://docs.openbb.co/

# 金融概念
- OHLCV 數據 (開高低收成交量)
- 技術分析指標
- 基本面分析
```

### 數據可視化
```bash
# Recharts 文檔
https://recharts.org/

# 圖表類型
- 線圖 (LineChart)
- 蠟燭圖 (CandlestickChart)
- 餅圖 (PieChart)
```

## 🛠 開發環境準備

### 必需軟件
```bash
# Node.js (18+)
https://nodejs.org/

# VS Code
https://code.visualstudio.com/

# Git
https://git-scm.com/
```

### VS Code 擴展
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

### 瀏覽器工具
- **React Developer Tools**
- **Redux DevTools** (如果使用)
- **Lighthouse** (性能分析)

## 📖 學習路徑

### 第一週：基礎準備
1. **Day 1-2**: React Hooks 複習
   - useState, useEffect, useContext
   - 自定義 Hooks
   - 性能優化 (useMemo, useCallback)

2. **Day 3-4**: Next.js App Router
   - 路由系統
   - 服務端組件 vs 客戶端組件
   - 數據獲取模式

3. **Day 5-7**: TypeScript 強化
   - 接口定義
   - 泛型使用
   - 類型守衛

### 第二週：核心技術
1. **Day 1-3**: Convex 深入
   - 數據庫設計
   - 查詢優化
   - 實時功能

2. **Day 4-5**: Tailwind CSS
   - 響應式設計
   - 組件樣式
   - 自定義配置

3. **Day 6-7**: 數據可視化
   - Recharts 基礎
   - 自定義圖表
   - 交互功能

### 第三週：項目實戰
1. **Day 1-2**: 項目架構設計
2. **Day 3-5**: 核心功能開發
3. **Day 6-7**: 測試和優化

## 🎯 技能檢查清單

### React & Next.js ✅
- [ ] 能夠創建函數組件
- [ ] 熟練使用 useState 和 useEffect
- [ ] 理解 Next.js App Router
- [ ] 能夠處理表單和用戶輸入
- [ ] 掌握錯誤邊界和錯誤處理

### TypeScript ✅
- [ ] 能夠定義接口和類型
- [ ] 理解泛型的使用
- [ ] 能夠處理異步操作的類型
- [ ] 掌握聯合類型和交叉類型

### Convex ✅
- [ ] 能夠設計數據庫模式
- [ ] 編寫查詢和變更函數
- [ ] 實現用戶認證
- [ ] 處理實時數據更新

### 樣式和 UI ✅
- [ ] 熟練使用 Tailwind CSS
- [ ] 能夠創建響應式布局
- [ ] 掌握 Radix UI 組件
- [ ] 實現暗色模式切換

### 數據處理 ✅
- [ ] 處理 JSON 數據
- [ ] 格式化日期和數字
- [ ] 實現數據過濾和排序
- [ ] 創建數據可視化圖表

## 🚀 實戰練習

### 練習 1: React 組件
創建一個股票卡片組件：
```typescript
interface StockCardProps {
  symbol: string
  price: number
  change: number
  changePercent: number
}

const StockCard: React.FC<StockCardProps> = ({ ... }) => {
  // 實現組件邏輯
}
```

### 練習 2: Convex 函數
編寫一個監控列表查詢：
```typescript
export const getWatchlist = query({
  args: {},
  handler: async (ctx) => {
    // 實現查詢邏輯
  }
})
```

### 練習 3: 數據可視化
創建一個價格趨勢圖：
```typescript
const PriceChart: React.FC<{ data: PriceData[] }> = ({ data }) => {
  return (
    <LineChart data={data}>
      {/* 配置圖表 */}
    </LineChart>
  )
}
```

## 📝 學習筆記模板

### 技術筆記
```markdown
# [技術名稱] 學習筆記

## 核心概念
- 概念1: 說明
- 概念2: 說明

## 代碼示例
```typescript
// 示例代碼
```

## 最佳實踐
1. 實踐1
2. 實踐2

## 常見問題
- 問題1: 解決方案
- 問題2: 解決方案
```

## 🎓 進階學習

### 性能優化
- React 性能優化技巧
- Next.js 構建優化
- 圖片和資源優化

### 測試
- Jest 單元測試
- React Testing Library
- E2E 測試 (Playwright)

### 安全性
- 輸入驗證
- XSS 防護
- CSRF 保護

### 監控和分析
- 錯誤追蹤 (Sentry)
- 性能監控
- 用戶行為分析

---

**建議**: 按照學習路徑逐步掌握技能，每個階段都要有實際的代碼練習。遇到問題時參考官方文檔和社區資源。