import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import {
  getUserById,
  updateUserProfile,
  getUserPens,
  getUserFollowing,
  getUserFollowers,
} from "../controllers/userController.js";
import { upload } from "../config/s3.js";

const router = Router();

/**
 * GET /api/users/:id
 * 取得使用者個人資料（不含密碼）
 */
router.get("/:id",getUserById);

/**
 * PUT /api/users/:id
 * 編輯使用者資料（含頭像上傳）
 *
 * 請用 multipart/form-data 傳送
 * 需帶 Firebase 驗證 header（已由 verifyFirebase middleware 驗證）
 *
 * 可傳送欄位（form-data 格式）：
 * - display_name: string        使用者顯示名稱
 * - bio: string                 自我介紹
 * - location: string           所在地
 * - profile_link1: string      個人連結 1
 * - profile_link2: string      個人連結 2
 * - profile_link3: string      個人連結 3
 * - profile_image: File        使用者頭像（image/*）
 *
 * 備註：
 * - 若有上傳新頭像，會自動刪除舊的 S3 頭像
 * - 未傳的欄位會保留原值，不會被清空
 */
router.put(
  "/:id",
  verifyFirebase,
  upload.single("profile_image"),
  updateUserProfile
);

/**
 * GET /api/users/:id/pens
 * 查詢某使用者的所有作品
 */
router.get("/:id/pens", getUserPens);

/**
 * GET /api/users/:id/following
 * 查詢此使用者追蹤的人
 */
router.get("/:id/following", getUserFollowing);

/**
 * GET /api/users/:id/followers
 * 查詢追蹤此使用者的人
 */
router.get("/:id/followers", getUserFollowers);

export default router;

//**
// TODO:
//  把 GET /api/users/:id/pens 改為查詢所有公開作品
//  處理查詢公開作品與私人作品API
//  */
