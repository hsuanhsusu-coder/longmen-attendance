# 龍門國中泳隊 · 訓練點名簿

雲端版多教練協同點名系統。

## ⭐ 部署到網路上

**完整步驟在 [部署指南.md](./部署指南.md)** —— 全程網頁點按、零命令列、約 1.5 小時完成。

## 功能

- 三個分頁：點名 / 每日總覽 / 五月統計
- Google 登入（多位教練可共用）
- 即時雲端同步（Firestore）
- 截圖模式（一頁包含 33 人完整狀態，傳老師用）
- CSV 匯出
- iPhone / Android / 桌面瀏覽器都能用

## 技術棧

- React + Vite
- Firebase (Auth + Firestore)
- Vercel hosting
- Tailwind CSS (CDN)

## 給開發者

```bash
npm install
cp .env.example .env.local  # 填入 Firebase 設定
npm run dev
```
