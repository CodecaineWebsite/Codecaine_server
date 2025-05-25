// const admin = require("../config/firebase");

// async function authenticate(req, res, next) {
// 	const authHeader = req.headers.authorization;
// 	if (!authHeader || !authHeader.startsWith("Bearer ")) {
// 		return res.status(401).json({ error: "Missing token" });
// 	}

// 	const idToken = authHeader.split(" ")[1];

// 	try {
// 		const decoded = await admin.auth().verifyIdToken(idToken);
// 		req.user = decoded;
// 		next();
// 	} catch (err) {
// 		console.error("驗證失敗:", err);
// 		return res.status(401).json({ error: "無效的 token" });
// 	}
// }

// module.exports = authenticate;

//////////////////////////////////////////
// V: 測試
// src/middlewares/verifyFirebase.js
import admin from "../config/firebase.js";
import { db } from "../db/index.js"; // 你自己的 Drizzle 初始化
import { usersTable } from "../db/schema.js";
import { eq } from "drizzle-orm";

export async function verifyFirebase(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Missing token" });
	}

	const idToken = authHeader.split(" ")[1];

	try {
		const decoded = await admin.auth().verifyIdToken(idToken);
		const firebaseUid = decoded.uid;

		// 查找 DB 是否已有對應 user
		const result = await db.select().from(usersTable).where(eq(usersTable.id, firebaseUid));
		const user = result[0];

		// 如果沒有，就創建一筆（首次登入）
		if (!user) {
			await db.insert(usersTable).values({
				id: firebaseUid,
				email: decoded.email,
				username: decoded.name || decoded.email?.split("@")[0] || "FirebaseUser",
				password_hash: "firebase", // 填預設值，因為用不到
			});
		}

		// 加入 request，後續 API 可取得
		req.firebaseUser = decoded;
		req.userId = firebaseUid;

		next();
	} catch (err) {
		console.error("驗證失敗:", err);
		return res.status(401).json({ error: "Invalid token" });
	}
}


