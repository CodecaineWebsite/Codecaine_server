import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { searchYourWork } from "../controllers/yourWorkController.js";

const router = Router();

/**
 * GET /api/my/pens
 * 搜尋使用者本人作品
 */
router.get("/pens", verifyFirebase, searchYourWork);
export default router;
