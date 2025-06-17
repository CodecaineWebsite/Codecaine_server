import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import {
  addFavorite,
  removeFavorite,
  getFavoritesByUsername,
  checkFavorite,
  countFavorites,
} from "../controllers/favoritesController.js";

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
router.post("/", verifyFirebase, addFavorite);

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
router.delete("/", verifyFirebase, removeFavorite);

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
router.get("/:username", getFavoritesByUsername);

/**
 * GET /api/favorites/check/:pen_id
 * 檢查目前登入者是否已收藏某作品
 *
 * @param {number} pen_id - 作品 ID
 * @header Authorization Bearer token (Firebase JWT)
 *
 * @response {200} { liked: true/false }
 * @response {401} 未登入
 */
router.get("/check/:pen_id", verifyFirebase, checkFavorite);

/**
 * GET /api/favorites/count/:pen_id
 * 查詢某作品被收藏的總數
 *
 * @param {number} pen_id - 作品 ID
 *
 * @response {200} { favoritesCount: 數字 }
 * @response {400} 缺少 pen_id
 * @response {500} 查詢失敗
 */
router.get("/count/:pen_id", countFavorites);

export default router;
