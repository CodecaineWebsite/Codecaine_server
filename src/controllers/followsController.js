import { eq, and, sql } from "drizzle-orm";
import db from "../config/db.js";
import { followsTable, usersTable } from "../models/schema.js";
import { createNotification } from "../utils/createNotification.js";

/**
 * 追蹤某使用者
 * POST /api/follows/:username
 */
export const followUser = async (req, res) => {
  try {
    const { follower_id, following_username } = getFollowIds(req);
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

    const checkFollow = await db
      .select()
      .from(followsTable)
      .where(
        and(
          eq(followsTable.follower_id, follower_id),
          eq(followsTable.following_id, following_id)
        )
      );

    if (checkFollow.length === 1) {
      await createNotification({
        recipientId: following_id,
        senderId: follower_id,
        type: "follow",
      });
    }

    res.status(201).json({ result: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 取消追蹤某使用者
 * DELETE /api/follows/:username
 */
export const unfollowUser = async (req, res) => {
  try {
    const { follower_id, following_username } = getFollowIds(req);
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

    res.status(200).json({ result: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 檢查目前登入者是否已追蹤某個使用者（供前端按鈕顯示）
 * GET /api/follows/check/:username
 */
export const checkFollowing = async (req, res) => {
  try {
    const { follower_id, following_username } = getFollowIds(req);
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
};

/**
 * 查詢這個人追蹤了哪些人（分頁）
 * GET /api/follows/followings/:username?page=1&pageSize=20
 */
export const getFollowings = async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 30;
    const offset = (page - 1) * pageSize;

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = user[0].id;
    const totalResult = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(followsTable)
      .where(eq(followsTable.follower_id, userId));
    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const followings = await db
      .select({
        username: usersTable.username,
        display_name: usersTable.display_name,
        profile_image: usersTable.profile_image_url || null,
      })
      .from(followsTable)
      .innerJoin(usersTable, eq(followsTable.following_id, usersTable.id))
      .where(eq(followsTable.follower_id, userId))
      .limit(pageSize)
      .offset(offset);

    res.json({
      followings,
      total: totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 查詢有哪些人追蹤這個人（分頁）
 * GET /api/follows/followers/:username?page=1&pageSize=20
 */
export const getFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page) || 1;
    const pageSize = 30;
    const offset = (page - 1) * pageSize;

    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.username, username))
      .limit(1);
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = user[0].id;

    const totalResult = await db
      .select({ count: sql`count(*)`.mapWith(Number) })
      .from(followsTable)
      .where(eq(followsTable.following_id, userId));
    const totalCount = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    const followers = await db
      .select({
        username: usersTable.username,
        display_name: usersTable.display_name,
        profile_image: usersTable.profile_image_url || null,
      })
      .from(followsTable)
      .innerJoin(usersTable, eq(followsTable.follower_id, usersTable.id))
      .where(eq(followsTable.following_id, userId))
      .limit(pageSize)
      .offset(offset);

    res.json({
      followers,
      total: totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// 工具函式
const getFollowIds = (req) => {
  return {
    follower_id: req.userId,
    following_username: req.params.username,
  };
};
