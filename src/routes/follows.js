import { Router } from "express";
import { eq, and } from "drizzle-orm";
import db from "../config/db.js";
import { followsTable, usersTable } from "../models/schema.js";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";

const router = Router();

/**
 * POST /api/follows
 * 追蹤某使用者
 * Body: { follower_id, following_id }
 */
router.post("/:username", verifyFirebase, async (req, res) => {
  const follower_id = req.userId; // 從驗證中取得目前使用者 ID
  const following_username = req.params.username; // 修正這一行
  const currentUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, follower_id))
    .limit(1);
  if (!currentUser.length)
    return res.status(404).json({ error: "User not found" });
  const targetUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, following_username))
    .limit(1);
  if (!targetUser.length)
    return res.status(404).json({ error: "User not found" });
  const following_id = targetUser[0].id;
  if (follower_id === following_id) {
    return res.status(400).json({ error: "cant follow yourself" });
  }

  await db
    .insert(followsTable)
    .values({ follower_id, following_id })
    .onConflictDoNothing();

  res.status(201).json({ result: true });
});

/**
 * DELETE /api/follows/:username
 * 取消追蹤
 * Body: { follower_id, following_id }
 */
router.delete("/:username", verifyFirebase, async (req, res) => {
  const follower_id = req.userId; // 從驗證中取得目前使用者 ID
  const following_username = req.params.username; // 修正這一行
  const currentUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, follower_id))
    .limit(1);
  if (!currentUser.length)
    return res.status(404).json({ error: "User not found" });
  const targetUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, following_username))
    .limit(1);
  if (!targetUser.length)
    return res.status(404).json({ error: "User not found" });
  const following_id = targetUser[0].id;
  await db
    .delete(followsTable)
    .where(
      and(
        eq(followsTable.follower_id, follower_id),
        eq(followsTable.following_id, following_id)
      )
    );

  res.status(201).json({ result: false });
});

/**
 * GET /api/follows/check/:username
 * 檢查目前登入者是否已追蹤某個使用者（供前端按鈕顯示）
 */
router.get("/check/:username", verifyFirebase, async (req, res) => {
  const follower_id = req.userId; // 從驗證中取得目前使用者 ID
  const following_username = req.params.username; // 修正這一行
  const currentUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, follower_id))
    .limit(1);
  if (!currentUser.length)
    return res.status(404).json({ error: "not current user" });
  const targetUser = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, following_username))
    .limit(1);
  if (!targetUser.length)
    return res.status(404).json({ error: "User not found" });
  const following_id = targetUser[0].id;
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
///編輯中 先將追蹤功能推上去 之後再整理controller
/**
 *
 * GET /api/follows/check/
 * 檢查這個人追蹤了哪些人
 */
router.get("/checkFollowing", async (req, res) => {
  const follower_id = req.userId;
  const result = await db
    .select()
    .from(followsTable)
    .where(eq(followsTable.follower_id, follower_id));
  if (!result.length) {
    return res.status(404).json({ error: "You haven't followed anyone yet." });
  } else {
    res.json(result);
  }
});

/**
 *
 * GET /api/follows/check/
 * 檢查有哪些人追蹤這個人
 */
export default router;
