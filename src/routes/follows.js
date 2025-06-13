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
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /api/follows/:username
 * 取消追蹤
 * Body: { follower_id, following_id }
 */
router.delete("/:username", verifyFirebase, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/follows/check/:username
 * 檢查目前登入者是否已追蹤某個使用者（供前端按鈕顯示）
 */
router.get("/check/:username", verifyFirebase, async (req, res) => {
  try {
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 *
 * GET /api/followings/:username
 * 檢查這個人追蹤了哪些人
 */
router.get("/followings/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = user[0].id;
    const followings = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        profile_image: usersTable.profile_image_url || null,
      })
      .from(followsTable)
      .innerJoin(usersTable, eq(followsTable.following_id, usersTable.id))
      .where(eq(followsTable.follower_id, userId));

    res.json({ followings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 *
 * GET /api/follows/followers/:username
 * 檢查有哪些人追蹤這個人
 */
router.get("/followers/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = user[0].id;
    const followers = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        display_name: usersTable.display_name,
        profile_image: usersTable.profile_image_url || null,
      })
      .from(followsTable)
      .innerJoin(usersTable, eq(followsTable.follower_id, usersTable.id))
      .where(eq(followsTable.following_id, userId));

    res.json({ followers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
