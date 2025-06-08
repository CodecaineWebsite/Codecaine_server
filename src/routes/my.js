import { Router } from "express";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { getMyPens } from "../controllers/pensController.js";
import db from "../config/db.js";

const router = Router();

/**
 * GET /api/my/pens
 * 搜尋使用者本人作品
 */
router.get("/pens", verifyFirebase, getMyPens);
export default router;
