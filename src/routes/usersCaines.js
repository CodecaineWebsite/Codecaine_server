import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import {
  getUserPublicCaines,
  getUserPrivateCaines,
} from "../controllers/usersCainesController.js";

const router = Router();

/**
 * GET /api/usersCaines
 * 取得該位使用者的所有作品
 */
router.get("/:username/public", getUserPublicCaines);

/**
 * GET /api/usersCaines/:username/private
 * 取得該位使用者的所有私人作品（需驗證身份）
 */
router.get("/:username/private", verifyFirebase, getUserPrivateCaines);

export default router;
