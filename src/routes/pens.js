import { Router } from "express";
import db from "../config/db.js";
import { pensTable, penTagsTable, tagsTable } from "../models/schema.js";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { verifyFirebase } from "../middlewares/verifyFirebase.js"
const router = Router();

/**
 * GET /api/pens
 * 取得所有作品
 */
router.get("/", async (req, res) => {
  const pens = await db.select().from(pensTable);
  res.json(pens);
});

/**
 * GET /api/pens/:id
 * 取得單一作品
 */
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await db.select().from(pensTable).where(eq(pensTable.id, id));
  if (result.length === 0) return res.status(404).json({ error: "找不到作品" });
  res.json(result[0]);
});

/**
 * POST /api/pens
 * 新增一份作品（支援標籤）
 * 傳入格式：
 * {
 *   user_id: 1,
 *   title: "My Pen",
 *   html_code: "<h1>Hello</h1>",
 *   tags: ["html", "gsap"]
 * }
 */
router.post("/", verifyFirebase, async (req, res) => {
  const { userId } = req;
  
  const {
    user_id,
    title,
    description,
    html_code,
    css_code,
    js_code,
    resources_css,
    resources_js,
    view_mode,
    is_autosave,
    is_autopreview,
    is_private = false,
    is_deleted = false,
    created_at,
    updated_at,
    deleted_at,
    tags = [],
  } = req.body;

  // 1. 建立作品
  const [newPen] = await db
    .insert(pensTable)
    .values({
      user_id: userId,
      title,
      description,
      html_code,
      css_code,
      js_code,
      resources_css,
      resources_js,
      view_mode,
      is_autosave,
      is_autopreview,
      is_private,
      created_at,
      updated_at,
    })
    .returning();

  // 2. 新增標籤（如果有）
  for (const tagName of tags) {
    // 2-1. 確認標籤是否存在，不存在就新增
    const [tag] = await db
      .insert(tagsTable)
      .values({ name: tagName })
      .onConflictDoNothing()
      .returning();

    // 2-2. 找出 tag.id（從剛新增或原有中查）
    const tagRecord =
      tag ||
      (await db.select().from(tagsTable).where(eq(tagsTable.name, tagName)))[0];
    if (!tagRecord) continue;

    // 2-3. 建立 penTags 關聯
    await db
      .insert(penTagsTable)
      .values({
        pen_id: newPen.id,
        tag_id: tagRecord.id,
      })
      .onConflictDoNothing(); // 避免重複
  }

  res.status(201).json(newPen);
});

/**
 * PUT /api/pens/:id
 * 編輯作品（不包含標籤）
 */
router.put("/:id", verifyFirebase, async (req, res) => {
  const { userId } = req;
  const id = parseInt(req.params.id);
  const work = (await db.select().from(pensTable).where(eq(pensTable.id, id)))[0];
  
  const {
    title,
    description,
    html_code,
    css_code,
    js_code,
    resources_css,
    resources_js,
    view_mode,
    is_autosave,
    is_autopreview,
    is_private = false,
    tags = [],
  } = req.body;
  
  if (!work || work.user_id !== userId) {
    return res.status(403).json({ error: "你沒有權限修改這筆作品" });
  }
  
  const now = new Date();
  const update = await db
  .update(pensTable)
  .set({ 
    title,
    description,
    html_code,
    css_code,
    js_code,
    resources_css,
    resources_js,
    view_mode,
    is_autosave,
    is_autopreview,
    is_private,
    updated_at: now,
    tags, 
  })
  .where(eq(pensTable.id, id))
  .returning();

  if (update.length === 0) return res.status(404).json({ error: "找不到作品" });
  res.json(update[0]);

  // 更新 tags
  // 1. 先刪掉舊的關聯
  await db.delete(penTagsTable).where(eq(penTagsTable.pen_id, id));
  
  // 2. 建立新的關聯
  for (const tagName of tags) {
    // 確保 tag 存在（不存在就建立）
    const [tag] = await db
    .insert(tagsTable)
    .values({ name: tagName })
    .onConflictDoNothing()
    .returning();
    
    const tagRecord =
    tag || (await db.select().from(tagsTable).where(eq(tagsTable.name, tagName)))[0];
    if (!tagRecord) continue;
    
    // 建立新關聯
    await db
    .insert(penTagsTable)
    .values({
      pen_id: id,
      tag_id: tagRecord.id,
    })
    .onConflictDoNothing();
  }
  
  res.json(updatedPen);
  
});
/**
 * PUT /api/pens/:id
 * 暫時刪除作品
 */
router.put("/:id/trash", verifyFirebase, async (req, res) => {
  const { userId } = req;
  const id = parseInt(req.params.id);
  const work = (await db.select().from(pensTable).where(eq(pensTable.id, id)))[0];
  if (!work) return res.status(404).json({ error: "找不到作品" });
  if (work.userId !== userId) return res.status(403).json({ error: "你沒有權限修改這筆作品" });
  const now = new Date();
    const update = await db
    .update(pensTable)
    .set({ deleted_at: now })
    .where(eq(pensTable.id, id))
    .returning();
  res.json({ message: "已丟入垃圾桶，3 天後將自動刪除", data: update[0] });
 
});

async function deleteOldTrash() {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const deleted = await db
    .delete(pensTable)
    .where(sql`${pensTable.deleted_at} IS NOT NULL AND ${pensTable.deleted_at} < ${threeDaysAgo}`);

  console.log(`永久刪除 ${deleted.length || 0} 筆資料`);
}

/**
 * DELETE /api/pens/:id
 * 刪除作品（目前不 cascade 標籤關聯）
 */
router.delete("/:id", async (req, res) => {
  const { userId } = req;
  const id = parseInt(req.params.id);
  req.userId
  await db.delete(pensTable).where(eq(pensTable.id, id));
  res.status(204).end();
});

export default router;
