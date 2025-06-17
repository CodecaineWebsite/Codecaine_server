import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import {
  followUser,
  unfollowUser,
  checkFollowing,
  getFollowings,
  getFollowers,
} from "../controllers/followsController.js";

const router = Router();

/**
 * POST /api/follows/:username
 * 追蹤某使用者
 * Body: { follower_id, following_username }
 */
router.post("/:username", verifyFirebase, followUser);

/**
 * DELETE /api/follows/:username
 * 取消追蹤某使用者
 */
router.delete("/:username", verifyFirebase, unfollowUser);

/**
 * GET /api/follows/check/:username
 * 檢查目前登入者是否已追蹤某個使用者（供前端按鈕顯示）
 */
router.get("/check/:username", verifyFirebase, checkFollowing);

/**
 * GET /api/follows/followings/:username
 * 查詢這個人追蹤了哪些人
 */
router.get("/followings/:username", getFollowings);

/**
 * GET /api/follows/followers/:username
 * 查詢有哪些人追蹤這個人
 */
router.get("/followers/:username", getFollowers);

export default router;
