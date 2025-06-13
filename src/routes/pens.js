import { Router } from "express";
import db from "../config/db.js";
import { pensTable, penTagsTable, tagsTable, usersTable } from "../models/schema.js";
import { and, eq, sql, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { verifyFirebase } from "../middlewares/verifyFirebase.js"
import { verifySelf } from "../middlewares/verifySelf.js"
const router = Router();

/**
 * GET /api/pens
 * 取得所有作品
 */
router.get("/", async (req, res) => {
  const pens = await db.select().from(pensTable);
  const users = await db.select().from(usersTable);
  res.json(pens, users);
});

/**
 * GET /api/pens/:id
 * 取得單一作品
 */
router.get("/:id", verifySelf, async (req, res) => {
  const id = parseInt(req.params.id);
  await db.select().from(pensTable).where(eq(pensTable.id, id));
  const viewerId = req.userId || null
  
  const result = await db
  .select({
    ...pensTable,
    username: usersTable.username,
    display_name: usersTable.display_name,
    profile_image_url: usersTable.profile_image_url,
  })
  .from(pensTable)
  .innerJoin(usersTable, eq(pensTable.user_id, usersTable.id))
  .where(
    and(
      eq(pensTable.id, id),
      eq(pensTable.is_trash, false),
      eq(pensTable.is_deleted, false),
      eq(usersTable.is_deleted, false),
      // 僅作者本人能看 is_private 的作品
      or(eq(pensTable.is_private, false), eq(pensTable.user_id, viewerId))
    )
  );
  if (result.length === 0) return res.status(404).json({ error: "找不到作品" });
  res.json(result[0]);
});

/**
 * POST /api/pens
 * 新增一份作品（支援標籤）
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
  
  if (!work || work.user_id !== userId) {
    return res.status(403).json({ error: "你沒有權限修改這筆作品" });
  }
  
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
  
  const now = new Date();
  const [updatedPen] = await db
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

  if (!updatedPen) return res.status(404).json({ error: "找不到作品" });

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
  if (work.user_id !== userId){ 
    return res.status(403).json({ error: "你沒有權限修改這筆作品" });
  }
  const now = new Date();
    const update = await db
    .update(pensTable)
    .set({ deleted_at: now, is_trash: true })
    .where(eq(pensTable.id, id))
    .returning();
  res.json({ message: "已丟入垃圾桶，3 天後將自動刪除", data: update[0] });
});

router.put("/:id/restore", verifyFirebase, async (req, res) => {
  const { userId } = req;
  const id = parseInt(req.params.id);
  
  const work = (await db.select().from(pensTable).where(eq(pensTable.id, id)))[0];
  if (!work) return res.status(404).json({ error: "找不到作品" });
  if (work.user_id !== userId){ 
    return res.status(403).json({ error: "你沒有權限修改這筆作品" });
  }
  const update = await db
  .update(pensTable)
  .set({ deleted_at: null, is_trash: false })
  .where(eq(pensTable.id, id))
  .returning();
  res.json({ message: "已從垃圾桶復原", data: update[0] });
});

async function deleteOldTrash() {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // 將三天前丟入垃圾桶的資料標記為 is_deleted = true（假刪除）
  const updated = await db
    .update(pensTable)
    .set({ is_deleted: true })
    .where(
      sql`${pensTable.deleted_at} IS NOT NULL AND ${pensTable.deleted_at} < ${threeDaysAgo}`
    );

  console.log(`標記為刪除的筆數：${updated} 筆`);
  }

/**
 * DELETE /api/pens/:id
 * 刪除作品（目前不 cascade 標籤關聯）
 */
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { userId } = req;
  if (!userId) {
    return res.status(401).json({ error: "未授權" });
  }
  const pen = await db
    .select()
    .from(pensTable)
    .where(and(eq(pensTable.id, id), eq(pensTable.user_id, userId)));
  res.status(204).end();
  if (pen.length === 0) {
    return res.status(403).json({ error: "無權限刪除此作品" });
  }
  // 執行軟刪除（建議）
  await db
  .update(pensTable)
  .set({ is_trash: true })
  .where(eq(pensTable.id, id));
});

export default router;
