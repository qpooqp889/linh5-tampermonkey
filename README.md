# LinH5 工具箱 - Tampermonkey Userscript

一個專為 [LinH5 放置天堂 · 即時版](https://linh5web.win/) 設計的 Tampermonkey 增強腳本。

## 📦 安裝

### 前置需求
1. 瀏覽器安裝 [Tampermonkey](https://www.tampermonkey.net/) 擴充功能
2. 點擊下方安裝連結

### 安裝連結
> [**🔗 安裝 LinH5 工具箱 v2.07**](https://raw.githubusercontent.com/qpooqp889/linh5-tampermonkey/main/linh5-tampermonkey.user.js)

或手動新增腳本，將 [linh5-tampermonkey.user.js](./linh5-tampermonkey.user.js) 內容貼入。

## ✨ 功能

### ⚙ 設定面板
Topbar 右側 ⚙ 齒輪按鈕 → 開啟設定 Modal，可用開關切換功能。

### 🐉 世界王自動更新置頂
- 「存活中」的世界王自動排到列表最前面
- 已被擊敗的王恢復原始順序
- ★ 星星可**置頂最愛王**（儲存於 localStorage），不受死活影響
- Top 狀態列顯示最近重生王的倒數計時
- 每秒更新

### 🎒 背包物品檢索
- 搜尋框：依道具**名稱**過濾格子
- 下拉選單：依**強化值 +4 ~ +10** 篩選
- 統計顯示「顯示 X / 總數」

### 💰 交易所金錢模糊搜尋
- 名稱搜尋框下方新增 `💰` 金額輸入框
- 模糊數字匹配：輸入 `800` 可找到 `2,800,000`
- 自動在價格後附加簡寫：`2,800,000` → `280 萬`，`1,299,999` → `129.99... 萬`，`150,000,000` → `1.5 億`
- 右側排序下拉：可選「價錢低→高」排序（斷開 observer 避免死循環）

### 🏷️ 變更姓名
- 第四開關「變更姓名」，開啟後顯示輸入框
- 輸入自訂名稱按套用（或 Enter），立即修改 topbar 顯示名稱
- 名稱儲存於 `localStorage`，每 600ms 自動防覆蓋
- 純前端顯示，不影響伺服器資料

## 📜 版本歷史

| 版本 | 說明 |
|------|------|
| v2.07 | 新增變更姓名開關 + 交易所排序下拉（價錢低→高）|

## 🔧 技術細節

- **純 Tampermonkey** — 無外部依賴，`GM_setValue/getValue` 存設定
- **超級巡邏員** — 單一 `setInterval` 監聽 SPA 頁面重建，自動重掛所有功能
- **星星置頂** — 使用 `localStorage` 持久化最愛王列表
