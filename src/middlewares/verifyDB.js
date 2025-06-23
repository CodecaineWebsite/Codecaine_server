import db from "../config/db.js";
import { usersTable } from "../models/schema.js";
import { eq } from "drizzle-orm";

export async function verifyDB(req, res, next) {
  try {
    // 查找 DB 是否已有對應 user
    const result = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.user.uid));
    const user = result[0];

    // 如果沒有，就創建一筆（首次登入）
    if (!user) {
      const baseUsername = sanitizeUsername(req.user.name || req.user.email?.split("@")[0] || "user");
      const username = await generateUniqueUsername(baseUsername);

      await db.insert(usersTable).values({
        id: req.userId,
        email: req.user.email,
        username,
        profile_image_url : "https://codecaine-client-staging.zeabur.app/default-avatar.png",
        display_name: req.user.name || username ||null,
        bio: "",
      });
    }

    next();
  } catch (err) {
    console.error("An error occurred while creating the user record:", err);
    return res.status(500).json({ error: "User data synchronization failed" });
  }
}

function sanitizeUsername(nameOrEmail) {
  // 從名稱或 email 前段取值，移除特殊符號與空白
  return nameOrEmail
    .toLowerCase()
    .replace(/\s+/g, '')           // 移除空格
    .replace(/[^a-z0-9_]/g, '');   // 移除非 a-z、0-9、_
}

async function generateUniqueUsername(base) {
  let username = base;
  let count = 0;
  const MAX_ATTEMPTS = 100;
  while (count < MAX_ATTEMPTS) {
    const exists = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (exists.length === 0) break;
    count++;
    username = `${base}${count}`;
  }

  if (count === MAX_ATTEMPTS) {
  throw new Error("Username generation failed. Try again.");
}
  return username;

}