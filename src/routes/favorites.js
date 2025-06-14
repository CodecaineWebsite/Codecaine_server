import { Router } from "express";
import db from "../config/db.js";
import { favoritesTable, pensTable, usersTable } from "../models/schema.js";
import { eq, and, inArray, desc } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";

const router = Router();

/**
 * POST /api/favorites
 * Add a pen to the current user's favorites (authentication required)
 * @body {number} pen_id - The ID of the pen to be favorited (required)
 *
 * @header Authorization Bearer token (provided by Firebase)
 *
 * @response {201} Successfully favorited the pen
 * @response {400} Missing pen_id in request body
 * @response {500} Failed to favorite the pen due to a server or database error
 *
 * @example
 * POST /api/favorites
 * {
 *   "pen_id": 42
 * }
 */
router.post("/", verifyFirebase, async (req, res) => {
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
    res
      .status(201)
      .json({
        success: true,
        message: "Favorited successfully",
        pen_id: inserted.pen_id,
      });
  } catch (err) {
    res.status(500).json({ error: "Failed to favorite", details: err.message });
  }
});

/**
 * DELETE /api/favorites
 * Remove a favorited pen for the logged-in user
 *
 * @body {number} pen_id - ID of the pen to remove from favorites
 * @header Authorization Bearer token (Firebase JWT)
 *
 * @response {200} Successfully removed
 * @response {400} Missing pen_id
 * @response {404} Favorite not found
 * @response {500} Failed to remove favorite
 */
router.delete("/", async (req, res) => {
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
});


/**
 * GET /api/favorites/:username
 * 公開查詢某使用者的收藏作品
 *
 * @param {string} username - 使用者帳號名稱（非 ID）
 * @query {string} view - 顯示模式，"grid" 或 "table"，預設為 "grid"
 * @query {number} page - 分頁頁數，預設為 1
 *
 * @returns {Object} 收藏作品清單與分頁資訊
 * @example
 * GET /api/favorites/lucy123?view=table&page=2
 */
router.get("/:username", async (req, res) => {
  const { username } = req.params;
  const { view = "grid", page: rawPage = "1" } = req.query;

  const page = parseInt(rawPage, 10) || 1;
  const limit = view === "table" ? 10 : 6;
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
      preview_image: pensTable.preview_image,
      privacy: pensTable.privacy,
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
});

/**
 * GET /api/favorites
 * 取得目前登入使用者的所有收藏作品
 * 功能重複，先註解掉
 * 
 */
// router.get("/", verifyFirebase, async (req, res) => {
//   const user_id = req.userId;

//   const result = await db
//     .select({
//       pen_id: favoritesTable.pen_id,
//     })
//     .from(favoritesTable)
//     .where(eq(favoritesTable.user_id, user_id));

//   const penIds = result.map((r) => r.pen_id);

//   const pens = await db
//     .select()
//     .from(pensTable)
//     .where(inArray(pensTable.id, penIds));

//   res.json(pens);
// });


export default router;
