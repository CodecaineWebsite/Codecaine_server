import { desc, count, and, eq } from "drizzle-orm";
import { pensTable, usersTable } from "../models/schema.js";
import { validatePaginationParams } from "../middlewares/validatePaginationParams.js";
import { publicPensFilters } from "../utils/filters.js";
import { selectPensColumns, trendingScore } from "../queries/pensSelect.js";
import { paginateResponse } from "../utils/paginationResponse.js";
import db from "../config/db.js";
import express from "express";

const router = express.Router();

router.get("/pens", validatePaginationParams, async (req, res) => {
  const { page, limit: rawLimit } = req.pagination;
  const limit = rawLimit ?? 4;
  const offset = (page - 1) * limit;
  const filters = publicPensFilters();

  try {
    const pens = await db
      .select(selectPensColumns)
      .from(pensTable)
      .leftJoin(usersTable, eq(pensTable.user_id, usersTable.id))
      .where(and(...filters))
      .orderBy(desc(trendingScore()), desc(pensTable.created_at))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(pensTable)
      .where(and(...filters));

    if (total === 0) {
      return res.json({
        results: [],
        total: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    const response = paginateResponse({ data: pens, total, page, limit });

    res.json(response);
  } catch (err) {
    console.error("Failed to fetch trending pens:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
