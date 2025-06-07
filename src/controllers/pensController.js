import db from "../config/db.js";
import { pensTable, penTagsTable, tagsTable } from "../models/schema.js";
import { and, eq, ilike, or, desc, sql } from "drizzle-orm";

export async function getMyPens(req, res) {
  const userId = req.userId; // 由 verifyFirebase middleware 注入
  const {
    q = "",
    privacy = "all",
    tag,
    sort = "updated",
    view = "card",
    page: rawPage = "1"
  } = req.query;

  const page = parseInt(rawPage, 10) || 1;
  const limit = view === "table" ? 10 : 6;
  const offset = (page - 1) * limit;

  // 初始條件：自己的作品 + 非刪除
  const filters = [
    eq(pensTable.user_id, userId),
    eq(pensTable.is_deleted, false),
  ];

  // 關鍵字搜尋
  if (q.trim()) {
    filters.push(or(
      ilike(pensTable.title, `%${q}%`),
      ilike(pensTable.description, `%${q}%`)
    ));
  }

  // 隱私過濾
  if (privacy === "public") filters.push(eq(pensTable.is_private, false));
  if (privacy === "private") filters.push(eq(pensTable.is_private, true));

  try {
    let query = db
      .select()
      .from(pensTable)
      .where(and(...filters));

    // 標籤過濾需要 join tag 表
    if (tag) {
      query = db
        .select()
        .from(pensTable)
        .leftJoin(penTagsTable, eq(pensTable.id, penTagsTable.pen_id))
        .leftJoin(tagsTable, eq(penTagsTable.tag_id, tagsTable.id))
        .where(and(...filters, eq(tagsTable.name, tag)));
    }

    
    if (sort === "created") query = query.orderBy(desc(pensTable.created_at));
    else if (sort === "updated") query = query.orderBy(desc(pensTable.updated_at));
    else if (sort === "popular") query = query.orderBy(desc(pensTable.favorites_count)); // 熱門定義需重新調整

    const pens = await query.limit(limit).offset(offset);

    
    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(pensTable)
      .where(and(...filters));

    res.json({
      total: count,
      page,
      hasNextPage: offset + pens.length < count,
      results: pens
    });
  } catch (err) {
    console.error("取得使用者作品失敗", err);
    res.status(500).json({ error: "伺服器錯誤，無法取得作品列表" });
  }
}