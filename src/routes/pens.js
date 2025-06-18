import { Router } from "express";
import db from "../config/db.js";
import {
  pensTable,
  penTagsTable,
  tagsTable,
  usersTable,
  favoritesTable,
} from "../models/schema.js";
import { and, eq, sql, desc, or } from "drizzle-orm";
import { verifyFirebase } from "../middlewares/verifyFirebase.js"
import { verifySelf } from "../middlewares/verifySelf.js"
import LRU from 'lru-cache';

const router = Router();

/**
 * GET /api/pens
 * 取得所有作品
 */
router.get("/", async (req, res) => {
  try {
    const pens = await db.select().from(pensTable);
    const users = await db.select().from(usersTable);
    res.json({ pens, users });
  } catch (err) {
    console.error("Failed to fetch pens:", err);
    res.status(500).json({ error: "Failed to fetch pens" });
  }
});

router.get("/trash", verifyFirebase, async (req, res) => {
  try {
    const viewerId = req.userId;
    const results = await db
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
          eq(pensTable.is_trash, true),
          eq(pensTable.is_deleted, false),
          eq(usersTable.is_deleted, false),
          eq(pensTable.user_id, viewerId) // Only user's own trash
        )
      );
    res.json(results);
  } catch (err) {
    console.error("Failed to fetch trashed pens:", err);
    res.status(500).json({ error: "Failed to fetch trashed pens" });
  }
});
/**
 * GET /api/pens/:id
 * 取得單一作品
 */
// GET /api/pens/:id - Get single pen
router.get("/:id", verifySelf, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid pen ID" });
    const viewerId = req.userId || null;
    const result = await db
      .select({
        ...pensTable,
        username: usersTable.username,
        is_pro: usersTable.is_pro,
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
          // Only owner can view private pens
          or(eq(pensTable.is_private, false), eq(pensTable.user_id, viewerId))
        )
      );
    if (result.length === 0) {
      return res.status(404).json({ error: "Pen not found" });
    }
    const pen = result[0];

    const tagRecords = await db
      .select({ name: tagsTable.name })
      .from(penTagsTable)
      .innerJoin(tagsTable, eq(penTagsTable.tag_id, tagsTable.id))
      .where(eq(penTagsTable.pen_id, id));
    const tags = tagRecords.map((t) => t.name);

    const favoriteUsers = await db
      .select({
        display_name: usersTable.display_name,
        username: usersTable.username,
        profile_image_url: usersTable.profile_image_url,
      })
      .from(favoritesTable)
      .innerJoin(usersTable, eq(favoritesTable.user_id, usersTable.id))
      .where(eq(favoritesTable.pen_id, id))
      .orderBy(desc(favoritesTable.created_at))
      .limit(12);


    res.json({
      ...pen,
      tags,
      favorites: favoriteUsers,
    });
  } catch (err) {
    console.error("Failed to fetch pen:", err);
    res.status(500).json({ error: "Failed to fetch pen" });
  }
});

/**
 * POST /api/pens
 * 新增一份作品（支援標籤）
 */
router.post("/", verifyFirebase, async (req, res) => {
  try {
    const { userId } = req;
    const {
      user_id,
      title,
      description,
      html_code,
      css_code,
      js_code,
      htmlPreprocessor,
      cssPreprocessor,
      jsPreprocessor,
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
        htmlPreprocessor,
        cssPreprocessor,
        jsPreprocessor,
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
      if (!tagName || !tagName.trim()) continue;
      // 2-1. 確認標籤是否存在，不存在就新增
      const [tag] = await db
        .insert(tagsTable)
        .values({ name: tagName })
        .onConflictDoNothing()
        .returning();
      // 2-2. 找出 tag.id（從剛新增或原有中查）
      const tagRecord =
        tag ||
        (
          await db
            .select()
            .from(tagsTable)
            .where(eq(tagsTable.name, tagName.trim()))
        )[0];
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
    res.status(201).json({
      message: "Pen created successfully",
      data: newPen,
    });
  } catch (err) {
    console.error("Failed to create pen:", err);
    res.status(500).json({ error: "Failed to create pen" });
  }
});

/**
 * PUT /api/pens/:id
 * 編輯作品（不包含標籤）
 */
router.put("/:id", verifyFirebase, async (req, res) => {
  try {
    const { userId } = req;
    const id = parseInt(req.params.id);
    const work = (
      await db.select().from(pensTable).where(eq(pensTable.id, id))
    )[0];
    if (!work) {
      return res.status(404).json({ error: "Pen not found" });
    }
    if (work.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to update this pen" });
    }
    if (work.is_trash) {
      return res
        .status(400)
        .json({ error: "Cannot update a pen that is in the trash" });
    }
    if (work.is_deleted) {
      return res.status(404).json({ error: "Pen not found" });
    }
    const {
      title,
      description,
      html_code,
      css_code,
      js_code,
      htmlPreprocessor,
      cssPreprocessor,
      jsPreprocessor,
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
        htmlPreprocessor,
        cssPreprocessor,
        jsPreprocessor,
        resources_css,
        resources_js,
        view_mode,
        is_autosave,
        is_autopreview,
        is_private,
        updated_at: now,
      })
      .where(eq(pensTable.id, id))
      .returning();

    if (!updatedPen) return res.status(404).json({ error: "Pen not found" });

    // 更新 tags
    // 1. 先刪掉舊的關聯
    await db.delete(penTagsTable).where(eq(penTagsTable.pen_id, id));

    // 2. 建立新的關聯
    for (const tagName of tags) {
      if (!tagName.trim()) continue; // 避免空字串
      // 確保 tag 存在（不存在就建立）
      const [tag] = await db
        .insert(tagsTable)
        .values({ name: tagName })
        .onConflictDoNothing()
        .returning();

      const tagRecord =
        tag ||
        (
          await db.select().from(tagsTable).where(eq(tagsTable.name, tagName))
        )[0];
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
    res.json({
      message: "Pen updated successfully",
      data: updatedPen,
    });
  } catch (err) {
    console.error("Error updating pen:", err);
    res.status(500).json({ error: "Failed to update pen" });
  }
});


/**
 * PUT /api/pens/:id/view
 * 新增瀏覽數
*/
const viewCache = new LRU({
  max: 10000,
  ttl: 1000 * 60 * 5 
});
router.put('/:id/view', async (req, res) => {
  const penId = parseInt(req.params.id); 
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
  const userId = req.user?.id; // 如果你有驗證中介層
  const key = userId ? `${penId}_user_${userId}` : `${penId}_ip_${ip}`;

  try {
  if (!viewCache.has(key)) {
    await db.update(pensTable)
      .set({ views_count: sql`${pensTable.views_count} + 1` })
      .where(eq(pensTable.id, penId));
    viewCache.set(key, true);
  }
    res.json({ success: true });
  } catch (err) {
    console.error('View count update failed:', err);
    res.status(500).json({ success: false, message: 'Failed to update views count' });
  }
});

/**
 * PUT /api/pens/:id/trash
 * 暫時刪除作品
 */
router.put("/:id/trash", verifyFirebase, async (req, res) => {
  try {
    const { userId } = req;
    const id = parseInt(req.params.id);
    const work = (
      await db.select().from(pensTable).where(eq(pensTable.id, id))
    )[0];

    if (!work) return res.status(404).json({ error: "Pen not found" });
    if (work.user_id !== userId) {
      return res
        .status(403)
        .json({
          error: "You do not have permission to move this pen to trash",
        });
    }
    const now = new Date();
    const [updated] = await db
      .update(pensTable)
      .set({ deleted_at: now, is_trash: true })
      .where(eq(pensTable.id, id))
      .returning();
    res.json({
      message: "Moved to trash. It will be permanently deleted in 3 days.",
      data: updated,
    });
  } catch (err) {
    console.error("Error moving pen to trash:", err);
    res.status(500).json({ error: "Failed to move pen to trash" });
  }
});

/**
 * PUT /api/pens/:id/restore
 * 將作品從垃圾桶還原
 */
router.put("/:id/restore", verifyFirebase, async (req, res) => {
  try {
    const { userId } = req;
    const id = parseInt(req.params.id);

    const work = (
      await db.select().from(pensTable).where(eq(pensTable.id, id))
    )[0];
    if (!work) return res.status(404).json({ error: "Pen not found" });
    if (work.user_id !== userId) {
      return res
        .status(403)
        .json({ error: "You do not have permission to restore this pen" });
    }
    const [updated] = await db
      .update(pensTable)
      .set({ deleted_at: null, is_trash: false })
      .where(eq(pensTable.id, id))
      .returning();
    res.json({ message: "Successfully restored from trash", data: updated });
  } catch (err) {
    console.error("Error restoring pen:", err);
    res.status(500).json({ error: "Failed to restore pen" });
  }
});

async function deleteOldTrash() {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const result = await db
      .update(pensTable)
      .set({ is_deleted: true })
      .where(
        and(
          isNotNull(pensTable.deleted_at),
          lt(pensTable.deleted_at, threeDaysAgo)
        )
      );
    console.log(
      `Soft-deleted ${
        result.rowCount ?? result
      } pens that were trashed more than 3 days ago.`
    );
  } catch (err) {
    console.error("Failed to delete old trashed pens:", err);
  }
}

/**
 * DELETE /api/pens/:id
 * 刪除作品（目前不 cascade 標籤關聯）
 */
router.delete("/:id", verifyFirebase, async (req, res) => {
  const id = parseInt(req.params.id);
  const { userId } = req;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const pen = await db
      .select()
      .from(pensTable)
      .where(and(eq(pensTable.id, id), eq(pensTable.user_id, userId)));
    if (pen.length === 0) {
      return res
        .status(403)
        .json({ error: "You do not have permission to delete this pen" });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve pen" });
    return;
  }

  try {
    await db
      .update(pensTable)
      .set({
        is_deleted: true,
        deleted_at: new Date(),
      })
      .where(eq(pensTable.id, id));
    return res.status(204).end();
  } catch (err) {
    console.error("Failed to delete pen:", err);
    return res.status(500).json({ error: "Failed to delete pen" });
  }
});

export default router;
