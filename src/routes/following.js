import { pensTable,} from "../models/schema.js";
import { and, inArray, count } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import { validatePaginationParams } from "../middlewares/validatePaginationParams.js";
import { validateSortParam } from "../middlewares/validateSortParam.js";
import { injectFollowedIds } from "../middlewares/injectFollowedId.js";
import { publicPensFilters } from "../utils/filters.js";
import { paginateResponse } from "../utils/paginationResponse.js";
import { listFollowedPens } from "../services/pensService.js";
import db from "../config/db.js";
import express from "express";

const router = express.Router();

router.get(
  "/pens",
  verifyFirebase,
  validatePaginationParams,
  validateSortParam,
  injectFollowedIds,
  async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const { sort, followedIds } = req;
    
    if (followedIds.length === 0) {
      return res.json({
        results: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

;
    try {
      const pens = await listFollowedPens({
        followedIds, limit, offset, sort
      });

      // count 查詢
      const filters = [...publicPensFilters(),inArray(pensTable.user_id, followedIds)];
      const [{ total }] = await db
        .select({ total: count() })
        .from(pensTable)
        .where(and(...filters));

      const response = paginateResponse({ data: pens, total, page, limit });
      res.json(response);
    } catch (err) {
      console.error("Failed to fetch following pens:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
