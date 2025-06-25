import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import {
  getNotifications,
  markAllAsRead,
} from "../controllers/notifyController.js";

const router = Router();

/**
 * GET /api/notify
 * 取得所有通知
 */
router.get("/", verifyFirebase, getNotifications);

/**
 * PATCH /api/notify/read-all
 * 全部標記為已讀
 */
router.patch("/read-all", verifyFirebase, markAllAsRead);

export default router;
