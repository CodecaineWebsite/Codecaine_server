import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { searchMyWork, getUserTags } from "../controllers/yourWorkController.js";

const router = Router();

/**
 * GET /api/my/pens
 * 搜尋使用者本人作品
 */
router.get("/pens", verifyFirebase, searchMyWork);
export default router;

/**
 * GET /api/my/tags
 * 使用者的所有作品中，有使用到的 tag 名稱集合，不重複。
 */
router.get("/tags", verifyFirebase, getUserTags);

