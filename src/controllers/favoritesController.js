import db from "../config/db.js";
import { favoritesTable, pensTable, usersTable } from "../models/schema.js";
import { eq, and, desc, sql } from "drizzle-orm";

// POST /api/favorites
export async function addFavorite(req, res) {
  const { pen_id } = req.body;
  const user_id = req.userId; // 從驗證中獲取使用者ID
  if (!pen_id) {
    return res.status(400).json({ error: "Missing pen_id" });
  }

  try {
    const result = await db
      .insert(favoritesTable)
      .values({ user_id, pen_id })
      .onConflictDoNothing()
      .returning();
    if (result.length === 0) {
      return res
        .status(200)
        .json({ success: false, message: "Already favorited" });
    }
    res.status(201).json({
      success: true,
      message: "Favorited successfully",
      pen_id: result[0].pen_id,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to favorite", details: err.message });
  }
}

// DELETE /api/favorites
export async function removeFavorite(req, res) {
  const { pen_id } = req.body;
  const user_id = req.userId;

  if (!pen_id) {
    return res.status(400).json({ error: "Missing pen_id" });
  }

  try {
    const result = await db
      .delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.user_id, user_id),
          eq(favoritesTable.pen_id, pen_id)
        )
      )
      .returning();

    if (result.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Favorite not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Favorite removed successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to remove favorite", details: err.message });
  }
}

// GET /api/favorites/:username
export async function getFavoritesByUsername(req, res) {
  const { username } = req.params;
  const { view = "grid", page: rawPage = "1" } = req.query;

  const page = parseInt(rawPage, 10) || 1;
  const limit = view === "table" ? 15 : 6;
  const offset = (page - 1) * limit;

  // 取得 user_id
  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username))
    .limit(1);

  if (user.length === 0) {
    return res.status(404).json({ error: "找不到該使用者" });
  }

  const user_id = user[0].id;

  // 查詢總數
  const totalResult = await db
    .select({ count: sql`count(*)` })
    .from(favoritesTable)
    .where(eq(favoritesTable.user_id, user_id));

  const total = Number(totalResult[0]?.count) || 0;
  const totalPages = Math.ceil(total / limit);

  // 查當頁收藏作品 + 作者資訊
  const pens = await db
    .select({
      id: pensTable.id,
      title: pensTable.title,
      description: pensTable.description,
      is_private: pensTable.is_private,
      created_at: pensTable.created_at,
      updated_at: pensTable.updated_at,
      favorites_count: pensTable.favorites_count,
      comments_count: pensTable.comments_count,
      views_count: pensTable.views_count,
      username: usersTable.username,
      user_display_name: usersTable.display_name,
      profile_image: usersTable.profile_image_url,
      is_pro: usersTable.is_pro,
    })
    .from(favoritesTable)
    .innerJoin(pensTable, eq(favoritesTable.pen_id, pensTable.id))
    .innerJoin(usersTable, eq(pensTable.user_id, usersTable.id))
    .where(eq(favoritesTable.user_id, user_id))
    .orderBy(desc(favoritesTable.created_at))
    .limit(limit)
    .offset(offset);

  res.json({
    results: pens,
    total,
    totalPages,
    currentPage: page,
  });
}

// GET /api/favorites/check/:pen_id
export async function checkFavorite(req, res) {
  const user_id = req.userId;
  const { pen_id } = req.params;
  if (!pen_id) {
    return res.status(400).json({ error: "Missing pen_id" });
  }
  try {
    const result = await db
      .select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.user_id, user_id),
          eq(favoritesTable.pen_id, pen_id)
        )
      )
      .limit(1);
    res.json({ liked: result.length > 0 });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to check favorite", details: err.message });
  }
}

// GET /api/favorites/count/:pen_id
export async function countFavorites(req, res) {
  const { pen_id } = req.params;
  if (!pen_id) {
    return res.status(400).json({ error: "Missing pen_id" });
  }
  try {
    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(favoritesTable)
      .where(eq(favoritesTable.pen_id, pen_id));
    const favoritesCount = Number(countResult[0]?.count) || 0;
    res.json({ favoritesCount });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to count favorites", details: err.message });
  }
}
