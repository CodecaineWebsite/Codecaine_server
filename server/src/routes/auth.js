import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { usersTable } from "../models/schema.js";
import { verifyFirebase } from "../middlewares/varifyFirebase.js";
import { eq } from "drizzle-orm";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_default_secret"; // 請記得在 .env 設定

/**
 * GET /api/auth/me
 * 驗證 Firebase token 並確保使用者存在於資料庫中（首次登入會建立）
 * 取得合法 Firebase token 與 Postman 測試方式：
 * 1. 啟動前端 client -> npm run dev
 * 2. 前往登入頁 http://localhost:5173/login
 * 3. 自行輸入帳號密碼登入，在 JWT token 欄或開啟 console 取得 idToken
 * 4. 開啟 Postman → 新增一個 request
 * 5. 方法選擇 GET，輸入網址 http://localhost:3000/api/auth/me
 * 6. 點選「Authorization」頁籤
 *    Type：選擇 Bearer Token
 *    Token：貼上剛剛從 Firebase 拿到的 idToken
 * 7. 送出
 * 預期回傳結果：
 * {
  "message": "驗證成功，並同步使用者資料",
  "user": {
    "id": "firebaseUid123",
    "email": "user@example.com",
    "username": "user",
    ...
  }
}
 */
router.get("/me", verifyFirebase, async (req, res) => {
	try {
		// Firebase 驗證後，middleware 已經保證 userId 存在資料庫
		const userId = req.userId;

		// 取得使用者資料
		const user = (await db.select().from(usersTable).where(eq(usersTable.id, userId)))[0];
		if (!user) return res.status(404).json({ error: "找不到使用者" });

		const { password_hash, ...safeUser } = user;
		res.json({
			message: "驗證成功，並同步使用者資料",
			user: safeUser,
		});
	} catch (err) {
		console.error("取得 /me 使用者資料失敗:", err);
		res.status(500).json({ error: "伺服器錯誤" });
	}
});

/**
 * GET /api/auth/profile
 * 使用 Firebase 驗證 ， 回傳目前使用者的資料（從資料庫）
 */
router.get("/profile", verifyFirebase, async (req, res) => {
	try {
		const firebaseUid = req.userId;

		const user = (await db.select().from(usersTable).where(eq(usersTable.id, firebaseUid)))[0];
		if (!user) return res.status(404).json({ error: "找不到使用者" });

		const { password_hash, ...safeUser } = user;
		res.json(safeUser);
	} catch (err) {
		console.error("取得使用者資料失敗:", err);
		res.status(500).json({ error: "伺服器錯誤" });
	}
});






// 舊 JWT 邏輯，目前登入方式整合firebase所以暫時作廢，但保留原始碼以備用






/**
 * POST /api/auth/register
 * 註冊新使用者
 */
// router.post("/register", async (req, res) => {
//   const { email, username, password } = req.body;

//   // 檢查是否已有帳號存在
//   const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
//   if (existing.length > 0) return res.status(409).json({ error: "Email 已被註冊" });

//   // 雜湊密碼
//   const hash = await bcrypt.hash(password, 10);

//   // 新增使用者
//   const [user] = await db
//     .insert(usersTable)
//     .values({ email, username, password_hash: hash })
//     .returning();

//   // 回傳 token
//   const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
//   res.status(201).json({ token });
// });

// /**
//  * POST /api/auth/login
//  * 登入
//  */
// router.post("/login", async (req, res) => {
//   const { email, password } = req.body;

//   const user = (await db.select().from(usersTable).where(eq(usersTable.email, email)))[0];
//   if (!user) return res.status(401).json({ error: "帳號或密碼錯誤" });

//   const isValid = await bcrypt.compare(password, user.password_hash);
//   if (!isValid) return res.status(401).json({ error: "帳號或密碼錯誤" });

//   const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
//   res.json({ token });
// });

// /**
//  * GET /api/auth/profile
//  * 驗證 token 並回傳使用者資料
//  */
// router.get("/profile", async (req, res) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return res.status(401).json({ error: "未提供 token" });

//   const token = authHeader.replace("Bearer ", "");
//   try {
//     const payload = jwt.verify(token, JWT_SECRET);
//     const user = (await db.select().from(usersTable).where(eq(usersTable.id, payload.id)))[0];
//     if (!user) return res.status(404).json({ error: "使用者不存在" });

//     const { password_hash, ...safeUser } = user;
//     res.json(safeUser);
//   } catch (err) {
//     res.status(401).json({ error: "無效的 token" });
//   }
// });

export default router;