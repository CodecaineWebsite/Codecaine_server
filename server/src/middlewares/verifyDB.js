import db from "../config/db.js";
import { usersTable } from "../models/schema.js";
import { eq } from "drizzle-orm";

export async function verifyDB(req, res, next) {
  try {
    // 查找 DB 是否已有對應 user
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.userId));
    const user = result[0];

    // 如果沒有，就創建一筆（首次登入）
    if (!user) {
      await db.insert(usersTable).values({
        id: req.userId,
        email: req.firebaseUser.email,
        username:
          req.firebaseUser.name ||
          req.firebaseUser.email?.split("@")[0] ||
          "FirebaseUser",
        password_hash: "firebase", // 填預設值，因為用不到
        display_name: req.firebaseUser.name || null,
        // profile_image: req.firebaseUser.picture || null,  // TODO
        bio: "", // 預設值
      });
    }

    next();
  } catch (err) {
    console.error("使用者資料庫建立錯誤:", err);
    return res.status(500).json({ error: "使用者資料同步失敗" });
  }
}
