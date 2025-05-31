## 後端啟動說明

### 1. 安裝相依套件

```bash
npm install
```

### 2. 安裝 PostgreSQL 與 pgAdmin，並建立一個測試資料庫

### 3. 設定環境變數（.env）
請在 /server 目錄下建立 .env 檔，內容如下：

```
DATABASE_URL=postgresql://[你的postgres帳號]:[密碼]@localhost:5432/[資料庫名稱]
FIREBASE_SERVICE_ACCOUNT={"type":"service_account", ...}
```
DATABASE_URL：連線資料庫用
FIREBASE_SERVICE_ACCOUNT：完整內容請至 Discord 下載威廷的環境變數檔

### 4. 建立資料表與種子資料
請在 /server 目錄執行：

```bash
npm run generate    # 產生 migration 記錄
npm run migrate     # 建立資料表
npm run seed        # 建立測試用種子資料（可選）
```
補充：若要清除資料表內所有資料：

```bash
npm run seed:clean
```
註1：種子資料使用者僅用於API串接測試，請勿使用seed的假使用者於前端登入或註冊頁登入
    你可以手動在資料庫新增種子使用者，不會與 Firebase 衝突，只要你自己不要登入這些帳號的 Firebase。
註2：若你已經建立了舊版的database，由於新版schema有更改欄位資料型別，這版PR 的 migration 紀錄全部重置，建議建立一個新的 database，或 drop 舊版database 重新建立

## Firebase 驗證說明
本專案後端採用 Firebase Auth 驗證機制：

前端透過 Firebase SDK 登入並取得 idToken

呼叫後端 API 時需帶上 Bearer Token

後端使用 firebase-admin 驗證 token，並自動同步使用者資料至資料庫（首次登入）

verifiyFirebase 的 middleware 會解析 Token 中的使用者資料，並把解析出的 uid 與 user 添加進 req

```javascript
req.userID // 使用者的 firebase uid
req.user   // 使用者的 firebase user 物件
```

使用者首次登入/註冊後，前端請呼叫：

```
GET /api/auth/me
```
此 API 會：

1. 驗證 token

2. 若資料庫中尚無此 user，則自動建立

3. 回傳該使用者資料（不含密碼）