import { Router } from "express";
import { eq, and } from "drizzle-orm";
import db from "../config/db.js";
import { followsTable, usersTable } from "../models/schema.js";
import { requireAuth } from "../middlewares/auth.js";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";

const router = Router();

/**
 * POST /api/follows
 * 追蹤某使用者
 * Body: { following_id }
 */
router.post("/:username", verifyFirebase, async (req, res) => {
  const follower_id = req.userId; // 從驗證中取得目前使用者 ID
  const following_username = req.params.username; // 修正這一行
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, following_username))
    .limit(1);
  if (!user.length) return res.status(404).json({ error: "User not found" });
  const following_id = user[0].id;
  if (follower_id === following_id) {
    return res.status(400).json({ error: "不能追蹤自己！" });
  }

  const result = await db
    .insert(followsTable)
    .values({ follower_id, following_id })
    .onConflictDoNothing();

  res.status(201).json({ success: true, result: result });
});

/**
 * DELETE /api/follows
 * 取消追蹤
 * Body: { follower_id, following_id }
 */
router.delete("/", async (req, res) => {
  const { follower_id, following_id } = req.body;

  await db
    .delete(followsTable)
    .where(
      and(
        eq(followsTable.follower_id, follower_id),
        eq(followsTable.following_id, following_id)
      )
    );

  res.status(204).end();
});

/**
 * GET /api/follows/check/:target_id
 * 檢查目前登入者是否已追蹤某個使用者（供前端按鈕顯示）
 */
router.get("/check/:target_id", async (req, res) => {
  const { follower_id } = req.body;
  const following_id = parseInt(req.params.target_id);

  const result = await db
    .select()
    .from(followsTable)
    .where(
      and(
        eq(followsTable.follower_id, follower_id),
        eq(followsTable.following_id, following_id)
      )
    );

  res.json({ isFollowing: result.length > 0 });
});

export default router;
