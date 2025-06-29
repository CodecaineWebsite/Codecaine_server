<div align="center">

![Image](https://github.com/user-attachments/assets/9c45f024-55e3-4f17-b48d-a204fa4d68a8)

# Codecaine

*一站式線上前端程式碼編輯、分享與探索平台*

[前往網站](https://www.codecaine.xyz/)

</div>

Codecaine 是一個靈感來自 CodePen 的線上前端開發平台，致力於提供開發者即時編輯、預覽、分享作品的空間。我們整合了會員系統、社群互動、金流付費與 AI 程式助理功能，讓每一位開發者都能在這裡打造自己的專屬 Playground。

---

## 🛠 技術架構

- **Frontend**：Vue 3 + TailwindCSS + Monaco Editor  
- **Backend**：Node.js + Express + PostgreSQL  
- **Authentication**：Firebase Auth  
- **Storage**：AWS S3  
- **AI**：OPEN AI  
- **Deploy**：Zeabur

---

## ✨ 功能特色

- 即時編輯、即時預覽，支援 HTML/CSS/JavaScript 快速切換  
- 會員系統與個人檔案，支援追蹤、收藏、留言與通知  
- 支援 Stripe 訂閱制，開通 Pro 權限解鎖更多功能  
- AI 程式助理，提升開發效率，協助除錯與撰寫程式碼  
- 全站搜尋與作品推薦演算法，讓好作品被看見  

---

## 👩‍💻 團隊成員

| 成員 | 貢獻內容 |
|------|----------|
| [邱郁婷](https://github.com/chinyuting) | 編輯器功能 / 即時預覽 / Console / AI 助理 |
| [林威廷](https://github.com/WeyTing) | Firebase Auth / Stripe 金流 / 個人檔案 / 通知 |
| [陳竑齊](https://github.com/lllBarry) | 編輯器使用者設定 / CDN 搜尋 / 會員分級權限 |
| [孫瑋微](https://github.com/ViviSun0725) | 搜尋 / 收藏 / 推薦演算法 / 留言板 / AWS S3 / 部屬 |
| [陳俊宏](https://github.com/k890120) | 推播區塊 / 作品卡設計 / 註冊頁 |
| [杜澄潔](https://github.com/kaiadu) | 作品管理 UI / Logo 設計 |
| [段振東](https://github.com/duanjendong) | 登入與載入畫面設計 |

---

## 📦 安裝與使用方式

### 1. 安裝專案依賴

```bash
npm install
```

### 2. 設定資料庫與環境變數 `.env`

```env
# 資料庫連線位址
DATABASE_URL=

# Firebase 連線
FIREBASE_SERVICE_ACCOUNT=

# AWS 連線
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET_NAME=

# Stripe 連線
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUBSCRIPTION_PRICE_ID=

# OpenAI
OPENAI_API_KEY=

# 前端網址網域（可選）
BASE_URL=
```

### 3. 建立資料庫 schema

```bash
npm run generate
npm run migrate
```

### 4. 啟動專案

- **Server**（此 repo）

```bash
npm run dev
```

- **Client**（請前往 [Codecaine_client](https://github.com/CodecaineWebsite/Codecaine_client)）

```bash
npm run dev
```

---

## 🧑‍💻 開發者指引

### 分支流程

```bash
# 1. 切換到最新的 dev
git checkout dev
git pull origin dev

# 2. 建立功能分支
git checkout -b feat/your-name-task

# 3. Commit & Push
git add <file1> <file2> ...
git commit -m "[feat] 完成登入 API"
git push origin feat/your-task
```

### Commit 與分支命名規則

| 類型 | 範例 |
|------|------|
| `feat` | 新增功能 |
| `fix` | 修正錯誤 |
| `refactor` | 程式碼重構 |
| `docs` | 撰寫文件 |
| `style` | 格式調整（無功能變動） |
| `test` | 測試新增或調整 |
| `build` | 修改建置系統設定 |
| `chore` | 其他無分類雜項 |

命名建議採用 [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) 標準。

---

## 📄 聲明

本專案僅作為學習用途使用。致敬 CodePen 原始概念，無任何商業用途。如有侵權請聯繫我們進行處理。
