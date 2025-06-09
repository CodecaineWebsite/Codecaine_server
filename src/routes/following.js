import { pensTable, followsTable } from "../models/schema.js";
import { and, eq, inArray, sql, desc, count } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js";
import router from "./auth.js";

router.get("/pens", verifyFirebase, async (req, res) => {
  const userId = req.userId;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 4, 50);
  const offset = (page - 1) * 4;
  const sort = req.query.sort || "recent"; // "recent" | "top"

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // 找出目前 user 追蹤的對象
  const followedRows = await db
    .select({ followedId: followsTable.followed_id })
    .from(followsTable)
    .where(eq(followsTable.follower_id, userId));
  const followedIds = followedRows.map((row) => row.followedId);

  if (followedIds.length === 0) {
    return res.json({
      results: [],
      total: 0,
      totalPages: 0,
      currentPage: page,
    });
  }

  // 排序條件
  const scoreFormula = sql`
    ${pensTable.views_count} * 1 +
    ${pensTable.favorites_count} * 3 +
    ${pensTable.comments_count} * 5 +
    CASE 
      WHEN ${pensTable.created_at} >= ${threeDaysAgo.toISOString()} THEN 10
      ELSE 0
    END
  `;

  const orderBy =
    sort === "top"
      ? [desc(scoreFormula), desc(pensTable.created_at)]
      : [desc(pensTable.created_at)];

  const pens = await db
    .select()
    .from(pensTable)
    .where(inArray(pensTable.user_id, followedIds))
    .orderBy(...orderBy)
    .limit(limit)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(pensTable)
    .where(inArray(pensTable.user_id, followedIds));

  res.json({
    results: pens,
    total,
    totalPages: Math.ceil(total / 4),
    currentPage: page,
  });
});

export default router;
